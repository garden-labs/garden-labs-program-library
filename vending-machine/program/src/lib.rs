use anchor_lang::prelude::*;

declare_id!("DMdzKuw3G1PmPkb1GdxMAWHkAyDAwW72SiM11BFW3cib");

#[program]
pub mod vending_machine {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
