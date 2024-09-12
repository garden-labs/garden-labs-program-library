use {
    crate::{
        constants::{
            HOLDER_FIELDS, MAX_SUPPLY, MEMBER_PDA_SEED, MINT_FEE_LAMPORTS, THE100_PDA_SEED,
        },
        errors::The100Error,
        helpers::{get_metadata_init_vals, get_treasury_pubkey},
        state::MemberPda,
    },
    anchor_lang::{prelude::*, solana_program::program::invoke_signed},
    anchor_spl::{
        associated_token::AssociatedToken,
        token_2022::spl_token_2022::{
            extension::{
                // Needed for contraints (?)
                group_member_pointer::GroupMemberPointer,
                metadata_pointer::MetadataPointer,
                mint_close_authority::MintCloseAuthority,
                permanent_delegate::PermanentDelegate,
                transfer_hook::TransferHook,
            },
            instruction::AuthorityType,
        },
        token_interface::{
            mint_to, set_authority, token_metadata_initialize, token_metadata_update_field, Mint,
            MintTo, SetAuthority, Token2022, TokenAccount, TokenMetadataInitialize,
            TokenMetadataUpdateField,
        },
    },
    gpl_common::reach_minimum_rent,
    spl_token_metadata_interface::state::Field,
    spl_type_length_value::state::{TlvState, TlvStateBorrowed},
};

#[derive(Accounts)]
#[instruction(field: String, val: String)]
pub struct UpdateHolderField<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub holder: Signer<'info>,

    #[account(mut)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        associated_token::token_program = token_program,
        associated_token::mint = mint,
        associated_token::authority = holder,
        constraint = holder_token_account.amount > 0,
    )]
    pub holder_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Account checked in constraints
    #[account(
      seeds = [THE100_PDA_SEED.as_bytes()],
      bump
  )]
    pub the100_pda: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

pub fn handle_update_holder_field(
    ctx: Context<UpdateHolderField>,
    field: String,
    val: String,
) -> Result<()> {
    if !HOLDER_FIELDS.contains(&field.as_str()) {
        return Err(The100Error::InvalidHolderField.into());
    }

    let accounts = TokenMetadataUpdateField {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        metadata: ctx.accounts.mint.to_account_info(),
        update_authority: ctx.accounts.the100_pda.to_account_info(),
    };
    let the100_pda_seeds: &[&[u8]; 2] = &[THE100_PDA_SEED.as_bytes(), &[ctx.bumps.the100_pda]];
    let signer_seeds = &[&the100_pda_seeds[..]];
    let update_field_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        accounts,
        signer_seeds,
    );

    token_metadata_update_field(update_field_ctx, Field::Key(field), val)?;

    reach_minimum_rent(
        ctx.accounts.payer.clone(),
        ctx.accounts.mint.to_account_info(),
    )?;

    Ok(())
}
