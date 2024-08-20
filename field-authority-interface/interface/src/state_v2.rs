use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        borsh1::{get_instance_packed_len, try_from_slice_unchecked},
        program_error::ProgramError,
        pubkey::Pubkey,
    },
    spl_discriminator::SplDiscriminate,
    spl_token_metadata_interface::state::Field,
    spl_type_length_value::{
        // TlvState needs to be imported for get_base_len() method
        state::{TlvState, TlvStateBorrowed},
        variable_len_pack::VariableLenPack,
    },
};

#[derive(Clone, Debug, PartialEq, BorshDeserialize, BorshSerialize)]
pub struct FieldAuthority {
    pub field: Field,
    pub authority: Pubkey,
}

#[derive(Clone, Debug, PartialEq, BorshDeserialize, BorshSerialize, SplDiscriminate)]
#[discriminator_hash_input("field_authorities")]
pub struct FieldAuthorities {
    pub authorities: Vec<FieldAuthority>,
}
impl VariableLenPack for FieldAuthorities {
    fn pack_into_slice(&self, dst: &mut [u8]) -> Result<(), ProgramError> {
        borsh::to_writer(&mut dst[..], self).map_err(Into::into)
    }

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        try_from_slice_unchecked(src).map_err(Into::into)
    }

    fn get_packed_len(&self) -> Result<usize, ProgramError> {
        get_instance_packed_len(self).map_err(Into::into)
    }
}
impl FieldAuthorities {
    /// Adds field authority pair. Exits early if already found.
    pub fn add_field_authority(&mut self, field: Field, authority: Pubkey) {
        for fa in &self.authorities {
            if fa.field == field && fa.authority == authority {
                return; // Exit early if a match is found
            }
        }
        self.authorities.push(FieldAuthority { field, authority });
    }

    /// Checks if a field authority pair exists. Returns true if found.
    pub fn contains_field_authority(&self, field: Field, authority: Pubkey) -> bool {
        for fa in &self.authorities {
            if fa.field == field && fa.authority == authority {
                return true;
            }
        }
        return false;
    }

    /// Removes the field authority pair. Returns true if the pair was found.
    pub fn remove_field_authority(&mut self, field: Field, authority: Pubkey) -> bool {
        let mut found = false;
        self.authorities.retain(|fa| {
            let should_retain = !(fa.field == field && fa.authority == authority);
            if !should_retain {
                found = true;
            }
            return should_retain;
        });
        return found;
    }
}