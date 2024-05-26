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
