use anchor_lang::prelude::*;

use crate::state::VendingMachineData;

pub fn handle_init(ctx: Context<Init>, data: VendingMachineData) -> Result<()> {
    // Validate fields
    data.validate()?;

    // Copy data to account
    let vending_machine_data_account = &mut ctx.accounts.vending_machine_data;
    **vending_machine_data_account = data;

    Ok(())
}

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer = payer, space = 8 + VendingMachineData::INIT_SPACE)]
    pub vending_machine_data: Account<'info, VendingMachineData>,
    pub system_program: Program<'info, System>,
}
