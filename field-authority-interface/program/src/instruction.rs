use {
    crate::{field_to_seed_str, FIELD_AUTHORITY_PDA_SEED},
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        instruction::{AccountMeta, Instruction},
        program_error::ProgramError,
        pubkey::Pubkey,
        system_program,
    },
    spl_discriminator::{discriminator::ArrayDiscriminator, SplDiscriminate},
    spl_token_metadata_interface::state::Field,
};

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, SplDiscriminate)]
#[discriminator_hash_input("field_interface_interface:add_field_authority")]
pub struct AddFieldAuthority {
    pub field: Field,
    pub authority: Pubkey,
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, SplDiscriminate)]
#[discriminator_hash_input("field_interface_interface:update_field_with_field_authority")]
pub struct UpdateFieldWithFieldAuthority {
    pub field: Field,
    pub value: String,
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, SplDiscriminate)]
#[discriminator_hash_input("field_interface_interface:remove_field_authority")]
pub struct RemoveFieldAuthority {
    pub field: Field,
}

pub enum FieldAuthorityInstruction {
    AddFieldAuthority(AddFieldAuthority),
    UpdateFieldWithFieldAuthority(UpdateFieldWithFieldAuthority),
    RemoveFieldAuthority(RemoveFieldAuthority),
}

impl FieldAuthorityInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        if input.len() < ArrayDiscriminator::LENGTH {
            return Err(ProgramError::InvalidInstructionData);
        }
        let (discriminator, rest) = input.split_at(ArrayDiscriminator::LENGTH);
        Ok(match discriminator {
            AddFieldAuthority::SPL_DISCRIMINATOR_SLICE => {
                let data = AddFieldAuthority::try_from_slice(rest)?;
                Self::AddFieldAuthority(data)
            }
            UpdateFieldWithFieldAuthority::SPL_DISCRIMINATOR_SLICE => {
                let data = UpdateFieldWithFieldAuthority::try_from_slice(rest)?;
                Self::UpdateFieldWithFieldAuthority(data)
            }
            RemoveFieldAuthority::SPL_DISCRIMINATOR_SLICE => {
                let data = RemoveFieldAuthority::try_from_slice(rest)?;
                Self::RemoveFieldAuthority(data)
            }
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }

    pub fn pack(&self) -> Vec<u8> {
        let mut buf = vec![];
        match self {
            Self::AddFieldAuthority(data) => {
                buf.extend_from_slice(AddFieldAuthority::SPL_DISCRIMINATOR_SLICE);
                buf.append(&mut data.try_to_vec().unwrap());
            }
            Self::UpdateFieldWithFieldAuthority(data) => {
                buf.extend_from_slice(UpdateFieldWithFieldAuthority::SPL_DISCRIMINATOR_SLICE);
                buf.append(&mut data.try_to_vec().unwrap());
            }
            Self::RemoveFieldAuthority(data) => {
                buf.extend_from_slice(RemoveFieldAuthority::SPL_DISCRIMINATOR_SLICE);
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
            AccountMeta::new_readonly(*field_authority, true),
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
