use {
    crate::{
        constants::{MEMBER_PDA_SEED, PROTOCOL_FEE_LAMPORTS, VENDING_MACHINE_PDA_SEED},
        errors::VendingMachineError,
        helpers::{
            get_advanced_token_metadata_program_id, get_init_space, get_metadata_init_vals,
            get_treasury_pubkey,
        },
        state::{MemberPda, VendingMachineData},
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
    field_authority_interface::{
        instructions_v2::initialize_field_authorities, state::FieldAuthorities,
    },
    gpl_common::reach_minimum_rent,
    holder_metadata_plugin::HOLDER_METADATA_PDA_SEED,
    spl_token_metadata_interface::state::TokenMetadata,
    spl_type_length_value::state::{TlvState, TlvStateBorrowed},
};

#[derive(Accounts)]
#[instruction(index: u64)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Account checked in constraints
    #[account(mut, constraint = treasury.key() == get_treasury_pubkey())]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: We're just giving them a token
    #[account()]
    pub receiver: UncheckedAccount<'info>,

    /// CHECK: Account checked in constraints
    #[account(mut, constraint = creator.key() == vending_machine_data.creator)]
    pub creator: UncheckedAccount<'info>,

    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = vending_machine_pda, // Set to None in ix after mint token
        mint::freeze_authority = vending_machine_pda,
        extensions::metadata_pointer::authority = vending_machine_pda,
        extensions::metadata_pointer::metadata_address = metadata,
        extensions::group_member_pointer::authority = vending_machine_pda,
        extensions::group_member_pointer::member_address = mint,
        extensions::transfer_hook::authority = vending_machine_pda,
        // TODO: Implement royalties with transfer hook
        // extensions::transfer_hook::program_id = crate::ID,
        extensions::permanent_delegate::delegate = vending_machine_pda,
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

    /// CHECK: Account checked in constraints
    #[account(
        init,
        signer,
        payer = payer,
        space = get_init_space(index, mint.key(), metadata_template.to_account_info())?,
        owner = metadata_program.key(),
    )]
    pub metadata: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = MemberPda::INIT_SPACE + 8,
        seeds = [MEMBER_PDA_SEED.as_bytes(), vending_machine_data.key().as_ref(), &index.to_le_bytes()],
        bump,
    )]
    pub member_pda: Account<'info, MemberPda>,

    /// CHECK: Account checked in constraints
    #[account(
        seeds = [VENDING_MACHINE_PDA_SEED.as_bytes()],
        bump
    )]
    pub vending_machine_pda: UncheckedAccount<'info>,

    pub vending_machine_data: Box<Account<'info, VendingMachineData>>,

    /// CHECK: Account checked in function
    #[account(constraint = metadata_template.key() == vending_machine_data.metadata_template)]
    pub metadata_template: UncheckedAccount<'info>,

    // Need to keep on one line to not break rust-analyzer formatting
    /// CHECK: Account checked in constraints
    #[account(
        executable, constraint = metadata_program.key() == get_advanced_token_metadata_program_id()?
    )]
    pub metadata_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

fn check_max_supply(ctx: &Context<MintNft>, index: u64) -> Result<()> {
    if index > ctx.accounts.vending_machine_data.max_supply || index < 1 {
        return err!(VendingMachineError::IndexOutOfBounds);
    }
    Ok(())
}

fn pay_protocol_fee(ctx: &Context<MintNft>) -> Result<()> {
    let ix = &anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.payer.key,
        ctx.accounts.treasury.key,
        PROTOCOL_FEE_LAMPORTS,
    );
    let accounts = &[
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.treasury.to_account_info(),
    ];
    anchor_lang::solana_program::program::invoke(ix, accounts)?;

    Ok(())
}

fn pay_mint_fee(ctx: &Context<MintNft>) -> Result<()> {
    let ix = &anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.payer.key,
        &ctx.accounts.creator.key,
        ctx.accounts.vending_machine_data.mint_price_lamports,
    );
    let accounts = &[
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.creator.to_account_info(),
    ];
    anchor_lang::solana_program::program::invoke(ix, accounts)?;

    Ok(())
}

fn init_metadata(ctx: &Context<MintNft>, index: u64) -> Result<()> {
    // Initialize metadata based on template metadata
    let token_metadata = get_metadata_init_vals(
        index,
        ctx.accounts.mint.key(),
        ctx.accounts.metadata_template.to_account_info(),
    )?;

    let accounts = TokenMetadataInitialize {
        token_program_id: ctx.accounts.metadata_program.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        metadata: ctx.accounts.metadata.to_account_info(),
        mint_authority: ctx.accounts.vending_machine_pda.to_account_info(),
        update_authority: ctx.accounts.vending_machine_pda.to_account_info(), // Different from template
    };
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[
        VENDING_MACHINE_PDA_SEED.as_bytes(),
        &[ctx.bumps.vending_machine_pda],
    ];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.metadata_program.to_account_info(),
        accounts,
        signer_seeds,
    );
    token_metadata_initialize(
        cpi_ctx,
        token_metadata.name,
        token_metadata.symbol,
        token_metadata.uri,
    )?;

    Ok(())
}

fn add_field_authorities(ctx: &Context<MintNft>) -> Result<()> {
    // Add field authorities to metadata
    let field_authorities_buffer = ctx.accounts.metadata_template.try_borrow_data()?;
    let field_authorities_state = TlvStateBorrowed::unpack(&field_authorities_buffer)?;
    let field_authorities =
        field_authorities_state.get_first_variable_len_value::<FieldAuthorities>()?;

    let ix = &initialize_field_authorities(
        ctx.accounts.metadata_program.key,
        ctx.accounts.metadata.key,
        ctx.accounts.vending_machine_pda.key,
        field_authorities.authorities,
    );
    let accounts = &[
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.vending_machine_pda.to_account_info(),
    ];
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[
        VENDING_MACHINE_PDA_SEED.as_bytes(),
        &[ctx.bumps.vending_machine_pda],
    ];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
    invoke_signed(ix, accounts, signer_seeds)?;

    Ok(())
}

fn create_token(ctx: &Context<MintNft>) -> Result<()> {
    let accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.receiver_ata.to_account_info(),
        authority: ctx.accounts.vending_machine_pda.to_account_info(),
    };
    let vending_machine_pda_seeds: &[&[u8]; 2] = &[
        VENDING_MACHINE_PDA_SEED.as_bytes(),
        &[ctx.bumps.vending_machine_pda],
    ];
    let signer_seeds = &[&vending_machine_pda_seeds[..]];
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
        current_authority: ctx.accounts.vending_machine_pda.to_account_info(),
        account_or_mint: ctx.accounts.mint.to_account_info(),
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

fn init_member(ctx: &mut Context<MintNft>) -> Result<()> {
    // TODO: Initialize member with actual Group Interface
    // Group not enabled on Token2022 yet: https://github.com/solana-developers/program-examples/blob/main/tokens/token-2022/group/anchor/programs/group/src/lib.rs

    // For now we'll use a custom Member PDA, which also marks the index as minted
    ctx.accounts.member_pda.mint = ctx.accounts.mint.key();

    Ok(())
}

pub fn handle_mint_nft(mut ctx: Context<MintNft>, index: u64) -> Result<()> {
    check_max_supply(&ctx, index)?;

    pay_protocol_fee(&ctx)?;
    pay_mint_fee(&ctx)?;

    init_metadata(&ctx, index)?;

    create_token(&ctx)?;

    nullify_mint_authority(&ctx)?;

    init_member(&mut ctx)?;

    add_field_authorities(&ctx)?;

    Ok(())
}
