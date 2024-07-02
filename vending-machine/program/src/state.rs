use crate::constants::{MAX_NAME_PREFIX_LEN, MAX_SYMBOL_LEN, MAX_URI_PREFIX_LEN};
use crate::errors::VendingMachineError;

use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct VendingMachineData {
    pub admin: Pubkey,            // 32
    pub treasury: Pubkey,         // 32
    pub max_supply: u16,          // 2
    pub mint_price_lamports: u64, // 8
    #[max_len(MAX_NAME_PREFIX_LEN)]
    pub name_prefix: String, // 32
    #[max_len(MAX_SYMBOL_LEN)]
    pub symbol: String, // 32
    #[max_len(MAX_URI_PREFIX_LEN)]
    pub uri_prefix: String, // 200
}

impl VendingMachineData {
    pub fn validate(&self) -> Result<()> {
        require!(
            self.name_prefix.len() <= MAX_NAME_PREFIX_LEN,
            VendingMachineError::NamePrefixTooLong
        );
        require!(
            self.symbol.len() <= MAX_SYMBOL_LEN,
            VendingMachineError::SymbolTooLong
        );
        require!(
            self.uri_prefix.len() <= MAX_URI_PREFIX_LEN,
            VendingMachineError::UriPrefixTooLong
        );
        Ok(())
    }
}
