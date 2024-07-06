use crate::constants::{MAX_NAME_LEN, MAX_SYMBOL_LEN, MAX_URI_LEN};
use crate::errors::VendingMachineError;

use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct VendingMachineData {
    pub admin: Pubkey,            // 32
    pub creator: Pubkey,          // 32
    pub max_supply: u16,          // 2
    pub mint_price_lamports: u64, // 8
    #[max_len(MAX_NAME_LEN)]
    pub name: String, // 32
    #[max_len(MAX_SYMBOL_LEN)]
    pub symbol: String, // 32
    #[max_len(MAX_URI_LEN)]
    pub uri: String, // 200
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
