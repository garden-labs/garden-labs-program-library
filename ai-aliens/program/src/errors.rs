use anchor_lang::prelude::*;

#[error_code]
pub enum AiAliensError {
    #[msg("Index is above max supply or below 1.")]
    IndexOutOfBounds,
    #[msg("Invalid public key.")]
    InvalidPublicKey,
}
