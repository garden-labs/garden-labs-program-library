//! Implementation of the field authority interface

use {
    crate::processor::check_update_authority,
    borsh::BorshSerialize,
    field_authority_interface::{
        error::FieldAuthorityError,
        field_to_seed_str,
        instruction::{AddFieldAuthority, RemoveFieldAuthority, UpdateFieldWithFieldAuthority},
        state::FieldAuthorityAccount,
        FIELD_AUTHORITY_PDA_SEED,
    },
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        borsh0_10::try_from_slice_unchecked,
        entrypoint::ProgramResult,
        program::invoke_signed,
        program_error::ProgramError,
        pubkey::Pubkey,
        system_instruction, system_program,
        sysvar::{rent::Rent, Sysvar},
    },
    spl_token_metadata_interface::state::TokenMetadata,
    spl_type_length_value::state::{
        realloc_and_pack_first_variable_len, TlvState, TlvStateBorrowed,
    },
};

fn check_metadata_update_authority(
    metadata_info: &AccountInfo,
    update_authority_info: &AccountInfo,
) -> Result<(), ProgramError> {
    let token_metadata = {
        let buffer = metadata_info.try_borrow_data()?;
        let state = TlvStateBorrowed::unpack(&buffer)?;
        state.get_first_variable_len_value::<TokenMetadata>()?
    };
    check_update_authority(update_authority_info, &token_metadata.update_authority)?;
    Ok(())
}

/// TODO: Documentation
pub fn process_add_field_authority(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: AddFieldAuthority,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_info = next_account_info(account_info_iter)?;
    let metadata_info = next_account_info(account_info_iter)?;
    let update_authority_info = next_account_info(account_info_iter)?;
    let field_pda_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    // Check PDA
    let field_seed_str = field_to_seed_str(data.field);
    let field_pda_seeds = [
        FIELD_AUTHORITY_PDA_SEED.as_bytes(),
        field_seed_str.as_bytes(),
        metadata_info.key.as_ref(),
    ];
    let (field_pda, bump) = Pubkey::find_program_address(&field_pda_seeds, program_id);
    if *field_pda_info.key != field_pda {
        return Err(FieldAuthorityError::IncorrectFieldPda.into());
    }

    check_metadata_update_authority(metadata_info, update_authority_info)?;

    // NOTE: Payer account can't have data in it
    // https://solana.stackexchange.com/questions/250/error-processing-instruction-0-invalid-program-argument-while-signing-transfe

    // Create account
    let required_space = FieldAuthorityAccount::space();
    let rent = &Rent::get()?;
    let required_lamports = rent.minimum_balance(required_space);
    let create_account_ix = system_instruction::create_account(
        payer_info.key,
        field_pda_info.key,
        required_lamports,
        required_space as u64,
        program_id,
    );
    let account_infos = [
        payer_info.clone(),
        field_pda_info.clone(),
        system_program_info.clone(),
    ];
    let field_pda_seeds_with_bump = [
        FIELD_AUTHORITY_PDA_SEED.as_bytes(),
        field_seed_str.as_bytes(),
        metadata_info.key.as_ref(),
        &[bump],
    ];
    let signer_seeds = [&field_pda_seeds_with_bump[..]];
    invoke_signed(&create_account_ix, &account_infos, &signer_seeds)?;

    // Write data
    let mut field_pda_data =
        try_from_slice_unchecked::<FieldAuthorityAccount>(&field_pda_info.data.borrow()).unwrap();
    field_pda_data.authority = data.authority;
    field_pda_data.serialize(&mut &mut field_pda_info.data.borrow_mut()[..])?;

    Ok(())
}

/// TODO: Doc
pub fn process_update_field_with_field_authority(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: UpdateFieldWithFieldAuthority,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let metadata_info = next_account_info(account_info_iter)?;
    let field_authority_info = next_account_info(account_info_iter)?;
    let field_pda_info = next_account_info(account_info_iter)?;

    // Deserialize the metadata, but scope the data borrow since we'll probably realloc the account
    let mut token_metadata = {
        let buffer = metadata_info.try_borrow_data()?;
        let state = TlvStateBorrowed::unpack(&buffer)?;
        state.get_first_variable_len_value::<TokenMetadata>()?
    };

    // Check field authority
    let field_pda_data =
        try_from_slice_unchecked::<FieldAuthorityAccount>(&field_pda_info.data.borrow()).unwrap();
    if field_pda_data.authority != *field_authority_info.key {
        return Err(FieldAuthorityError::IncorrectFieldPda.into());
    }

    // Update the field
    token_metadata.update(data.field, data.value);

    // Update / realloc the account
    realloc_and_pack_first_variable_len(metadata_info, &token_metadata)?;

    Ok(())
}

/// TODO: Documentation
pub fn process_remove_field_authority(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: RemoveFieldAuthority,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let metadata_info = next_account_info(account_info_iter)?;
    let update_authority_info = next_account_info(account_info_iter)?;
    let field_pda_info = next_account_info(account_info_iter)?;

    // Check PDA
    let field_seed_str = field_to_seed_str(data.field);
    let seeds = [
        FIELD_AUTHORITY_PDA_SEED.as_bytes(),
        field_seed_str.as_bytes(),
        metadata_info.key.as_ref(),
    ];
    let (pda, _bump) = Pubkey::find_program_address(&seeds, program_id);
    if *field_pda_info.key != pda {
        return Err(ProgramError::InvalidAccountData);
    }

    check_metadata_update_authority(metadata_info, update_authority_info)?;

    // Close account

    // Transfer lamports
    let lamports = field_pda_info.lamports();
    **field_pda_info.try_borrow_mut_lamports()? -= lamports;
    **update_authority_info.try_borrow_mut_lamports()? += lamports;

    // Delete data and set owner to system program
    field_pda_info.assign(&system_program::id());
    field_pda_info.realloc(0, false)?;

    Ok(())
}
