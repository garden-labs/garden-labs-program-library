use anchor_lang::prelude::*;

#[error_code]
pub enum The100Error {
    #[msg("Index out of bounds")]
    IndexOutOfBounds,
    #[msg("Invalid holder field")]
    InvalidHolderField,
}
