pub mod constant;
pub mod error;
pub mod helper;
pub mod instructions;
pub mod processor;
pub mod state;

use instructions::*;
use processor::*;

use anchor_lang::prelude::*;

declare_id!("YJSJjSkjboK5TtWYgMHKTQLCi38NiSkabvRa8iCV9g3");

#[program]
pub mod ai_aliens {
    use super::*;

    pub fn update_state(
        ctx: Context<UpdateState>,
        max_supply: u16,
        mint_price_lamports: u64,
    ) -> Result<()> {
        return handle_update_state(ctx, max_supply, mint_price_lamports);
    }

    pub fn create_nft(ctx: Context<CreateNft>, index: u16) -> Result<()> {
        return handle_create_nft(ctx, index);
    }

    pub fn create_token(ctx: Context<CreateToken>) -> Result<()> {
        return handle_create_token(ctx);
    }
}
