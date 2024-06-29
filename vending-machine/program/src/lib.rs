pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

use anchor_lang::prelude::*;

declare_id!("DMdzKuw3G1PmPkb1GdxMAWHkAyDAwW72SiM11BFW3cib");

#[program]
pub mod vending_machine {
    use super::*;

    pub fn init(ctx: Context<Init>, data: VendingMachineData) -> Result<()> {
        data.validate()?;

        return handle_init(ctx, data);
    }
}
