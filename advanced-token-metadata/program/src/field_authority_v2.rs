//! Implementation of the field authority interface v2

use {
    crate::field_authority::check_metadata_update_authority,
    field_authority_interface::{
        errors::FieldAuthorityError,
        instructions_v2::{InitializeFieldAuthorities, UpdateFieldWithFieldAuthorityV2},
        state::FieldAuthorities,
    },
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        program_error::ProgramError,
        pubkey::Pubkey,
    },
    spl_token_metadata_interface::state::Field,
    // TlvState needed for get_first_variable_len_value()
    spl_type_length_value::state::{TlvState, TlvStateBorrowed, TlvStateMut},
};

/// Proccesses an InitializeFieldAuthorities instruction
pub fn process_initialize_field_authorities(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: InitializeFieldAuthorities,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let metadata_info = next_account_info(account_info_iter)?;
    let update_authority_info = next_account_info(account_info_iter)?;

    check_metadata_update_authority(metadata_info, update_authority_info)?;

    // Create field authorities
    let field_authorities = FieldAuthorities {
        authorities: data.authorities,
    };

    // Allocate a TLV entry for the space and write it in
    let mut buffer = metadata_info.try_borrow_mut_data()?;
    let mut state = TlvStateMut::unpack(&mut buffer)?;
    // TODO: Perhaps could use realloc here to not require the initial account creation? We'll
    // keep alloc for now to match TokenMetadata
    state.alloc_and_pack_variable_len_entry(&field_authorities, false)?;

    Ok(())
}

// /// Proccesses an AddFieldAuthorityV2 instruction
// pub fn process_add_field_authority_v2(
//     _program_id: &Pubkey,
//     accounts: &[AccountInfo],
//     data: AddFieldAuthorityV2,
// ) -> ProgramResult {
//     let account_info_iter = &mut accounts.iter();
//     let metadata_info = next_account_info(account_info_iter)?;
//     let update_authority_info = next_account_info(account_info_iter)?;

//     check_metadata_update_authority(metadata_info, update_authority_info)?;

//     // Field authorities are stored in metadata account
//     let mut field_authorities = {
//         let buffer = metadata_info.try_borrow_data()?;
//         let state = TlvStateBorrowed::unpack(&buffer)?;
//         state.get_first_variable_len_value::<FieldAuthorities>()?
//     };

//     // Add field authority
//     field_authorities.add_field_authority(data.field, data.authority);

//     // Update / realloc the account
//     realloc_and_pack_first_variable_len(metadata_info, &field_authorities)?;

//     Ok(())
// }

/// Proccesses an UpdateFieldWithFieldAuthorityV2 instruction
pub fn process_update_field_with_field_authority_v2(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: UpdateFieldWithFieldAuthorityV2,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let metadata_info = next_account_info(account_info_iter)?;
    let field_authority_info = next_account_info(account_info_iter)?;

    // Check field authority
    let field_authorities = {
        let buffer = metadata_info.try_borrow_data()?;
        let state = TlvStateBorrowed::unpack(&buffer)?;
        state.get_first_variable_len_value::<FieldAuthorities>()?
    };
    if !field_authorities.contains_field_authority(data.field, field_authority_info.key.clone()) {
        return Err(FieldAuthorityError::IncorrectFieldAuthority.into());
    }
    if !field_authority_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    Ok(())
}