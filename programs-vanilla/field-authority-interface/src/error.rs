//! Interface error types

use solana_program::program_error::ProgramError;
use thiserror::Error;

/// Errors that may be returned by the interface.
#[derive(Error, Debug, Copy, Clone, PartialEq)]
pub enum FieldAuthorityError {
    /// Error 0: Incorrect field PDA provided
    #[error("Incorrect field PDA was passed to the instruction")]
    IncorrectFieldPda,
}

impl From<FieldAuthorityError> for ProgramError {
    fn from(e: FieldAuthorityError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
