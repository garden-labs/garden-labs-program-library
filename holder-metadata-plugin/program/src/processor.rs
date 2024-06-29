use crate::constants::HOLDER_METADATA_PDA_SEED;
use crate::instructions::*;
use crate::state::AnchorField;

use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke_signed, program_error::ProgramError, rent::Rent},
};
use field_authority_interface::instructions::update_field_with_field_authority;

pub fn handle_update_holder_field(
    ctx: Context<UpdateHolderField>,
    field: AnchorField,
    val: String,
) -> Result<()> {
    // Update field with field authority
    let ix = &update_field_with_field_authority(
        ctx.accounts.field_authority_program.key,
        ctx.accounts.metadata.key,
        &ctx.accounts.holder_metadata_pda.key(),
        field.into(),
        val,
    );
    let account_infos = &[
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.holder_metadata_pda.to_account_info(),
        ctx.accounts.field_pda.to_account_info(),
    ];
    let signer_seeds: &[&[&[u8]]] = &[&[
        HOLDER_METADATA_PDA_SEED.as_bytes(),
        &[ctx.bumps.holder_metadata_pda],
    ]];
    invoke_signed(ix, account_infos, signer_seeds)?;

    // Solana runtime will currently panic if below rent exempt but we'll check anyways
    let space = ctx.accounts.metadata.to_account_info().data.borrow().len();
    let min_balance = Rent::get()?.minimum_balance(space);
    if ctx.accounts.metadata.lamports() < min_balance {
        return Err(ProgramError::AccountNotRentExempt.into());
    }

    Ok(())
}
