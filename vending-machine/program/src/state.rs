use crate::constants::{
    MAX_HOLDER_FIELD_KEY_LEN, MAX_HOLDER_FIELD_VAL_LEN, MAX_NAME_LEN, MAX_SYMBOL_LEN, MAX_URI_LEN,
};
use crate::errors::VendingMachineError;

use anchor_lang::prelude::*;
use spl_token_metadata_interface::state::Field;

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum AnchorField {
    Name,
    Symbol,
    Uri,
    Key(String),
}

impl From<AnchorField> for Field {
    fn from(anchor_field: AnchorField) -> Self {
        match anchor_field {
            AnchorField::Name => Field::Name,
            AnchorField::Symbol => Field::Symbol,
            AnchorField::Uri => Field::Uri,
            AnchorField::Key(key) => Field::Key(key),
        }
    }
}

impl From<Field> for AnchorField {
    fn from(field: Field) -> Self {
        match field {
            Field::Name => AnchorField::Name,
            Field::Symbol => AnchorField::Symbol,
            Field::Uri => AnchorField::Uri,
            Field::Key(key) => AnchorField::Key(key),
        }
    }
}

impl AnchorField {
    pub fn seed_str(&self) -> String {
        match self {
            AnchorField::Name => "name".to_string(),
            AnchorField::Symbol => "symbol".to_string(),
            AnchorField::Uri => "uri".to_string(),
            AnchorField::Key(key) => format!("key:{}", key),
        }
    }
}

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
    // TODO: Move to Vec once field authority interface is switched from
    // PDA model to single tlv account
    // We will only allow holder fields in additional fields
    // #[max_len(10, MAX_HOLDER_FIELD_LEN)]
    // pub holder_fields: Vec<String>>,
    #[max_len(MAX_HOLDER_FIELD_KEY_LEN)]
    pub holder_field_key: Option<String>, // Empty string means no holder field
    #[max_len(MAX_HOLDER_FIELD_VAL_LEN)]
    pub holder_field_default_val: Option<String>, // Empty string means no default value
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
