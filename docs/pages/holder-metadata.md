# Holder Metadata Program

Now that we have a Field Authority Interface implemented, our Holder Metadata Program has very little it needs to do. The Field Authority Interface assigns the Holder Metadata Program's PDA as a field authority, and the Holder Metadata Program implements one instruction to check that the signer is indeed the token holder before updating the field:

```
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

    ...
}
```

Other programs can plug into the Field Authority Interface and implement their own logic. A program could require a certain amount of fungible tokens, a combination of tokens, charge a fee per edit, not allow certain edits, etc.

Last, use our AI Aliens collection as an example which shows how all these pieces work together.
