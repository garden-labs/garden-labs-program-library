//! TODO: Doc

use {
    crate::{field_to_seed_str, FIELD_AUTHORITY_PDA_SEED},
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        instruction::{AccountMeta, Instruction},
        program_error::ProgramError,
        pubkey::Pubkey,
        system_program,
    },
    spl_token_metadata_interface::state::Field,
};

/// TODO: Doc
#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct AddFieldAuthority {
    /// TODO: Doc
    pub field: Field,
    /// TODO: Doc
    pub authority: Pubkey,
}

/// TODO: Doc
#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct UpdateFieldWithFieldAuthority {
    /// TODO: Doc
    pub field: Field,
    /// TODO: Doc
    pub value: String,
}

/// TODO: Doc
#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct RemoveFieldAuthority {
    /// TODO: Doc
    pub field: Field,
}

/// TODO: Doc
pub enum FieldAuthorityInstruction {
    /// TODO: Doc, accounts it expects
    AddFieldAuthority(AddFieldAuthority),
    /// TODO: Doc, accounts it expects
    UpdateFieldWithFieldAuthority(UpdateFieldWithFieldAuthority),
    /// TODO: Doc, accounts it expects
    RemoveFieldAuthority(RemoveFieldAuthority),
}

impl FieldAuthorityInstruction {
    /// TODO: Doc
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (discriminator, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;
        Ok(match discriminator {
            0 => {
                let data = AddFieldAuthority::try_from_slice(rest)?;
                Self::AddFieldAuthority(data)
            }
            1 => {
                let data = UpdateFieldWithFieldAuthority::try_from_slice(rest)?;
                Self::UpdateFieldWithFieldAuthority(data)
            }
            2 => {
                let data = RemoveFieldAuthority::try_from_slice(rest)?;
                Self::RemoveFieldAuthority(data)
            }
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }

    /// TODO: Doc
    pub fn pack(&self) -> Vec<u8> {
        let mut buf = vec![];
        match self {
            Self::AddFieldAuthority(data) => {
                buf.extend_from_slice(&[0]);
                buf.append(&mut data.try_to_vec().unwrap());
            }
            Self::UpdateFieldWithFieldAuthority(data) => {
                buf.extend_from_slice(&[1]);
                buf.append(&mut data.try_to_vec().unwrap());
            }
            Self::RemoveFieldAuthority(data) => {
                buf.extend_from_slice(&[2]);
                buf.append(&mut data.try_to_vec().unwrap());
            }
        };
        buf
    }
}

/// Creates `AddFieldAuthority` instruction
pub fn add_field_authority(
    program_id: &Pubkey,
    payer: &Pubkey,
    metadata: &Pubkey,
    update_authority: &Pubkey,
    field: Field,
    field_authority: &Pubkey,
) -> Instruction {
    // Calculate PDA
    let field_seed_str = field_to_seed_str(field.clone());
    let field_pda_seeds = [
        FIELD_AUTHORITY_PDA_SEED.as_bytes(),
        field_seed_str.as_bytes(),
        metadata.as_ref(),
    ];
    let (field_pda, _bump) = Pubkey::find_program_address(&field_pda_seeds, program_id);

    let data = FieldAuthorityInstruction::AddFieldAuthority(AddFieldAuthority {
        field,
        authority: *field_authority,
    });

    Instruction {
        program_id: *program_id,
        accounts: vec![
            AccountMeta::new(*payer, true),
            AccountMeta::new_readonly(*metadata, false),
            AccountMeta::new_readonly(*update_authority, true),
            AccountMeta::new(field_pda, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
        data: data.pack(),
    }
}

/// Creates `UpdateFieldWithFieldAuthority` instruction
pub fn update_field_with_field_authority(
    program_id: &Pubkey,
    metadata: &Pubkey,
    field_authority: &Pubkey,
    field: Field,
    value: String,
) -> Instruction {
    // Calculate PDA
    let field_seed_str = field_to_seed_str(field.clone());
    let field_pda_seeds = [
        FIELD_AUTHORITY_PDA_SEED.as_bytes(),
        field_seed_str.as_bytes(),
        metadata.as_ref(),
    ];
    let (field_pda, _bump) = Pubkey::find_program_address(&field_pda_seeds, program_id);

    let data =
        FieldAuthorityInstruction::UpdateFieldWithFieldAuthority(UpdateFieldWithFieldAuthority {
            field,
            value,
        });

    Instruction {
        program_id: *program_id,
        accounts: vec![
            AccountMeta::new(*metadata, false),
            AccountMeta::new_readonly(*field_authority, true), // To allow charging fees
            AccountMeta::new_readonly(field_pda, false),
        ],
        data: data.pack(),
    }
}

/// Creates `RemoveFieldAuthority` instruction
pub fn remove_field_authority(
    program_id: &Pubkey,
    metadata: &Pubkey,
    update_authority: &Pubkey,
    field: Field,
) -> Instruction {
    // Calculate PDA
    let field_seed_str = field_to_seed_str(field.clone());
    let field_pda_seeds = [
        FIELD_AUTHORITY_PDA_SEED.as_bytes(),
        field_seed_str.as_bytes(),
        metadata.as_ref(),
    ];
    let (field_pda, _bump) = Pubkey::find_program_address(&field_pda_seeds, program_id);

    let data = FieldAuthorityInstruction::RemoveFieldAuthority(RemoveFieldAuthority { field });

    Instruction {
        program_id: *program_id,
        accounts: vec![
            AccountMeta::new(*metadata, false),
            AccountMeta::new_readonly(*update_authority, true),
            AccountMeta::new(field_pda, false),
        ],
        data: data.pack(),
    }
}
