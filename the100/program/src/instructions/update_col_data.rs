use {crate::state::ColData, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct UpdateColData<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub admin: Signer<'info>,

    #[account(
        mut,
        constraint = col_data.admin == admin.key(),
    )]
    pub col_data: Account<'info, ColData>,

    pub system_program: Program<'info, System>,
}

pub fn handle_update_col_data(
    ctx: Context<UpdateColData>,
    admin: Pubkey,
    treasury: Pubkey,
) -> Result<()> {
    // Set data
    ctx.accounts.col_data.admin = admin;
    ctx.accounts.col_data.treasury = treasury;

    Ok(())
}
