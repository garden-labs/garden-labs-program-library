use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::pubkey::Pubkey,
};

// NOTE: Could be a linked list to extend
#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct FieldAuthorityAccount {
    pub authority: Pubkey,
}

impl FieldAuthorityAccount {
    pub fn space() -> usize {
        std::mem::size_of::<Pubkey>()
    }
}
