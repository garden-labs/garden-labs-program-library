use crate::constant::{DUMMY_PUBKEY_STR, METADATA_PROGRAM_ID_STR};
use crate::error::AiAliensError;
use spl_token_metadata_interface::state::TokenMetadata;

use anchor_lang::prelude::*;
use std::str::FromStr;

fn get_pubkey(str: &str) -> Result<Pubkey> {
    Pubkey::from_str(str).map_err(|_| AiAliensError::InvalidPublicKey.into())
}

fn get_dummy_pubkey() -> Result<Pubkey> {
    return get_pubkey(DUMMY_PUBKEY_STR);
}

pub fn get_metadata_program_id() -> Result<Pubkey> {
    return get_pubkey(METADATA_PROGRAM_ID_STR);
}

pub fn get_token_metadata_init_vals(
    index: u16,
    update_authority: Pubkey,
    mint: Pubkey,
) -> Result<TokenMetadata> {
    let uri = format!("https://firebasestorage.googleapis.com/v0/b/ai-aliens.appspot.com/o/uri%2F{}.json?alt=media", index);

    let token_metadata = TokenMetadata {
        name: format!("AI Alien #{}", index),
        symbol: "AIALIENS".to_string(),
        uri,
        update_authority: Some(update_authority).try_into().unwrap(),
        mint,
        ..Default::default()
    };
    return Ok(token_metadata);
}

// We need to start with this because setting a new field always creates space
pub fn get_token_metadata_init_space(index: u16) -> Result<usize> {
    let dummy_pubkey: Pubkey = get_dummy_pubkey()?;

    let dummy_token_metadata = get_token_metadata_init_vals(index, dummy_pubkey, dummy_pubkey)?;

    return Ok(dummy_token_metadata.tlv_size_of().unwrap());
}

pub fn get_token_metadata_max_space(index: u16) -> Result<usize> {
    let dummy_pubkey: Pubkey = get_dummy_pubkey()?;

    let mut dummy_token_metadata = get_token_metadata_init_vals(index, dummy_pubkey, dummy_pubkey)?;

    // Add nickname additional field with max string length
    let dummy_max_str = std::iter::repeat('a').take(30).collect();
    dummy_token_metadata.additional_metadata.push((
        crate::constant::NICKNAME_FIELD_KEY.to_string(),
        dummy_max_str,
    ));

    return Ok(dummy_token_metadata.tlv_size_of().unwrap());
}
