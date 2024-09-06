use anchor_lang::prelude::*;

#[error_code]
pub enum The100Error {
    #[msg("The public key is invalid")]
    InvalidPublicKey,
    #[msg("Index out of bounds")]
    IndexOutOfBounds,
}
