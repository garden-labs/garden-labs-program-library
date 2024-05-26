use anchor_lang::prelude::*;
use spl_token_metadata_interface::state::Field;

#[account]
pub struct AiAliensPda {
    pub admin: Pubkey,            // 32
    pub treasury: Pubkey,         // 32
    pub max_supply: u16,          // 2
    pub mint_price_lamports: u64, // 8
}

impl AiAliensPda {
    pub const LEN: usize = 32 + 32 + 2 + 8 + 8; // Extra 8 bytes for account discriminator
}

#[account]
pub struct NftMintedPda {
    pub mint: Pubkey, // 32
}

impl NftMintedPda {
    pub const LEN: usize = 32 + 8; // Extra 8 bytes for account discriminator
}

// TEMP: Needed to export AnchorField type for IDL
// Remove when this PR passes: https://github.com/coral-xyz/anchor/pull/2824

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
