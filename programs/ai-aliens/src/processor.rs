use crate::constant::{AI_ALIENS_PDA_SEED, NICKNAME_FIELD_KEY};
use crate::error::AiAliensError;
use crate::helper::{get_token_metadata_init_vals, get_token_metadata_max_space};
use crate::instructions::*;

use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::token_interface::{mint_to, MintTo};
use holder_metadata::HOLDER_METADATA_PDA_SEED;
use spl_token_2022::{extension::metadata_pointer, instruction::initialize_mint2};

pub fn handle_update_state(
    ctx: Context<UpdateState>,
    max_supply: u16,
    mint_price_lamports: u64,
) -> Result<()> {
    // Set PDA data
    ctx.accounts.ai_aliens_pda.max_supply = max_supply;
    ctx.accounts.ai_aliens_pda.mint_price_lamports = mint_price_lamports;

    Ok(())
}

pub fn handle_create_nft(ctx: Context<CreateNft>, index: u16) -> Result<()> {
    // Check max supply and increment if not reached
    if index > ctx.accounts.ai_aliens_pda.max_supply || index < 1 {
        return err!(AiAliensError::IndexOutOfBounds);
    }

    // Transfer lamports based on mint price
    let transf_lam_ix = &anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.payer.key,
        &ctx.accounts.ai_aliens_pda.key(),
        ctx.accounts.ai_aliens_pda.mint_price_lamports,
    );
    let transf_lam_accounts = &[
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.ai_aliens_pda.to_account_info(),
    ];
    anchor_lang::solana_program::program::invoke(transf_lam_ix, transf_lam_accounts)?;

    // Initialize metadata pointer extension
    let init_mp_ix = metadata_pointer::instruction::initialize(
        ctx.accounts.token_program.key,
        &ctx.accounts.mint.key(),
        Some(ctx.accounts.ai_aliens_pda.key()),
        Some(ctx.accounts.metadata.key()),
    )?;
    let init_mp_accounts = [ctx.accounts.mint.to_account_info()];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&init_mp_ix, &init_mp_accounts, &signer_seeds)?;

    // Initialize mint
    let init_mint2_ix = initialize_mint2(
        ctx.accounts.token_program.key,
        &ctx.accounts.mint.key(),
        &ctx.accounts.ai_aliens_pda.key(),
        Some(&ctx.accounts.ai_aliens_pda.key()),
        0,
    )?;
    let init_mint2_accounts = [ctx.accounts.mint.to_account_info()];
    invoke_signed(&init_mint2_ix, &init_mint2_accounts, &signer_seeds)?;

    // Initialize metadata

    let token_metadata = get_token_metadata_init_vals(
        index,
        ctx.accounts.ai_aliens_pda.key(),
        ctx.accounts.mint.key(),
    )?;

    // Run initialize metadata instruction
    let init_ix = spl_token_metadata_interface::instruction::initialize(
        ctx.accounts.metadata_program.key,
        &ctx.accounts.metadata.key(),
        &Option::<Pubkey>::from(token_metadata.update_authority).unwrap(),
        &ctx.accounts.mint.key(),
        &ctx.accounts.ai_aliens_pda.key(),
        token_metadata.name,
        token_metadata.symbol,
        token_metadata.uri,
    );
    let init_accounts = [
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.ai_aliens_pda.to_account_info(),
        ctx.accounts.mint.to_account_info(),
    ];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let ai_aliens_only_signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&init_ix, &init_accounts, &ai_aliens_only_signer_seeds)?;

    // Add holder metadata PDA as field authority for nickname field

    // Calculate holder metadata PDA
    let holder_metadata_pda_seeds = [HOLDER_METADATA_PDA_SEED.as_bytes()];
    let (holder_metadata_pda, _bump) =
        Pubkey::find_program_address(&holder_metadata_pda_seeds, &holder_metadata::id());

    let add_fa_ix = field_authority_interface::instruction::add_field_authority(
        ctx.accounts.metadata_program.key,
        &ctx.accounts.payer.key(),
        &ctx.accounts.metadata.key(),
        &ctx.accounts.ai_aliens_pda.key(),
        spl_token_metadata_interface::state::Field::Key(NICKNAME_FIELD_KEY.to_string()),
        &holder_metadata_pda,
    );
    let add_fa_accounts = [
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.ai_aliens_pda.to_account_info(),
        ctx.accounts.field_pda.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    ];
    invoke_signed(&add_fa_ix, &add_fa_accounts, &ai_aliens_only_signer_seeds)?;

    // Transfer lamports to provide enough rent for nickname field
    let max_space = get_token_metadata_max_space(index)?;
    let rent_lamports = Rent::get()?.minimum_balance(max_space);
    let add_lamports = rent_lamports - ctx.accounts.metadata.lamports();
    let rent_ix = &anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.payer.key,
        &ctx.accounts.metadata.key(),
        add_lamports,
    );
    let rent_accounts = &[
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.metadata.to_account_info(),
    ];
    anchor_lang::solana_program::program::invoke(rent_ix, rent_accounts)?;

    // Set data of NFT minted PDA
    ctx.accounts.nft_minted_pda.mint = ctx.accounts.mint.key();

    Ok(())
}

pub fn handle_create_token(ctx: Context<CreateToken>) -> Result<()> {
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.dest_ata.to_account_info(),
        authority: ctx.accounts.ai_aliens_pda.to_account_info(),
    };
    let ai_aliens_pda_seeds = &[AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let signer_seeds = &[&ai_aliens_pda_seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    mint_to(cpi_ctx, 1)?;

    Ok(())
}
