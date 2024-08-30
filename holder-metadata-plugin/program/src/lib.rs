pub mod constants;
pub mod instructions;
pub mod processor;

pub use constants::HOLDER_METADATA_PDA_SEED;

use instructions::*;
use processor::*;

use anchor_lang::prelude::*;
use gpl_util::AnchorField;

declare_id!("3DkEmKWuBJbza9ur1BnVVhXrzkuiMCqBuKHdoDBdLpxZ");

#[program]
pub mod holder_metadata_plugin {
    use super::*;

    pub fn update_holder_field(
        ctx: Context<UpdateHolderField>,
        field: AnchorField,
        val: String,
    ) -> Result<()> {
        return handle_update_holder_field(ctx, field, val);
    }

    pub fn update_holder_field_v2(
        ctx: Context<UpdateHolderFieldV2>,
        field: AnchorField,
        val: String,
    ) -> Result<()> {
        return handle_update_holder_field_v2(ctx, field, val);
    }
}
