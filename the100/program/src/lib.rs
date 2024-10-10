pub mod constants;
pub mod errors;
pub mod helpers;
pub mod instructions;
pub mod state;

use instructions::*;

use anchor_lang::prelude::*;

declare_id!("GPsudi35ndUQzhUuUn1Z9mCZWrJGbPLdsmMzP9LUzmbz");

#[program]
pub mod the_100 {
    use super::*;

    pub fn mint_nft(ctx: Context<MintNft>, index: u16) -> Result<()> {
        return handle_mint_nft(ctx, index);
    }

    pub fn update_holder_field(
        ctx: Context<UpdateHolderField>,
        field: String,
        val: String,
    ) -> Result<()> {
        return handle_update_holder_field(ctx, field, val);
    }
}
