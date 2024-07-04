use crate::constants::{VENDING_MACHINE_PDA_SEED, PROTOCOL_FEE_LAMPORTS};
use crate::VendingMachineData;
use crate::helpers::{get_advanced_token_metadata_program_id, get_token_metadata_init_space, get_treasury_pubkey};

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::extension::{
        group_member_pointer::GroupMemberPointer, metadata_pointer::MetadataPointer,
        mint_close_authority::MintCloseAuthority, permanent_delegate::PermanentDelegate,
        transfer_hook::TransferHook,
    },
    token_interface::{
        mint_to, MintTo, spl_token_metadata_interface::state::TokenMetadata, token_metadata_initialize, Mint,
        Token2022, TokenAccount, TokenMetadataInitialize,
    },
};

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
        mint::authority = vending_machine_pda, // Set to None in instruction
        mint::freeze_authority = vending_machine_pda, // Set to None in instruction
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
    // Use Token Metadata struct here?
    /// CHECK: Account checked in constraints
    #[account(
        init,
        signer,
        payer = payer,
        space = get_token_metadata_init_space(index, (*vending_machine_data).clone()),
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

fn create_token(ctx: &Context<MintNft>) -> Result<()> {
    let mint_to_ctx = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.receiver_ata.to_account_info(),
        authority: ctx.accounts.vending_machine_pda.to_account_info(),
    };
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[VENDING_MACHINE_PDA_SEED.as_bytes(), &[ctx.bumps.vending_machine_pda]];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    let accounts = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), mint_to_ctx, signer_seeds);
    mint_to(accounts, 1)?;

    Ok(())
}

pub fn handle_mint_nft(ctx: Context<MintNft>, index: u64) -> Result<()> {
    // TODO: Check Nft has been minted (via group member pointer)

    pay_protocol_fee(&ctx)?;
    pay_mint_fee(&ctx)?;

    // TODO: Initialize metadata

    create_token(&ctx)?;

    // TODO: Set mint and freeze authorities to None

    Ok(())
}
