use {
    crate::{constants::VENDING_MACHINE_PDA_SEED, state::VendingMachineData},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(data: VendingMachineData)]
pub struct Init<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Account checked in constraints
    #[account(seeds = [VENDING_MACHINE_PDA_SEED.as_bytes()], bump)]
    pub vending_machine_pda: UncheckedAccount<'info>,

    #[account(init, payer = payer, space = VendingMachineData::INIT_SPACE + 8)]
    pub vending_machine_data: Account<'info, VendingMachineData>,

    pub system_program: Program<'info, System>,
}

pub fn handle_init(ctx: Context<Init>, data: VendingMachineData) -> Result<()> {
    // Copy data to account
    let vending_machine_data_account = &mut ctx.accounts.vending_machine_data;
    **vending_machine_data_account = data;

    Ok(())
}
