use {crate::state::ColData, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct SetColData<'info> {
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

pub fn handle_set_col_data(ctx: Context<SetColData>) -> Result<()> {
    Ok(())
}
