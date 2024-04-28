use crate::constant::{AI_ALIENS_PDA_SEED, NICKNAME_FIELD_KEY};
use crate::error::AiAliensError;
use crate::helper::{get_token_metadata_init_vals, get_token_metadata_max_space};
use crate::instructions::*;

use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::token_interface::{mint_to, MintTo};
use holder_metadata::{state::AnchorField, HOLDER_METADATA_PDA_SEED};
use spl_token_2022::{
    extension::{group_member_pointer, metadata_pointer, transfer_hook},
    instruction::{initialize_mint2, initialize_permanent_delegate, set_authority, AuthorityType},
};

pub fn handle_init(
    ctx: Context<Init>,
    admin: Pubkey,
    treasury: Pubkey,
    max_supply: u16,
    mint_price_lamports: u64,
) -> Result<()> {
    // Set PDA data
    ctx.accounts.ai_aliens_pda.admin = admin;
    ctx.accounts.ai_aliens_pda.treasury = treasury;
    ctx.accounts.ai_aliens_pda.max_supply = max_supply;
    ctx.accounts.ai_aliens_pda.mint_price_lamports = mint_price_lamports;

    Ok(())
}

pub fn handle_update_state(
    ctx: Context<UpdateState>,
    admin: Pubkey,
    treasury: Pubkey,
    max_supply: u16,
    mint_price_lamports: u64,
) -> Result<()> {
    // Set PDA data
    ctx.accounts.ai_aliens_pda.admin = admin;
    ctx.accounts.ai_aliens_pda.treasury = treasury;
    ctx.accounts.ai_aliens_pda.max_supply = max_supply;
    ctx.accounts.ai_aliens_pda.mint_price_lamports = mint_price_lamports;

    Ok(())
}

fn check_max_supply(ctx: &Context<CreateMint>, index: u16) -> Result<()> {
    if index > ctx.accounts.ai_aliens_pda.max_supply || index < 1 {
        return err!(AiAliensError::IndexOutOfBounds);
    }
    Ok(())
}

fn pay_mint_price(ctx: &Context<CreateMint>) -> Result<()> {
    let ix = &anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.payer.key,
        ctx.accounts.treasury.key,
        ctx.accounts.ai_aliens_pda.mint_price_lamports,
    );
    let accounts = &[
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.treasury.to_account_info(),
    ];
    anchor_lang::solana_program::program::invoke(ix, accounts)?;

    Ok(())
}

fn init_mp_ext(ctx: &Context<CreateMint>) -> Result<()> {
    let ix = metadata_pointer::instruction::initialize(
        ctx.accounts.token_program.key,
        ctx.accounts.mint.key,
        Some(ctx.accounts.ai_aliens_pda.key()),
        Some(ctx.accounts.metadata.key()),
    )?;
    let accounts = [ctx.accounts.mint.to_account_info()];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&ix, &accounts, &signer_seeds)?;

    Ok(())
}

fn init_gmp_ext(ctx: &Context<CreateMint>) -> Result<()> {
    let ix = group_member_pointer::instruction::initialize(
        ctx.accounts.token_program.key,
        ctx.accounts.mint.key,
        Some(ctx.accounts.ai_aliens_pda.key()),
        None,
    )?;
    let accounts = [ctx.accounts.mint.to_account_info()];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&ix, &accounts, &signer_seeds)?;

    Ok(())
}

fn init_th_ext(ctx: &Context<CreateMint>) -> Result<()> {
    let ix = transfer_hook::instruction::initialize(
        ctx.accounts.token_program.key,
        &ctx.accounts.mint.key(),
        Some(ctx.accounts.ai_aliens_pda.key()),
        None,
    )?;
    let accounts = [ctx.accounts.mint.to_account_info()];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&ix, &accounts, &signer_seeds)?;

    Ok(())
}

fn init_pd_ext(ctx: &Context<CreateMint>) -> Result<()> {
    let ix = initialize_permanent_delegate(
        ctx.accounts.token_program.key,
        ctx.accounts.mint.key,
        &ctx.accounts.ai_aliens_pda.key(),
    )?;
    let accounts = [ctx.accounts.mint.to_account_info()];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&ix, &accounts, &signer_seeds)?;

    Ok(())
}

fn init_mint(ctx: &Context<CreateMint>) -> Result<()> {
    let ix = initialize_mint2(
        ctx.accounts.token_program.key,
        &ctx.accounts.mint.key(),
        &ctx.accounts.ai_aliens_pda.key(),
        Some(&ctx.accounts.ai_aliens_pda.key()),
        0,
    )?;
    let accounts = [ctx.accounts.mint.to_account_info()];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&ix, &accounts, &signer_seeds)?;

    Ok(())
}

fn init_metadata(ctx: &Context<CreateMint>, index: u16) -> Result<()> {
    let token_metadata = get_token_metadata_init_vals(
        index,
        ctx.accounts.ai_aliens_pda.key(),
        ctx.accounts.mint.key(),
    )?;

    let ix = spl_token_metadata_interface::instruction::initialize(
        ctx.accounts.metadata_program.key,
        &ctx.accounts.metadata.key(),
        &Option::<Pubkey>::from(token_metadata.update_authority).unwrap(),
        &ctx.accounts.mint.key(),
        &ctx.accounts.ai_aliens_pda.key(),
        token_metadata.name,
        token_metadata.symbol,
        token_metadata.uri,
    );
    let accounts = [
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.ai_aliens_pda.to_account_info(),
        ctx.accounts.mint.to_account_info(),
    ];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&ix, &accounts, &signer_seeds)?;

    Ok(())
}

fn add_nickname_as_holder_meta(ctx: &Context<CreateMint>) -> Result<()> {
    let holder_metadata_pda_seeds = [HOLDER_METADATA_PDA_SEED.as_bytes()];
    let (holder_metadata_pda, _bump) =
        Pubkey::find_program_address(&holder_metadata_pda_seeds, &holder_metadata::id());

    let ix = field_authority_interface::instruction::add_field_authority(
        ctx.accounts.metadata_program.key,
        &ctx.accounts.payer.key(),
        &ctx.accounts.metadata.key(),
        &ctx.accounts.ai_aliens_pda.key(),
        spl_token_metadata_interface::state::Field::Key(NICKNAME_FIELD_KEY.to_string()),
        &holder_metadata_pda,
    );
    let accounts = [
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.ai_aliens_pda.to_account_info(),
        ctx.accounts.field_pda.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    ];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&ix, &accounts, &signer_seeds)?;

    Ok(())
}

fn transfer_lamports_for_nickname(ctx: &Context<CreateMint>, index: u16) -> Result<()> {
    let max_space = get_token_metadata_max_space(index)?;
    let rent_lamports = Rent::get()?.minimum_balance(max_space);
    let add_lamports = rent_lamports - ctx.accounts.metadata.lamports();
    let ix = &anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.payer.key,
        &ctx.accounts.metadata.key(),
        add_lamports,
    );
    let accounts = &[
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.metadata.to_account_info(),
    ];
    anchor_lang::solana_program::program::invoke(ix, accounts)?;

    Ok(())
}

pub fn handle_create_mint(ctx: Context<CreateMint>, index: u16) -> Result<()> {
    check_max_supply(&ctx, index)?;
    pay_mint_price(&ctx)?;

    init_mp_ext(&ctx)?;
    init_gmp_ext(&ctx)?;
    init_th_ext(&ctx)?;
    init_pd_ext(&ctx)?;

    init_mint(&ctx)?;
    init_metadata(&ctx, index)?;
    add_nickname_as_holder_meta(&ctx)?;
    transfer_lamports_for_nickname(&ctx, index)?;

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

pub fn handle_update_field(
    ctx: Context<UpdateField>,
    field: AnchorField,
    val: String,
) -> Result<()> {
    let ix = spl_token_metadata_interface::instruction::update_field(
        ctx.accounts.metadata_program.key,
        &ctx.accounts.metadata.key(),
        &ctx.accounts.ai_aliens_pda.key(),
        field.into(),
        val,
    );
    let accounts = [
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.ai_aliens_pda.to_account_info(),
    ];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let ai_aliens_only_signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&ix, &accounts, &ai_aliens_only_signer_seeds)?;

    Ok(())
}

pub fn handle_nullify_mint_authority(ctx: Context<NullifyMintAuthority>, index: u16) -> Result<()> {
    // NOTE: Need to use spl-token-2022 crate directly because Anchor has a mismatched version
    // TODO: Match versions and update program carefully
    let ix = set_authority(
        ctx.accounts.token_program.key,
        &ctx.accounts.mint.key(),
        None,
        AuthorityType::MintTokens,
        &ctx.accounts.ai_aliens_pda.key(),
        &[&ctx.accounts.ai_aliens_pda.key()],
    )?;
    let accounts = [
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.ai_aliens_pda.to_account_info(),
    ];
    let ai_aliens_pda_seeds = [AI_ALIENS_PDA_SEED.as_bytes(), &[ctx.bumps.ai_aliens_pda]];
    let signer_seeds = [&ai_aliens_pda_seeds[..]];
    invoke_signed(&ix, &accounts, &signer_seeds)?;

    Ok(())
}
