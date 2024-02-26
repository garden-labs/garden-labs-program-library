# Holder Metadata Program

Now that we have the Field Authority Interface, our Holder Metadata Program has very little it needs to do. The Field Authority Interface assigns the Holder Metadata Program's PDA as a field authority, and the Holder Metadata Program implements one instruction to check that the sender is indeed the token holder before updating the field:

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

#[derive(Accounts)]
#[instruction(field: AnchorField, val: String)]
pub struct UpdateHolderField<'info> {
    pub holder: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: Account checked in CPI
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    #[account(
        associated_token::token_program = token_program,
        associated_token::mint = mint,
        associated_token::authority = holder,
        constraint = holder_token_account.amount > 0,
    )]
    pub holder_token_account: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: Account checked in constraints
    #[account(seeds = [HOLDER_METADATA_PDA_SEED.as_bytes()], bump)]
    pub holder_metadata_pda: UncheckedAccount<'info>,
    /// CHECK: Account checked in CPI
    pub field_pda: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    /// CHECK: Account checked in CPI
    pub field_authority_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
```

<div style="text-align: right">
    <a href="https://github.com/garden-labs/holder-metadata/blob/2293bb41989b0d69e127df51ee540949b6f6d259/programs/holder-metadata/src/processor.rs#L11" target="blank">source code</a>
</div>

Other programs can plug into the Field Authority Interface and implement their own logic. A program could require an amount of fungible tokens, a combination of tokens, charge a fee per edit, not allow certain edits, and so on.

Next, we'll finish up by using our AI Aliens collection as an example of how this all fits together.
