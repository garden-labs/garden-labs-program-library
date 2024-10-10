use anchor_lang::prelude::*;

// TODO: Perhaps GroupPointer could be used instead – doesn't appear to support non-sequential
// indexing right now. Hashes are also probably better than sequential indexing.
#[account]
#[derive(Debug, InitSpace)]
pub struct MemberPda {
    pub mint: Pubkey,
}

pub struct HolderFieldConfig {
    pub name: &'static str,
    pub max_len: u8,
}
