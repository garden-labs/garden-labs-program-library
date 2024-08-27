use crate::constants::{
    MAX_HOLDER_FIELDS, MAX_HOLDER_FIELD_LEN, MAX_NAME_LEN, MAX_SYMBOL_LEN, MAX_URI_LEN,
};
use crate::errors::VendingMachineError;

use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct VendingMachineData {
    pub admin: Pubkey,
    pub creator: Pubkey,
    pub max_supply: u64,
    pub mint_price_lamports: u64,
    pub col_mint: Pubkey,

    // These are used for the group NFTs and member NFTs (with name and uri as prefixes)
    #[max_len(MAX_NAME_LEN)]
    pub name: String,
    #[max_len(MAX_SYMBOL_LEN)]
    pub symbol: String,
    #[max_len(MAX_URI_LEN)]
    pub uri: String,

    #[max_len(MAX_HOLDER_FIELDS, MAX_HOLDER_FIELD_LEN)]
    pub holder_fields: Vec<String>,
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

        if let Some(holder_field_key) = &self.holder_field_key {
            require!(
                holder_field_key.len() <= MAX_HOLDER_FIELD_KEY_LEN,
                VendingMachineError::HolderFieldKeyTooLong
            );
        }

        if let Some(holder_field_default_val) = &self.holder_field_default_val {
            require!(
                self.holder_field_key.is_some(),
                VendingMachineError::HolderFieldKeyRequiredForDefaultVal
            );

            require!(
                holder_field_default_val.len() <= MAX_HOLDER_FIELD_VAL_LEN,
                VendingMachineError::HolderFieldDefaultValTooLong
            );
        }

        // TODO: Move to Vec once field authority interface is switched from
        // PDA model to single tlv account
        // require!(
        //     self.holder_fields.len() <= MAX_HOLDER_FIELDS,
        //     VendingMachineError::HolderFieldsTooMany
        // );
        // for key_value in &self.holder_fields {
        //     require!(
        //         key_value.len() == 2,
        //         VendingMachineError::HolderFieldWrongStructure
        //     );
        //     for el in key_value {
        //         require!(
        //             el.len() <= MAX_HOLDER_FIELD_LEN,
        //             VendingMachineError::HolderFieldTooLong
        //         );
        //     }
        // }

        Ok(())
    }
}

#[account]
#[derive(Debug, InitSpace)]
pub struct MemberPda {
    pub mint: Pubkey,
}
