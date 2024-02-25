use anchor_lang::prelude::*;

#[account]
pub struct AiAliensPda {
    pub max_supply: u16,          // 2
    pub mint_price_lamports: u64, // 8
}

impl AiAliensPda {
    pub const LEN: usize = 2 + 8 + 8; // Extra 8 bytes for account discriminator
}

#[account]
pub struct NftMintedPda {
    pub mint: Pubkey, // 32
}

impl NftMintedPda {
    pub const LEN: usize = 32 + 8; // Extra 8 bytes for account discriminator
}
