use anchor_lang::prelude::*;

#[error_code]
pub enum VendingMachineError {
    #[msg("The name prefix is too long")]
    NamePrefixTooLong,
    #[msg("The symbol is too long")]
    SymbolTooLong,
    #[msg("The URI prefix is too long")]
    UriPrefixTooLong,
}
