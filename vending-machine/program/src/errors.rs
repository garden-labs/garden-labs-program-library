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
    #[msg("There are too many holder fields")]
    HolderFieldsTooMany,
    #[msg("Holder field isn't an array of size two for key-value pair")]
    HolderFieldWrongStructure,
    #[msg("Holder field is too long")]
    HolderFieldKeyTooLong,
    #[msg("Holder field default value is too long")]
    HolderFieldDefaultValTooLong,
    #[msg("Holder field value is set without a holder field")]
    HolderFieldKeyRequiredForDefaultVal,
    #[msg("Holder field and Field PDA mismatch")]
    FieldPdaMismatch,
}
