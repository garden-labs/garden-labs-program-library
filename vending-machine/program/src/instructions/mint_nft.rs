use crate::constants::{PROTOCOL_FEE_LAMPORTS, VENDING_MACHINE_PDA_SEED};
use crate::helpers::{
    get_advanced_token_metadata_program_id, get_member_metadata_init_space,
    get_member_metadata_init_vals, get_treasury_pubkey,
};
use crate::VendingMachineData;

use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::{
        extension::{
            // Needed for contraints
            group_member_pointer::GroupMemberPointer,
            metadata_pointer::MetadataPointer,
            mint_close_authority::MintCloseAuthority,
            permanent_delegate::PermanentDelegate,
            transfer_hook::TransferHook,
        },
        instruction::AuthorityType,
    },
    token_interface::{
        mint_to, set_authority, token_metadata_initialize, token_metadata_update_field, Mint,
        MintTo, SetAuthority, Token2022, TokenAccount, TokenMetadataInitialize,
        TokenMetadataUpdateField,
    },
};
use gpl_util::reach_minimum_rent;
use holder_metadata_plugin::{state::AnchorField, HOLDER_METADATA_PDA_SEED};

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
        // TODO: Implement royalties with transfer hook
        // extensions::transfer_hook::program_id = crate::ID,
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

    /// CHECK: Account checked in constraints
    #[account(
        init,
        signer,
        payer = payer,
        // TODO: Remove this and just rely on reach_minimum_balance() ?
        space = get_member_metadata_init_space(index, (**vending_machine_data).clone()),
        owner = metadata_program.key(),
    )]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Account checked in constraints
    #[account(
        seeds = [VENDING_MACHINE_PDA_SEED.as_bytes()],
        bump
    )]
    pub vending_machine_pda: UncheckedAccount<'info>,

    pub vending_machine_data: Box<Account<'info, VendingMachineData>>,

    /// CHECK: Account checked in CPI
    #[account(mut)]
    pub field_pda: UncheckedAccount<'info>,
    // Need to keep on one line to not break rust-analyzer formatting
    /// CHECK: Account checked in constraints
    #[account(
        executable, constraint = metadata_program.key() == get_advanced_token_metadata_program_id()?
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
        (**ctx.accounts.vending_machine_data).clone(),
    );

    let accounts = TokenMetadataInitialize {
        token_program_id: ctx.accounts.metadata_program.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        metadata: ctx.accounts.metadata.to_account_info(),
        mint_authority: ctx.accounts.vending_machine_pda.to_account_info(),
        update_authority: ctx.accounts.vending_machine_pda.to_account_info(),
    };
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[
        VENDING_MACHINE_PDA_SEED.as_bytes(),
        &[ctx.bumps.vending_machine_pda],
    ];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.metadata_program.to_account_info(),
        accounts,
        signer_seeds,
    );
    token_metadata_initialize(
        cpi_ctx,
        token_metadata.name,
        token_metadata.symbol,
        token_metadata.uri,
    )?;

    Ok(())
}

fn create_token(ctx: &Context<MintNft>) -> Result<()> {
    let accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.receiver_ata.to_account_info(),
        authority: ctx.accounts.vending_machine_pda.to_account_info(),
    };
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[
        VENDING_MACHINE_PDA_SEED.as_bytes(),
        &[ctx.bumps.vending_machine_pda],
    ];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    let mint_to_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        accounts,
        signer_seeds,
    );
    mint_to(mint_to_ctx, 1)?;

    Ok(())
}

fn nullify_mint_authority(ctx: &Context<MintNft>) -> Result<()> {
    let accounts = SetAuthority {
        current_authority: ctx.accounts.vending_machine_pda.to_account_info(),
        account_or_mint: ctx.accounts.mint.to_account_info(),
    };
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[
        VENDING_MACHINE_PDA_SEED.as_bytes(),
        &[ctx.bumps.vending_machine_pda],
    ];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    let set_authority_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        accounts,
        signer_seeds,
    );
    set_authority(set_authority_ctx, AuthorityType::MintTokens, None)?;

    Ok(())
}

fn init_member(ctx: &Context<MintNft>) -> Result<()> {
    // TODO: Implement

    Ok(())
}

fn add_holder_field(ctx: &Context<MintNft>) -> Result<()> {
    // Grab holder field if set, otherwise return
    let holder_field_key = match &ctx.accounts.vending_machine_data.holder_field_key {
        Some(key) => key.clone(),
        None => return Ok(()),
    };

    // Grab holder metadata plugin PDA
    let holder_metadata_pda_seeds = [HOLDER_METADATA_PDA_SEED.as_bytes()];
    let (holder_metadata_pda, _bump) =
        Pubkey::find_program_address(&holder_metadata_pda_seeds, &holder_metadata_plugin::id());

    // Add holder field
    let ix = &field_authority_interface::instructions::add_field_authority(
        ctx.accounts.metadata_program.key,
        &ctx.accounts.payer.key(),
        &ctx.accounts.metadata.key(),
        &ctx.accounts.vending_machine_pda.key(),
        spl_token_metadata_interface::state::Field::Key(holder_field_key.clone()),
        &holder_metadata_pda,
    );
    let accounts = &[
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.vending_machine_pda.to_account_info(),
        ctx.accounts.field_pda.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    ];
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[
        VENDING_MACHINE_PDA_SEED.as_bytes(),
        &[ctx.bumps.vending_machine_pda],
    ];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    invoke_signed(ix, accounts, signer_seeds)?;

    // TODO: Refactor setting values to its own method (or its own instruction)

    // Grab default value if it exists
    let holder_field_default_val = match &ctx.accounts.vending_machine_data.holder_field_default_val
    {
        Some(key) => key.clone(),
        None => return Ok(()),
    };

    // Set default value if it exists
    if !holder_field_default_val.is_empty() {
        let accounts = TokenMetadataUpdateField {
            token_program_id: ctx.accounts.metadata_program.to_account_info(),
            metadata: ctx.accounts.metadata.to_account_info(),
            update_authority: ctx.accounts.vending_machine_pda.to_account_info(),
        };
        let vending_machine_pda_seeds: &[&[u8]; 2] = &[
            VENDING_MACHINE_PDA_SEED.as_bytes(),
            &[ctx.bumps.vending_machine_pda],
        ];
        let signer_seeds = &[&vending_machine_pda_seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.metadata_program.to_account_info(),
            accounts,
            signer_seeds,
        );
        token_metadata_update_field(
            cpi_ctx,
            spl_token_metadata_interface::state::Field::Key(holder_field_key.clone()),
            holder_field_default_val,
        )?;
    }

    // Add rent
    reach_minimum_rent(
        ctx.accounts.payer.clone(),
        ctx.accounts.metadata.to_account_info(),
    )?;

    Ok(())
}

pub fn handle_mint_nft(ctx: Context<MintNft>, index: u64) -> Result<()> {
    // TODO: Check NFT has been minted (via group ?)

    pay_protocol_fee(&ctx)?;
    pay_mint_fee(&ctx)?;

    init_metadata(&ctx, index)?;

    create_token(&ctx)?;

    nullify_mint_authority(&ctx)?;

    // TODO: Initialize member
    // Group not enabled on Token2022 yet: https://github.com/solana-developers/program-examples/blob/main/tokens/token-2022/group/anchor/programs/group/src/lib.rs
    // init_member(&ctx)?;

    // TODO: Add multiple holder fields once field authority interface is
    // switched from PDA model to single tlv account
    add_holder_field(&ctx)?;

    Ok(())
}
