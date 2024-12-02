use {
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        token_interface::{
            Mint, TokenAccount, TokenInterface,
        },
    },
};

#[derive(Accounts)]
pub struct InitIfNeeded<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: We're just creating an ATA for them
    pub user: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

pub fn handle_init_if_needed(_ctx: Context<InitIfNeeded>) -> Result<()> {
    Ok(())
}
