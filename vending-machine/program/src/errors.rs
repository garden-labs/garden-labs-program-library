use anchor_lang::prelude::*;

#[error_code]
pub enum VendingMachineError {
    #[msg("Index out of bounds")]
    IndexOutOfBounds,
    #[msg("Invalid metadata template")]
    InvalidMetadataTemplate,
}
