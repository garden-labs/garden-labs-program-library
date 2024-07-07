use crate::constants::VENDING_MACHINE_PDA_SEED;
use crate::helpers::get_col_metadata_init_vals;
use crate::state::VendingMachineData;
use crate::util::reach_minimum_balance;

use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::spl_token_2022::{
        extension::{
            // Needed for contraints
            group_pointer::GroupPointer,
            metadata_pointer::MetadataPointer,
        },
        instruction::AuthorityType,
    },
    token_interface::{
        set_authority, token_metadata_initialize, Mint, SetAuthority, Token2022,
        TokenMetadataInitialize,
    },
};

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = vending_machine_pda, // Set to None in ix after mint token
        extensions::metadata_pointer::authority = vending_machine_pda,
        extensions::metadata_pointer::metadata_address = col_mint,
        extensions::group_pointer::authority = vending_machine_pda,
        extensions::group_pointer::group_address = col_mint,
    )]
    pub col_mint: Box<InterfaceAccount<'info, Mint>>,
    // TODO: Use Token Metadata struct here?
    /// CHECK: Account checked in constraints
    #[account(
        seeds = [VENDING_MACHINE_PDA_SEED.as_bytes()],
        bump
    )]
    pub vending_machine_pda: UncheckedAccount<'info>,
    #[account(init, payer = payer, space = 8 + VendingMachineData::INIT_SPACE)]
    pub vending_machine_data: Account<'info, VendingMachineData>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

fn init_metadata(ctx: &Context<Init>) -> Result<()> {
    let token_metadata = get_col_metadata_init_vals(
        ctx.accounts.col_mint.key(),
        (*ctx.accounts.vending_machine_data).clone(),
    );

    let cpi_accounts = TokenMetadataInitialize {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.col_mint.to_account_info(),
        metadata: ctx.accounts.col_mint.to_account_info(),
        mint_authority: ctx.accounts.vending_machine_pda.to_account_info(),
        update_authority: ctx.accounts.vending_machine_pda.to_account_info(),
    };
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[
        VENDING_MACHINE_PDA_SEED.as_bytes(),
        &[ctx.bumps.vending_machine_pda],
    ];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token_metadata_initialize(
        cpi_ctx,
        token_metadata.name,
        token_metadata.symbol,
        token_metadata.uri,
    )?;

    // Add additional lamports to cover rent
    reach_minimum_balance(
        ctx.accounts.col_mint.to_account_info(),
        ctx.accounts.payer.clone(),
    )?;

    Ok(())
}

fn nullify_mint_authority(ctx: &Context<Init>) -> Result<()> {
    let accounts: SetAuthority = SetAuthority {
        current_authority: ctx.accounts.vending_machine_pda.to_account_info(),
        account_or_mint: ctx.accounts.col_mint.to_account_info(),
    };
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[
        VENDING_MACHINE_PDA_SEED.as_bytes(),
        &[ctx.bumps.vending_machine_pda],
    ];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    let set_authority_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        accounts,
        signer_seeds,
    );
    set_authority(set_authority_ctx, AuthorityType::MintTokens, None)?;

    Ok(())
}

pub fn handle_init(ctx: Context<Init>, data: VendingMachineData) -> Result<()> {
    // Validate fields
    data.validate()?;

    // Copy data to account
    let vending_machine_data_account = &mut ctx.accounts.vending_machine_data;
    **vending_machine_data_account = data;

    // Initialize collection metadata
    init_metadata(&ctx)?;

    // TODO: Setup group

    nullify_mint_authority(&ctx)?;

    Ok(())
}
