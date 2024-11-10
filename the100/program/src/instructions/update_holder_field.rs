use {
    crate::{
        constants::{HOLDER_FIELD_CONFIGS, THE100_PDA_SEED},
        errors::The100Error,
        helpers::update_field,
    },
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        token_2022::spl_token_2022::extension::{
            // Needed for contraints (?)
            group_member_pointer::GroupMemberPointer,
            metadata_pointer::MetadataPointer,
            mint_close_authority::MintCloseAuthority,
            permanent_delegate::PermanentDelegate,
            transfer_hook::TransferHook,
        },
        token_interface::{Mint, Token2022, TokenAccount},
    },
    gpl_common::reach_minimum_rent,
    spl_token_metadata_interface::state::Field,
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
    // Check if it exists and is valid
    let holder_field = HOLDER_FIELD_CONFIGS
        .iter()
        .find(|&f| f.name == field.as_str());
    match holder_field {
        Some(f) => {
            if val.len() > f.max_len as usize {
                return Err(The100Error::HolderFieldValTooLong.into());
            }
        }
        None => {
            return Err(The100Error::InvalidHolderField.into());
        }
    }

    update_field(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.the100_pda.to_account_info(),
        ctx.bumps.the100_pda,
        Field::Key(field),
        val,
    )?;

    reach_minimum_rent(
        ctx.accounts.payer.clone(),
        ctx.accounts.mint.to_account_info(),
    )?;

    Ok(())
}
