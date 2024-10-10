use {
    crate::state_v2,
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::pubkey::Pubkey,
};

// Re-export
pub use state_v2::*;

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct FieldAuthorityAccount {
    pub authority: Pubkey,
}

impl FieldAuthorityAccount {
    pub fn space() -> usize {
        std::mem::size_of::<Pubkey>()
    }
}
