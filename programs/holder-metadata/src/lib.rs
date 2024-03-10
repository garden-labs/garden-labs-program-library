pub mod constant;
pub mod instructions;
pub mod processor;
pub mod state;

pub use constant::HOLDER_METADATA_PDA_SEED;

use instructions::*;
use processor::*;
use state::AnchorField;

use anchor_lang::prelude::*;

declare_id!("HmpaxJsTQKyYrRaVhArZdLFj8rvRhgU5BJso6usHJdXx");

#[program]
pub mod holder_metadata {
    use super::*;

    pub fn update_holder_field(
        ctx: Context<UpdateHolderField>,
        field: AnchorField,
        val: String,
    ) -> Result<()> {
        return handle_update_holder_field(ctx, field, val);
    }
}
