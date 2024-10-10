use {
    anchor_lang::prelude::*,
    spl_token_metadata_interface::state::Field,
    spl_type_length_value::state::{TlvState, TlvStateBorrowed},
    std::str::FromStr,
};

#[error_code]
pub enum GplError {
    #[msg("The public key is invalid")]
    InvalidPublicKey,
}

pub const DUMMY_PUBKEY_STR: &str = "EiH1P1VKhRm9DSMQikddHPs96Zm4cHKiQ87C3DBU7mrv";

pub fn get_pubkey(str: &str) -> Result<Pubkey> {
    Pubkey::from_str(str).map_err(|_| GplError::InvalidPublicKey.into())
}

pub fn get_dummy_pubkey() -> Pubkey {
    return get_pubkey(DUMMY_PUBKEY_STR).unwrap();
}

pub fn reach_minimum_rent<'info>(payer: Signer<'info>, account: AccountInfo<'info>) -> Result<()> {
    let min_rent = Rent::get()?.minimum_balance(account.data_len());
    let delta = min_rent.saturating_sub(account.get_lamports());
    if delta > 0 {
        let ix = &anchor_lang::solana_program::system_instruction::transfer(
            payer.key,
            account.key,
            delta,
        );
        let accounts = &[payer.to_account_info(), account];
        anchor_lang::solana_program::program::invoke(ix, accounts)?;
    }

    Ok(())
}

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
