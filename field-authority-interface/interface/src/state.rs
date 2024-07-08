use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::pubkey::Pubkey,
};

// NOTE: Currently only a single field authority is supported via a PDA
// We could extend this to support multiple field authorities and use a TLV structure to store them
// That said, single authorities may be simpler for authority programs / PDAs
#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct FieldAuthorityAccount {
    pub authority: Pubkey,
}

impl FieldAuthorityAccount {
    pub fn space() -> usize {
        std::mem::size_of::<Pubkey>()
    }
}
