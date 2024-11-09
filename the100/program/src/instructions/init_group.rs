use {
    crate::{constants::THE100_PDA_SEED, state::ColData},
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
        token_interface::{
            token_group_initialize, token_metadata_initialize, Mint, Token2022,
            TokenGroupInitialize, TokenMetadataInitialize,
        },
    },
    gpl_common::reach_minimum_rent,
};

#[derive(Accounts)]
pub struct InitGroup<'info> {
    #[account(mut, constraint = payer.key() == col_data.admin)]
    pub payer: Signer<'info>,

    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = the100_pda, // Set to None in ix after mint token
        mint::freeze_authority = the100_pda,
        // We'll add these just in case we eventually use them
        extensions::metadata_pointer::metadata_address = mint,
        extensions::metadata_pointer::authority = the100_pda,
        extensions::group_pointer::authority = mint,
        extensions::group_pointer::group_address = mint,
        extensions::transfer_hook::authority = the100_pda,
        // TODO: Implement royalties with transfer hook
        // extensions::transfer_hook::program_id = crate::ID,
        extensions::permanent_delegate::delegate = the100_pda,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK: Account checked in constraints
    #[account(
        seeds = [THE100_PDA_SEED.as_bytes()],
        bump
    )]
    pub the100_pda: UncheckedAccount<'info>,

    pub col_data: Account<'info, ColData>,

    pub token_program: Program<'info, Token2022>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

fn init_metadata(ctx: &Context<InitGroup>) -> Result<()> {
    let accounts = TokenMetadataInitialize {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        metadata: ctx.accounts.mint.to_account_info(),
        mint_authority: ctx.accounts.the100_pda.to_account_info(),
        update_authority: ctx.accounts.the100_pda.to_account_info(),
    };
    let the100_pda_seeds: &[&[u8]; 2] = &[THE100_PDA_SEED.as_bytes(), &[ctx.bumps.the100_pda]];
    let signer_seeds = &[&the100_pda_seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        accounts,
        signer_seeds,
    );
    token_metadata_initialize(
      cpi_ctx,
      "the100".to_string(),
      "THE100".to_string(),
      "https://firebasestorage.googleapis.com/v0/b/the100-f61ce.appspot.com/o/uri%2Fgroup.json?alt=media".to_string(),
    )?;

    Ok(())
}

fn init_group(ctx: &Context<InitGroup>) -> Result<()> {
    let accounts = TokenGroupInitialize {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        group: ctx.accounts.mint.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        mint_authority: ctx.accounts.the100_pda.to_account_info(),
    };
    let the100_pda_seeds: &[&[u8]; 2] = &[THE100_PDA_SEED.as_bytes(), &[ctx.bumps.the100_pda]];
    let signer_seeds = &[&the100_pda_seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        accounts,
        signer_seeds,
    );

    // TODO: Finish when Anchor supports: https://github.com/coral-xyz/anchor/blob/v0.30.1/CHANGELOG.md#0301---2024-06-20
    // token_group_initialize(
    //     cpi_ctx,
    //     Some(ctx.accounts.payer.key()), // update_authority
    //     100,                            // max_size
    // )?;

    Ok(())

    // TODO: Enable token group in test validator
}

pub fn handle_init_group(ctx: Context<InitGroup>) -> Result<()> {
    init_metadata(&ctx)?;

    init_group(&ctx)?;

    reach_minimum_rent(
        ctx.accounts.payer.clone(),
        ctx.accounts.mint.to_account_info(),
    )?;

    Ok(())
}
