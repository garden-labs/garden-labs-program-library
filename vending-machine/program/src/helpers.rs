use crate::constants::{
    ADVANCED_TOKEN_METADATA_PROGRAM_ID_STR, TREASURY_PUBKEY_STR, VENDING_MACHINE_PDA_SEED,
};
use crate::state::VendingMachineData;

use anchor_lang::prelude::*;
use gpl_util::{get_dummy_pubkey, get_pubkey};
use spl_token_metadata_interface::state::TokenMetadata;

fn get_vending_machine_pda() -> Pubkey {
    let (pda, _bump) =
        Pubkey::find_program_address(&[VENDING_MACHINE_PDA_SEED.as_bytes()], &crate::ID);
    return pda;
}

pub fn get_col_metadata_init_vals(mint: Pubkey, data: VendingMachineData) -> TokenMetadata {
    let token_metadata = TokenMetadata {
        name: data.name,
        symbol: data.symbol,
        uri: format!("{}{}.json", data.uri, "collection"),
        update_authority: Some(get_vending_machine_pda()).try_into().unwrap(),
        mint,
        ..Default::default()
    };
    return token_metadata;
}

pub fn get_member_metadata_init_vals(
    index: u64,
    mint: Pubkey,
    data: VendingMachineData,
) -> TokenMetadata {
    let token_metadata = TokenMetadata {
        name: format!("{} #{}", data.name, index),
        symbol: data.symbol,
        uri: format!("{}{}.json", data.uri, index),
        update_authority: Some(get_vending_machine_pda()).try_into().unwrap(),
        mint,
        ..Default::default()
    };
    return token_metadata;
}

// We need to start with this because setting a new field always creates space
pub fn get_member_metadata_init_space(index: u64, data: VendingMachineData) -> usize {
    let dummy_pubkey: Pubkey = get_dummy_pubkey();
    let dummy_token_metadata = get_member_metadata_init_vals(index, dummy_pubkey, data);
    return dummy_token_metadata.tlv_size_of().unwrap();
}

// TODO: Export this out of crate
pub fn get_advanced_token_metadata_program_id() -> Result<Pubkey> {
    return get_pubkey(ADVANCED_TOKEN_METADATA_PROGRAM_ID_STR);
}

pub fn get_treasury_pubkey() -> Pubkey {
    return get_pubkey(TREASURY_PUBKEY_STR).unwrap();
}
