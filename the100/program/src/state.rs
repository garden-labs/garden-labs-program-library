use anchor_lang::prelude::*;

// Makes testing, redeploying easier
#[account]
#[derive(Debug, InitSpace)]
pub struct ColData {
    pub treasury: Pubkey,
    pub admin: Pubkey,
    pub was_initialized: bool,
}


// TODO: Perhaps GroupPointer could be used instead. 
// It doesn't appear to support non-sequential ndexing right now.
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
