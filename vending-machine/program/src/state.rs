use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct VendingMachineData {
    pub admin: Pubkey,
    pub creator: Pubkey,
    pub metadata_template: Pubkey,
    pub max_supply: u64,
    pub mint_price_lamports: u64,
}

// TODO: Perhaps GroupPointer could be used instead – doesn't appear to support non-sequential
// indexing right now. Hashes are also probably better than sequential indexing.
#[account]
#[derive(Debug, InitSpace)]
pub struct MemberPda {
    pub mint: Pubkey,
}
