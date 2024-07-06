use crate::constants::{VENDING_MACHINE_PDA_SEED, PROTOCOL_FEE_LAMPORTS};
use crate::VendingMachineData;
use crate::helpers::{get_advanced_token_metadata_program_id, get_member_metadata_init_space, get_member_metadata_init_vals, get_treasury_pubkey};

use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::{instruction::AuthorityType, extension::{
        // Needed for contraints
        group_member_pointer::GroupMemberPointer, metadata_pointer::MetadataPointer,
        mint_close_authority::MintCloseAuthority, permanent_delegate::PermanentDelegate,
        transfer_hook::TransferHook,
    }},
    token_interface::{
        mint_to, MintTo, Mint,
        Token2022, TokenAccount, set_authority, SetAuthority
    },
};

// TODO: Store / use name, symbol, uri, in collection mint only
#[derive(Accounts)]
#[instruction(index: u64)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Account checked in constraints
    #[account(mut, constraint = treasury.key() == get_treasury_pubkey())]
    pub treasury: UncheckedAccount<'info>,
    /// CHECK: We're just giving them a token
    #[account()]
    pub receiver: UncheckedAccount<'info>,
    /// CHECK: Account checked in constraints
    #[account(mut, constraint = creator.key() == vending_machine_data.creator)]
    pub creator: UncheckedAccount<'info>,
    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = vending_machine_pda, // Set to None in ix after mint token
        mint::freeze_authority = vending_machine_pda,
        extensions::metadata_pointer::authority = vending_machine_pda,
        extensions::metadata_pointer::metadata_address = metadata,
        extensions::group_member_pointer::authority = vending_machine_pda,
        extensions::group_member_pointer::member_address = mint,
        extensions::transfer_hook::authority = vending_machine_pda,
        extensions::transfer_hook::program_id = crate::ID,
        extensions::permanent_delegate::delegate = vending_machine_pda,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    // NOTE: ImmutableOwner initialized by default in Token2022
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = receiver,
        associated_token::token_program = token_program,
    )]
    pub receiver_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    // TODO: Use Token Metadata struct here?
    /// CHECK: Account checked in constraints
    #[account(
        init,
        signer,
        payer = payer,
        space = get_member_metadata_init_space(index, (*vending_machine_data).clone()),
        owner = metadata_program.key(),
    )]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: Account checked in constraints
    #[account(
        seeds = [VENDING_MACHINE_PDA_SEED.as_bytes()],
        bump
    )]
    pub vending_machine_pda: UncheckedAccount<'info>,
    pub vending_machine_data: Account<'info, VendingMachineData>,
    /// CHECK: Account checked in constraints
    #[account(
        executable, 
        constraint = metadata_program.key() == get_advanced_token_metadata_program_id()?
    )]
    pub metadata_program: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

fn pay_protocol_fee(ctx: &Context<MintNft>) -> Result<()> {
    let ix = &anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.payer.key,
        ctx.accounts.treasury.key,
        PROTOCOL_FEE_LAMPORTS,
    );
    let accounts = &[
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.treasury.to_account_info(),
    ];
    anchor_lang::solana_program::program::invoke(ix, accounts)?;

    Ok(())
}

fn pay_mint_fee(ctx: &Context<MintNft>) -> Result<()> {
    let ix = &anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.payer.key,
        &ctx.accounts.creator.key,
        ctx.accounts.vending_machine_data.mint_price_lamports,
    );
    let accounts = &[
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.creator.to_account_info(),
    ];
    anchor_lang::solana_program::program::invoke(ix, accounts)?;

    Ok(())
}

fn init_metadata(ctx: &Context<MintNft>, index: u64) -> Result<()> {
    let token_metadata = get_member_metadata_init_vals(
        index,
        ctx.accounts.mint.key(),
        (*ctx.accounts.vending_machine_data).clone(),
    );

    // TODO: Use Anchor CPI instead (see Init)

    let ix = spl_token_metadata_interface::instruction::initialize(
        ctx.accounts.metadata_program.key,
        &ctx.accounts.metadata.key(),
        &Option::<Pubkey>::from(token_metadata.update_authority).unwrap(),
        &ctx.accounts.mint.key(),
        &ctx.accounts.vending_machine_pda.key(),
        token_metadata.name,
        token_metadata.symbol,
        token_metadata.uri,
    );
    let accounts = [
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.vending_machine_pda.to_account_info(),
        ctx.accounts.mint.to_account_info(),
    ];
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[VENDING_MACHINE_PDA_SEED.as_bytes(), &[ctx.bumps.vending_machine_pda]];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    invoke_signed(&ix, &accounts, signer_seeds)?;

    Ok(())
}

fn create_token(ctx: &Context<MintNft>) -> Result<()> {
    let accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.receiver_ata.to_account_info(),
        authority: ctx.accounts.vending_machine_pda.to_account_info(),
    };
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[VENDING_MACHINE_PDA_SEED.as_bytes(), &[ctx.bumps.vending_machine_pda]];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    let mint_to_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), accounts, signer_seeds);
    mint_to(mint_to_ctx, 1)?;

    Ok(())
}

fn nullify_mint_authority(ctx: &Context<MintNft>) -> Result<()> {
    let accounts = SetAuthority {
        current_authority: ctx.accounts.vending_machine_pda.to_account_info(),
        account_or_mint: ctx.accounts.mint.to_account_info(),
    };
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[VENDING_MACHINE_PDA_SEED.as_bytes(), &[ctx.bumps.vending_machine_pda]];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    let set_authority_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), accounts, signer_seeds);
    set_authority(set_authority_ctx, AuthorityType::MintTokens, None)?;

    Ok(())
}

pub fn handle_mint_nft(ctx: Context<MintNft>, index: u64) -> Result<()> {
    // TODO: Check NFT has been minted (via group ?)

    pay_protocol_fee(&ctx)?;
    pay_mint_fee(&ctx)?;

    init_metadata(&ctx, index)?;

    create_token(&ctx)?;

    nullify_mint_authority(&ctx)?;

    // TODO: Setup member

    Ok(())
}
