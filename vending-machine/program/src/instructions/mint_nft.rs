use crate::constants::VENDING_MACHINE_PDA_SEED;
use crate::VendingMachineData;
use crate::helpers::{get_advanced_token_metadata_program_id, get_token_metadata_init_space};

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::extension::{
        group_member_pointer::GroupMemberPointer, metadata_pointer::MetadataPointer,
        mint_close_authority::MintCloseAuthority, permanent_delegate::PermanentDelegate,
        transfer_hook::TransferHook,
    },
    token_interface::{
        spl_token_metadata_interface::state::TokenMetadata, token_metadata_initialize, Mint,
        Token2022, TokenAccount, TokenMetadataInitialize,
    },
};

#[derive(Accounts)]
#[instruction(index: u64)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Account checked in constraints
    #[account(mut, constraint = treasury.key() == vending_machine_data.treasury)]
    pub treasury: UncheckedAccount<'info>,
    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        
        // TODO: Change these to None, in the constraint if possible, otherwise
        // in the instruction
        mint::authority = vending_machine_pda,
        mint::freeze_authority = vending_machine_pda,

        extensions::metadata_pointer::authority = vending_machine_pda,
        extensions::metadata_pointer::metadata_address = metadata,
        // TODO: Additional extensions
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
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
    // TODO: Remove this account and just use its public key?
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

pub fn handle_mint_nft(ctx: Context<MintNft>, index: u64) -> Result<()> {
    // TODO: Use collection pointer to determine if mint exists

    Ok(())
}
