use solana_program::program_error::ProgramError;
use thiserror::Error;

/// Errors that may be returned by the interface.
#[derive(Error, Debug, Copy, Clone, PartialEq)]
pub enum FieldAuthorityError {
    /// Error 0: Incorrect field PDA provided
    #[error("Incorrect field PDA was passed to the instruction")]
    IncorrectFieldPda,
    /// Error 1: Incorrect field authority provided
    #[error("Incorrect field authority was passed to the instruction")]
    /// Error 3: Field authority already exists in metadata account
    IncorrectFieldAuthority,
    #[error("Field authority already exists in metadata account")]
    FieldAuthorityAlreadyExists,
    /// Error 3: Field authority not found in metadata account
    #[error("Field authority not found in metadata account")]
    FieldAuthorityNotFound,
}

impl From<FieldAuthorityError> for ProgramError {
    fn from(e: FieldAuthorityError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
