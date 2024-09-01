use {
    crate::{
        constants::{
            ADVANCED_TOKEN_METADATA_PROGRAM_ID_STR, TREASURY_PUBKEY_STR, VENDING_MACHINE_PDA_SEED,
        },
        errors::VendingMachineError,
    },
    anchor_lang::prelude::*,
    gpl_util::{get_dummy_pubkey, get_pubkey},
    spl_token_metadata_interface::state::TokenMetadata,
    spl_type_length_value::state::{TlvState, TlvStateBorrowed},
};

fn get_vending_machine_pda() -> Pubkey {
    let (pda, _bump) =
        Pubkey::find_program_address(&[VENDING_MACHINE_PDA_SEED.as_bytes()], &crate::ID);
    return pda;
}

pub fn get_metadata_init_vals(
    index: u64,
    mint: Pubkey,
    metadata_template: AccountInfo,
) -> Result<TokenMetadata> {
    let buffer = metadata_template.data.borrow();
    let state = TlvStateBorrowed::unpack(&buffer)
        .map_err(|_| error!(VendingMachineError::InvalidMetadataTemplate))?;
    let metadata_template_vals = state
        .get_first_variable_len_value::<TokenMetadata>()
        .map_err(|_| error!(VendingMachineError::InvalidMetadataTemplate))?;

    let token_metadata = TokenMetadata {
        name: format!("{} #{}", metadata_template_vals.name, index),
        symbol: metadata_template_vals.symbol,
        uri: format!("{}{}.json", metadata_template_vals.uri, index),
        update_authority: Some(get_vending_machine_pda()).try_into().unwrap(),
        mint,
        ..Default::default()
    };
    return Ok(token_metadata);
}

pub fn get_metadata_init_space(
    index: u64,
    mint: Pubkey,
    metadata_template: AccountInfo,
) -> Result<usize> {
    let token_metadata = get_metadata_init_vals(index, mint, metadata_template)?;
    return token_metadata
        .tlv_size_of()
        .map_err(|_| error!(VendingMachineError::InvalidMetadataTemplate));
}

// TODO: Export this out of crate
pub fn get_advanced_token_metadata_program_id() -> Result<Pubkey> {
    return get_pubkey(ADVANCED_TOKEN_METADATA_PROGRAM_ID_STR);
}

pub fn get_treasury_pubkey() -> Pubkey {
    return get_pubkey(TREASURY_PUBKEY_STR).unwrap();
}
