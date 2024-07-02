pub mod constants;
pub mod errors;
pub mod helpers;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

use anchor_lang::prelude::*;

declare_id!("Uvwz29jANqCpX5F2zMHo5NMZc5MdC23ss8gTUnsEJAY");

#[program]
pub mod vending_machine {
    use super::*;

    pub fn init(ctx: Context<Init>, data: VendingMachineData) -> Result<()> {
        return handle_init(ctx, data);
    }

    pub fn mint_nft(ctx: Context<MintNft>, index: u64) -> Result<()> {
        return handle_mint_nft(ctx, index);
    }
}
