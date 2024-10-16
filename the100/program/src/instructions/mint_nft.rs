use {
    crate::{
        constants::{MAX_SUPPLY, MEMBER_PDA_SEED, MINT_FEE_LAMPORTS, THE100_PDA_SEED},
        errors::The100Error,
        helpers::{
            get_metadata_init_vals, get_reserved_authority, get_treasury_pubkey, update_field,
        },
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
#[instruction(index: u16)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Account checked in constraints
    #[account(mut, constraint = treasury.key() == get_treasury_pubkey())]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: We're just giving them a token
    #[account()]
    pub receiver: UncheckedAccount<'info>,

    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = the100_pda, // Set to None in ix after mint token
        mint::freeze_authority = the100_pda,
        extensions::metadata_pointer::metadata_address = mint,
        extensions::metadata_pointer::authority = the100_pda,
        extensions::group_member_pointer::authority = the100_pda,
        extensions::group_member_pointer::member_address = mint,
        extensions::transfer_hook::authority = the100_pda,
        // TODO: Implement royalties with transfer hook
        // extensions::transfer_hook::program_id = crate::ID,
        extensions::permanent_delegate::delegate = the100_pda,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    // NOTE: ImmutableOwner initialized by default in Token2022
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = receiver,
        associated_token::token_program = token_program,
    )]
    pub receiver_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init,
        payer = payer,
        space = MemberPda::INIT_SPACE + 8,
        seeds = [MEMBER_PDA_SEED.as_bytes(), &index.to_le_bytes()],
        bump,
    )]
    pub member_pda: Account<'info, MemberPda>,

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

fn check_max_supply(index: u16) -> Result<()> {
    if index > MAX_SUPPLY || index < 1 {
        return err!(The100Error::IndexOutOfBounds);
    }
    Ok(())
}

// Indices less than 10 or multiples of 10 are reserved
fn check_reserved(ctx: &Context<MintNft>, index: u16) -> Result<()> {
    if ctx.accounts.payer.key() != get_reserved_authority() {
        if index < 10 || index % 10 == 0 {
            return err!(The100Error::ReservedChannel);
        }
    }

    Ok(())
}

fn pay_mint_fee(ctx: &Context<MintNft>) -> Result<()> {
    let ix = &anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.payer.key,
        ctx.accounts.treasury.key,
        MINT_FEE_LAMPORTS,
    );
    let accounts = &[
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.treasury.to_account_info(),
    ];
    anchor_lang::solana_program::program::invoke(ix, accounts)?;

    Ok(())
}

fn init_metadata(ctx: &Context<MintNft>, index: u16) -> Result<()> {
    let token_metadata = get_metadata_init_vals(index, ctx.accounts.mint.key())?;

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
        token_metadata.name,
        token_metadata.symbol,
        token_metadata.uri,
    )?;

    // Add additional fields
    for (key, val) in token_metadata.additional_metadata {
        update_field(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.the100_pda.to_account_info(),
            ctx.bumps.the100_pda,
            Field::Key(key),
            val,
        )?;
    }

    Ok(())
}

fn create_token(ctx: &Context<MintNft>) -> Result<()> {
    let accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.receiver_ata.to_account_info(),
        authority: ctx.accounts.the100_pda.to_account_info(),
    };
    let the100_pda_seeds: &[&[u8]; 2] = &[THE100_PDA_SEED.as_bytes(), &[ctx.bumps.the100_pda]];
    let signer_seeds = &[&the100_pda_seeds[..]];
    let mint_to_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        accounts,
        signer_seeds,
    );
    mint_to(mint_to_ctx, 1)?;

    Ok(())
}

fn nullify_mint_authority(ctx: &Context<MintNft>) -> Result<()> {
    let accounts = SetAuthority {
        current_authority: ctx.accounts.the100_pda.to_account_info(),
        account_or_mint: ctx.accounts.mint.to_account_info(),
    };
    let the100_pda_seeds: &[&[u8]; 2] = &[THE100_PDA_SEED.as_bytes(), &[ctx.bumps.the100_pda]];
    let signer_seeds = &[&the100_pda_seeds[..]];
    let set_authority_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        accounts,
        signer_seeds,
    );
    set_authority(set_authority_ctx, AuthorityType::MintTokens, None)?;

    Ok(())
}

fn init_member(ctx: &mut Context<MintNft>) -> Result<()> {
    // TODO: Initialize member with actual Group Interface
    // Group not enabled on Token2022 yet: https://github.com/solana-developers/program-examples/blob/main/tokens/token-2022/group/anchor/programs/group/src/lib.rs

    // For now we'll use a custom Member PDA, which also marks the index as minted
    ctx.accounts.member_pda.mint = ctx.accounts.mint.key();

    Ok(())
}

pub fn handle_mint_nft(mut ctx: Context<MintNft>, index: u16) -> Result<()> {
    check_max_supply(index)?;

    check_reserved(&ctx, index)?;

    pay_mint_fee(&ctx)?;

    init_metadata(&ctx, index)?;

    create_token(&ctx)?;

    nullify_mint_authority(&ctx)?;

    init_member(&mut ctx)?;

    // TODO: Add holder fields

    reach_minimum_rent(
        ctx.accounts.payer.clone(),
        ctx.accounts.mint.to_account_info(),
    )?;

    Ok(())
}
