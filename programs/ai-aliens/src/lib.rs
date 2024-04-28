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

declare_id!("48MKwUN9uxxGrFCzXAV4kF5RPMVUyruLyYnapNynNtd4");

#[program]
pub mod ai_aliens {
    use super::*;

    pub fn init(
        ctx: Context<Init>,
        admin: Pubkey,
        treasury: Pubkey,
        max_supply: u16,
        mint_price_lamports: u64,
    ) -> Result<()> {
        return handle_init(ctx, admin, treasury, max_supply, mint_price_lamports);
    }

    pub fn update_state(
        ctx: Context<UpdateState>,
        admin: Pubkey,
        treasury: Pubkey,
        max_supply: u16,
        mint_price_lamports: u64,
    ) -> Result<()> {
        return handle_update_state(ctx, admin, treasury, max_supply, mint_price_lamports);
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

    pub fn nullify_mint_authority(ctx: Context<NullifyMintAuthority>, index: u16) -> Result<()> {
        return handle_nullify_mint_authority(ctx, index);
    }
}
