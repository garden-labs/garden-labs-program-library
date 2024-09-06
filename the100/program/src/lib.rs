pub mod constants;
pub mod errors;
pub mod helpers;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

use anchor_lang::prelude::*;

declare_id!("AhDyfXr5yj89XsPjKt3z1VjjVqwi5v43PYfDXA3NbEWC");

#[program]
pub mod the100 {
    use super::*;

    pub fn mint_nft(ctx: Context<MintNft>, index: u16) -> Result<()> {
        return handle_mint_nft(ctx, index);
    }
}
