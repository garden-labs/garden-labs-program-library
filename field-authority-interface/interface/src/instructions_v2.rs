use {
    crate::{instructions::FieldAuthorityInstruction, state::FieldAuthority},
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
    },
    spl_discriminator::SplDiscriminate,
};

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, SplDiscriminate)]
#[discriminator_hash_input("field_authority_interface:initialize_field_authorities_v2")]
pub struct InitializeFieldAuthorities {
    pub authorities: Vec<FieldAuthority>,
}

// #[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, SplDiscriminate)]
// #[discriminator_hash_input("field_authority_interface:add_field_authority_v2")]
// pub struct AddFieldAuthorityV2 {
//     pub field: Field,
//     pub authority: Pubkey,
// }

// #[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, SplDiscriminate)]
// #[discriminator_hash_input("field_authority_interface:update_field_with_field_authority_v2")]
// pub struct UpdateFieldWithFieldAuthorityV2 {
//     pub field: Field,
//     pub value: String,
// }

// #[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, SplDiscriminate)]
// #[discriminator_hash_input("field_authority_interface:remove_field_authority_v2")]
// pub struct RemoveFieldAuthorityV2 {
//     pub field: Field,
//     pub authority: Pubkey,
// }

/// Creates `InitializeFieldAuthorities` instruction
pub fn initialize_field_authorities(
    program_id: &Pubkey,
    metadata: &Pubkey,
    update_authority: &Pubkey,
    field_authorities: Vec<FieldAuthority>,
) -> Instruction {
    let data = FieldAuthorityInstruction::InitializeFieldAuthorities(InitializeFieldAuthorities {
        authorities: field_authorities,
    });

    Instruction {
        program_id: *program_id,
        accounts: vec![
            AccountMeta::new(*metadata, false),
            AccountMeta::new_readonly(*update_authority, true),
        ],
        data: data.pack(),
    }
}

// /// Creates `AddFieldAuthorityV2` instruction
// pub fn add_field_authority_v2(
//     program_id: &Pubkey,
//     metadata: &Pubkey,
//     update_authority: &Pubkey,
//     field: Field,
//     field_authority: &Pubkey,
// ) -> Instruction {
//     let data = FieldAuthorityInstruction::AddFieldAuthority(AddFieldAuthority {
//         field,
//         authority: *field_authority,
//     });

//     Instruction {
//         program_id: *program_id,
//         accounts: vec![
//             AccountMeta::new_readonly(*metadata, false),
//             AccountMeta::new_readonly(*update_authority, true),
//         ],
//         data: data.pack(),
//     }
// }

// /// Creates `UpdateFieldWithFieldAuthorityV2` instruction
// pub fn update_field_with_field_authority_v2(
//     program_id: &Pubkey,
//     metadata: &Pubkey,
//     field_authority: &Pubkey,
//     field: Field,
//     value: String,
//     field_authorities: &Pubkey, // Can be the same as metadata
// ) -> Instruction {
//     let data = FieldAuthorityInstruction::UpdateFieldWithFieldAuthorityV2(
//         UpdateFieldWithFieldAuthorityV2 { field, value },
//     );

//     Instruction {
//         program_id: *program_id,
//         accounts: vec![
//             AccountMeta::new(*metadata, false),
//             AccountMeta::new_readonly(*field_authority, true),
//             AccountMeta::new_readonly(*field_authorities, false),
//         ],
//         data: data.pack(),
//     }
// }

// /// Creates `RemoveFieldAuthorityV2` instruction
// pub fn remove_field_authority_v2(
//     program_id: &Pubkey,
//     update_authority: &Pubkey,
//     field: Field,
//     field_authority: &Pubkey,
//     field_authorities: &Pubkey, // Can be the same as metadata
// ) -> Instruction {
//     let data = FieldAuthorityInstruction::RemoveFieldAuthorityV2(RemoveFieldAuthorityV2 {
//         field,
//         authority: *field_authority,
//     });

//     Instruction {
//         program_id: *program_id,
//         accounts: vec![
//             AccountMeta::new(*field_authorities, false),
//             AccountMeta::new_readonly(*update_authority, true),
//         ],
//         data: data.pack(),
//     }
// }
