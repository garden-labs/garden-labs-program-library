use crate::constants::HOLDER_METADATA_PDA_SEED;
use crate::instructions::*;

use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use field_authority_interface::{
    instructions::update_field_with_field_authority,
    instructions_v2::update_field_with_field_authority_v2,
};
use gpl_util::{reach_minimum_rent, AnchorField};

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

    // TODO: Add payer account to pay for this instead of holder
    reach_minimum_rent(
        ctx.accounts.holder.clone(),
        ctx.accounts.metadata.to_account_info(),
    )?;

    Ok(())
}

pub fn handle_update_holder_field_v2(
    ctx: Context<UpdateHolderFieldV2>,
    field: AnchorField,
    val: String,
) -> Result<()> {
    // Update field with field authority
    let ix = &update_field_with_field_authority_v2(
        ctx.accounts.field_authority_program.key,
        ctx.accounts.metadata.key,
        &ctx.accounts.holder_metadata_pda.key(),
        field.into(),
        val,
    );
    let account_infos = &[
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.holder_metadata_pda.to_account_info(),
    ];
    let signer_seeds: &[&[&[u8]]] = &[&[
        HOLDER_METADATA_PDA_SEED.as_bytes(),
        &[ctx.bumps.holder_metadata_pda],
    ]];
    invoke_signed(ix, account_infos, signer_seeds)?;

    reach_minimum_rent(
        ctx.accounts.payer.clone(),
        ctx.accounts.metadata.to_account_info(),
    )?;

    Ok(())
}
