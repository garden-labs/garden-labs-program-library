use crate::constants::VENDING_MACHINE_PDA_SEED;
use crate::VendingMachineData;

use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};
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
// use spl_pod::optional_keys::OptionalNonZeroPubkey;

#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Account checked in constraints
    #[account(mut, constraint = treasury.key() == vending_machine_data.treasury)]
    pub treasury: UncheckedAccount<'info>,
    // #[account(
    //     init,
    //     signer,
    //     payer = payer,
    //     mint::token_program = token_program,
    //     mint::decimals = 0,
    //     mint::authority = None,
    //     mint::freeze_authority = None,
    //     // TODO: Set this to PDA
    //     extensions::metadata_pointer::authority = vending_machine_pda.key(),
    // )]
    // pub mint: Box<InterfaceAccount<'info, Mint>>,
    // TODO: Remove this account and just use its public key?
    /// CHECK: Account checked in constraints
    #[account(
        seeds = [VENDING_MACHINE_PDA_SEED.as_bytes()],
        bump
    )]
    pub vending_machine_pda: UncheckedAccount<'info>,
    pub vending_machine_data: Account<'info, VendingMachineData>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_mint_nft(ctx: Context<MintNft>) -> Result<()> {
    // TODO: Use collection pointer to determine if mint exists

    Ok(())
}
