//! TODO: Doc

use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::pubkey::Pubkey,
};

// NOTE: Could be a linked list to extend
/// TODO: Docs
#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct FieldAuthorityAccount {
    /// TODO: Docs
    pub authority: Pubkey,
}

impl FieldAuthorityAccount {
    /// TODO: Doc
    pub fn space() -> usize {
        std::mem::size_of::<Pubkey>()
    }
}
