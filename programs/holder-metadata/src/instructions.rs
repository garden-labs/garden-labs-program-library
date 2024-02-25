use crate::constant::HOLDER_METADATA_PDA_SEED;
use crate::state::AnchorField;

use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
#[instruction(field: AnchorField, val: String)]
pub struct UpdateHolderField<'info> {
    pub holder: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: Account checked in CPI
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    #[account(
        associated_token::token_program = token_program,
        associated_token::mint = mint,
        associated_token::authority = holder,
        constraint = holder_token_account.amount > 0,
    )]
    pub holder_token_account: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: Account checked in constraints
    #[account(seeds = [HOLDER_METADATA_PDA_SEED.as_bytes()], bump)]
    pub holder_metadata_pda: UncheckedAccount<'info>,
    /// CHECK: Account checked in CPI
    pub field_pda: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    /// CHECK: Account checked in CPI
    pub field_authority_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
