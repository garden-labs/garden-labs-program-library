use {
    crate::constants::{THE100_PDA_SEED, TREASURY_PUBKEY_STR},
    anchor_lang::prelude::*,
    gpl_common::get_pubkey,
    spl_token_metadata_interface::state::TokenMetadata,
    spl_type_length_value::state::{TlvState, TlvStateBorrowed},
};

fn get_the100_pda() -> Pubkey {
    let (pda, _bump) = Pubkey::find_program_address(&[THE100_PDA_SEED.as_bytes()], &crate::ID);
    return pda;
}

pub fn get_metadata_init_vals(index: u16, mint: Pubkey) -> Result<TokenMetadata> {
    let init_vals = TokenMetadata {
        name: format!("the100 Channel #{}", index),
        symbol: "THE100".to_string(),
        uri: format!("https://firebasestorage.googleapis.com/v0/b/the100-f61ce.appspot.com/o/uri%2F{}.json?alt=media", index - 1),
        update_authority: Some(get_the100_pda()).try_into().unwrap(),
        mint,
        ..Default::default()
    };
    return Ok(init_vals);
}

pub fn get_treasury_pubkey() -> Pubkey {
    return get_pubkey(TREASURY_PUBKEY_STR).unwrap();
}
