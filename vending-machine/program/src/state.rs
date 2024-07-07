use crate::constants::{MAX_NAME_LEN, MAX_SYMBOL_LEN, MAX_URI_LEN};
use crate::errors::VendingMachineError;

use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct VendingMachineData {
    pub admin: Pubkey,
    pub creator: Pubkey,
    pub max_supply: u32,
    pub mint_price_lamports: u64,
    #[max_len(MAX_NAME_LEN)]
    pub name: String,
    #[max_len(MAX_SYMBOL_LEN)]
    pub symbol: String,
    #[max_len(MAX_URI_LEN)]
    pub uri: String,
    // TODO: Royalties
}

impl VendingMachineData {
    pub fn validate(&self) -> Result<()> {
        require!(
            self.name.len() <= MAX_NAME_LEN,
            VendingMachineError::NameTooLong
        );
        require!(
            self.symbol.len() <= MAX_SYMBOL_LEN,
            VendingMachineError::SymbolTooLong
        );
        require!(
            self.uri.len() <= MAX_URI_LEN,
            VendingMachineError::UriTooLong
        );
        Ok(())
    }
}
