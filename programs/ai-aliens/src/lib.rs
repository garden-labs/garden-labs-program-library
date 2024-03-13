pub mod constant;
pub mod error;
pub mod helper;
pub mod instructions;
pub mod processor;
pub mod state;

use instructions::*;
use processor::*;

use anchor_lang::prelude::*;
use holder_metadata::state::AnchorField;

declare_id!("GMwH9gmtUNJH9H7xs4jLT22BL5GKrh8JePviUSqL1LJt");

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

    pub fn create_mint(ctx: Context<CreateMint>, index: u16) -> Result<()> {
        return handle_create_mint(ctx, index);
    }

    pub fn create_token(ctx: Context<CreateToken>) -> Result<()> {
        return handle_create_token(ctx);
    }

    pub fn update_field(ctx: Context<UpdateField>, field: AnchorField, val: String) -> Result<()> {
        return handle_update_field(ctx, field, val);
    }
}
