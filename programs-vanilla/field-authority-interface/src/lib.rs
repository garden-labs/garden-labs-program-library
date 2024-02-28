//! Crate defining the field authority interface

#![allow(clippy::arithmetic_side_effects)]
#![cfg_attr(not(test), forbid(unsafe_code))]

pub mod constant;
pub mod error;
pub mod helper;
pub mod instruction;
pub mod state;

pub use constant::*;
pub use helper::*;

// Export current sdk types for downstream users building with a different sdk version
// Export borsh for downstream users
pub use {borsh, solana_program};
