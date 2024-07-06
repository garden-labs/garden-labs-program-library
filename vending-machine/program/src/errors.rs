use anchor_lang::prelude::*;

#[error_code]
pub enum VendingMachineError {
    #[msg("The name prefix is too long")]
    NameTooLong,
    #[msg("The symbol is too long")]
    SymbolTooLong,
    #[msg("The URI prefix is too long")]
    UriTooLong,
    #[msg("The public key is invalid")]
    InvalidPublicKey,
}
