use {
    crate::constants::{
        ADVANCED_TOKEN_METADATA_PROGRAM_ID_STR, TREASURY_PUBKEY_STR, VENDING_MACHINE_PDA_SEED,
    },
    anchor_lang::prelude::*,
    field_authority_interface::state::FieldAuthorities,
    gpl_util::get_pubkey,
    spl_token_metadata_interface::state::TokenMetadata,
    spl_type_length_value::state::{TlvState, TlvStateBorrowed},
};

fn get_vending_machine_pda() -> Pubkey {
    let (pda, _bump) =
        Pubkey::find_program_address(&[VENDING_MACHINE_PDA_SEED.as_bytes()], &crate::ID);
    return pda;
}

pub fn parse_token_metadata(metadata_account: AccountInfo) -> Result<TokenMetadata> {
    let buffer = metadata_account.try_borrow_data()?;
    let state = TlvStateBorrowed::unpack(&buffer)?;
    let metadata = state.get_first_variable_len_value::<TokenMetadata>()?;
    return Ok(metadata);
}

pub fn parse_field_authorities(metadata_account: AccountInfo) -> Result<FieldAuthorities> {
    let buffer = metadata_account.try_borrow_data()?;
    let state = TlvStateBorrowed::unpack(&buffer)?;
    let field_authorities = state.get_first_variable_len_value::<FieldAuthorities>()?;
    return Ok(field_authorities);
}

// NOTE: We don't copy the `update_authority` value because using the vending machine PDA would
// require us to implement the metadata initialization in this program.
pub fn get_metadata_init_vals(
    index: u64,
    mint: Pubkey,
    metadata_template: AccountInfo,
) -> Result<TokenMetadata> {
    let template_vals = parse_token_metadata(metadata_template)?;

    let init_vals = TokenMetadata {
        name: format!("{} #{}", template_vals.name, index),
        symbol: template_vals.symbol,
        uri: format!("{}{}.json", template_vals.uri, index),
        update_authority: Some(get_vending_machine_pda()).try_into().unwrap(),
        mint,
        ..Default::default()
    };
    return Ok(init_vals);
}

pub fn get_init_space(index: u64, mint: Pubkey, metadata_template: AccountInfo) -> Result<usize> {
    let init_vals = get_metadata_init_vals(index, mint, metadata_template.clone())?;
    let field_authorities = parse_field_authorities(metadata_template)?;

    let init_vals_space = init_vals.tlv_size_of()?;
    let field_authorities_space = field_authorities.tlv_size_of()?;

    return Ok(init_vals_space + field_authorities_space);
}

// TODO: Export this out of crate
pub fn get_advanced_token_metadata_program_id() -> Result<Pubkey> {
    return get_pubkey(ADVANCED_TOKEN_METADATA_PROGRAM_ID_STR);
}

pub fn get_treasury_pubkey() -> Pubkey {
    return get_pubkey(TREASURY_PUBKEY_STR).unwrap();
}
