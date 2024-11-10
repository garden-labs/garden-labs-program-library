use {crate::{errors::The100Error, state::ColData}, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct SetColData<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
      init_if_needed,
      payer = payer,
      space = ColData::INIT_SPACE + 8,
    )]
    pub col_data: Account<'info, ColData>,

    pub system_program: Program<'info, System>,
}

pub fn handle_set_col_data(ctx: Context<SetColData>, admin: Pubkey, treasury: Pubkey) -> Result<()> {
    // If initialized, check admin
    if ctx.accounts.col_data.was_initialized {
        require!(ctx.accounts.payer.key() == ctx.accounts.col_data.admin, The100Error::NotAdminOfColData);
    }

    // Set data
    ctx.accounts.col_data.admin = admin;
    ctx.accounts.col_data.treasury = treasury;
    ctx.accounts.col_data.was_initialized = true;

    Ok(())
}
