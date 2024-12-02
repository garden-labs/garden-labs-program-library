pub mod instructions;

use instructions::*;

use anchor_lang::prelude::*;

declare_id!("5HgftVXMq36xbvsuAd1wANdQnVTm9Zw7EQuXmke5Uqqw");

#[program]
pub mod toolkit {
    use super::*;

    pub fn init_if_needed(ctx: Context<InitIfNeeded>) -> Result<()> {
        return handle_init_if_needed(ctx);
    }
}
