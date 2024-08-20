use {
    crate::{
        field_to_seed_str,
        instructions_v2::{
            AddFieldAuthorityV2, InitializeFieldAuthorities, RemoveFieldAuthorityV2,
            UpdateFieldWithFieldAuthorityV2,
        },
        FIELD_AUTHORITY_PDA_SEED,
    },
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
#[discriminator_hash_input("field_authority_interface:add_field_authority")]
pub struct AddFieldAuthority {
    pub field: Field,
    pub authority: Pubkey,
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, SplDiscriminate)]
#[discriminator_hash_input("field_authority_interface:update_field_with_field_authority")]
pub struct UpdateFieldWithFieldAuthority {
    pub field: Field,
    pub value: String,
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, SplDiscriminate)]
#[discriminator_hash_input("field_authority_interface:remove_field_authority")]
pub struct RemoveFieldAuthority {
    pub field: Field,
}

pub enum FieldAuthorityInstruction {
    InitializeFieldAuthorities(InitializeFieldAuthorities),
    AddFieldAuthority(AddFieldAuthority),
    AddFieldAuthorityV2(AddFieldAuthorityV2),
    UpdateFieldWithFieldAuthority(UpdateFieldWithFieldAuthority),
    UpdateFieldWithFieldAuthorityV2(UpdateFieldWithFieldAuthorityV2),
    RemoveFieldAuthority(RemoveFieldAuthority),
    RemoveFieldAuthorityV2(RemoveFieldAuthorityV2),
}

impl FieldAuthorityInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        if input.len() < ArrayDiscriminator::LENGTH {
            return Err(ProgramError::InvalidInstructionData);
        }
        let (discriminator, rest) = input.split_at(ArrayDiscriminator::LENGTH);
        Ok(match discriminator {
            InitializeFieldAuthorities::SPL_DISCRIMINATOR_SLICE => {
                let data = InitializeFieldAuthorities::try_from_slice(rest)?;
                Self::InitializeFieldAuthorities(data)
            }
            AddFieldAuthority::SPL_DISCRIMINATOR_SLICE => {
                let data = AddFieldAuthority::try_from_slice(rest)?;
                Self::AddFieldAuthority(data)
            }
            AddFieldAuthorityV2::SPL_DISCRIMINATOR_SLICE => {
                let data = AddFieldAuthorityV2::try_from_slice(rest)?;
                Self::AddFieldAuthorityV2(data)
            }
            UpdateFieldWithFieldAuthority::SPL_DISCRIMINATOR_SLICE => {
                let data = UpdateFieldWithFieldAuthority::try_from_slice(rest)?;
                Self::UpdateFieldWithFieldAuthority(data)
            }
            UpdateFieldWithFieldAuthorityV2::SPL_DISCRIMINATOR_SLICE => {
                let data = UpdateFieldWithFieldAuthorityV2::try_from_slice(rest)?;
                Self::UpdateFieldWithFieldAuthorityV2(data)
            }
            RemoveFieldAuthority::SPL_DISCRIMINATOR_SLICE => {
                let data = RemoveFieldAuthority::try_from_slice(rest)?;
                Self::RemoveFieldAuthority(data)
            }
            RemoveFieldAuthorityV2::SPL_DISCRIMINATOR_SLICE => {
                let data = RemoveFieldAuthorityV2::try_from_slice(rest)?;
                Self::RemoveFieldAuthorityV2(data)
            }
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }

    pub fn pack(&self) -> Vec<u8> {
        let mut buf = vec![];
        match self {
            Self::InitializeFieldAuthorities(data) => {
                buf.extend_from_slice(InitializeFieldAuthorities::SPL_DISCRIMINATOR_SLICE);
                buf.append(&mut borsh::to_vec(data).unwrap());
            }
            Self::AddFieldAuthority(data) => {
                buf.extend_from_slice(AddFieldAuthority::SPL_DISCRIMINATOR_SLICE);
                buf.append(&mut borsh::to_vec(data).unwrap());
            }
            Self::AddFieldAuthorityV2(data) => {
                buf.extend_from_slice(AddFieldAuthorityV2::SPL_DISCRIMINATOR_SLICE);
                buf.append(&mut borsh::to_vec(data).unwrap());
            }
            Self::UpdateFieldWithFieldAuthority(data) => {
                buf.extend_from_slice(UpdateFieldWithFieldAuthority::SPL_DISCRIMINATOR_SLICE);
                buf.append(&mut borsh::to_vec(data).unwrap());
            }
            Self::UpdateFieldWithFieldAuthorityV2(data) => {
                buf.extend_from_slice(UpdateFieldWithFieldAuthorityV2::SPL_DISCRIMINATOR_SLICE);
                buf.append(&mut borsh::to_vec(data).unwrap());
            }
            Self::RemoveFieldAuthority(data) => {
                buf.extend_from_slice(RemoveFieldAuthority::SPL_DISCRIMINATOR_SLICE);
                buf.append(&mut borsh::to_vec(data).unwrap());
            }
            Self::RemoveFieldAuthorityV2(data) => {
                buf.extend_from_slice(RemoveFieldAuthorityV2::SPL_DISCRIMINATOR_SLICE);
                buf.append(&mut borsh::to_vec(data).unwrap());
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
    metadata: &Pubkey, // Field authorities are stored in metadata account
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
