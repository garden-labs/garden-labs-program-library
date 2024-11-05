use anchor_lang::prelude::*;

// Makes testing, redeploying easier
#[account]
#[derive(Debug, InitSpace)]
pub struct ColData {
    pub treasury: Pubkey,
    pub admin: Pubkey,
}

// TODO: Perhaps GroupPointer could be used instead – doesn't appear to support non-sequential
// indexing right now. Hashes are also probably better than sequential indexing.
#[account]
#[derive(Debug, InitSpace)]
pub struct MemberPda {
    pub mint: Pubkey,
    pub col_data: Pubkey,
}

pub struct HolderFieldConfig {
    pub name: &'static str,
    pub max_len: u8,
}
