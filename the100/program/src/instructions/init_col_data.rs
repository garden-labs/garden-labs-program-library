use {crate::state::ColData, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct InitColData<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
      init,
      payer = payer,
      space = ColData::INIT_SPACE + 8,
    )]
    pub col_data: Account<'info, ColData>,

    pub system_program: Program<'info, System>,
}

pub fn handle_init_col_data(
    ctx: Context<InitColData>,
    admin: Pubkey,
    treasury: Pubkey,
) -> Result<()> {
    // Set data
    ctx.accounts.col_data.admin = admin;
    ctx.accounts.col_data.treasury = treasury;

    Ok(())
}
