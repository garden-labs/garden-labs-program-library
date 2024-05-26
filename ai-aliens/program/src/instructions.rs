use crate::constant::{AI_ALIENS_PDA_SEED, NFT_MINTED_PDA_SEED};
use crate::helper::{get_metadata_program_id, get_token_metadata_init_space};
use crate::state::{AiAliensPda, NftMintedPda};

use anchor_lang::{prelude::*, solana_program::rent::Rent};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};
use holder_metadata::state::AnchorField;
use spl_token_2022::{
    extension::ExtensionType::{
        self, GroupMemberPointer, MetadataPointer, PermanentDelegate, TransferHook,
    },
    state::Mint as MintState,
};

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        space = AiAliensPda::LEN,
        payer = payer,
        seeds = [AI_ALIENS_PDA_SEED.as_bytes()],
        bump)
    ]
    pub ai_aliens_pda: Account<'info, AiAliensPda>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateState<'info> {
    #[account(address = ai_aliens_pda.admin)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [AI_ALIENS_PDA_SEED.as_bytes()],
        bump)
    ]
    pub ai_aliens_pda: Account<'info, AiAliensPda>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(index: u16)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Account checked in constraints
    #[account(mut, address = ai_aliens_pda.treasury)]
    pub treasury: UncheckedAccount<'info>,
    /// CHECK: Account checked in CPI
    #[account(
        init,
        payer = payer,
        space = ExtensionType::try_calculate_account_len::<MintState>(&[
            MetadataPointer,
            GroupMemberPointer,
            TransferHook,
            PermanentDelegate
        ])?,
        owner = token_program.key(),
    )]
    pub mint: UncheckedAccount<'info>,
    /// CHECK: Account checked in CPI
    #[account(
        init,
        payer = payer,
        space = get_token_metadata_init_space(index)?,
        owner = metadata_program.key(),
    )]
    pub metadata: UncheckedAccount<'info>,
    #[account(mut, seeds = [AI_ALIENS_PDA_SEED.as_bytes()], bump)]
    pub ai_aliens_pda: Account<'info, AiAliensPda>,
    #[account(
        init,
        payer = payer,
        space = NftMintedPda::LEN,
        seeds = [NFT_MINTED_PDA_SEED.as_bytes(), &index.to_le_bytes()],
        bump,
    )]
    pub nft_minted_pda: Account<'info, NftMintedPda>,
    /// CHECK: Account checked in CPI
    #[account(mut)]
    pub field_pda: UncheckedAccount<'info>,
    /// CHECK: Account checked in constraints
    #[account(executable, address = get_metadata_program_id()?)]
    pub metadata_program: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: We're just giving them tokens
    pub dest: UncheckedAccount<'info>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    // NOTE: ImmutableOwner initialized by default in Token2022
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = dest,
    )]
    pub dest_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(seeds = [AI_ALIENS_PDA_SEED.as_bytes()], bump)]
    pub ai_aliens_pda: Account<'info, AiAliensPda>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(field: AnchorField, val: String)]
pub struct UpdateField<'info> {
    #[account(address = ai_aliens_pda.admin)]
    pub admin: Signer<'info>,
    /// CHECK: Account checked in CPI
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    #[account(seeds = [AI_ALIENS_PDA_SEED.as_bytes()], bump)]
    pub ai_aliens_pda: Account<'info, AiAliensPda>,
    /// CHECK: Account checked in constraints
    #[account(executable, address = get_metadata_program_id()?)]
    pub metadata_program: UncheckedAccount<'info>,
}

// NOTE: We allow anyone to call this to make running it on all mints easier
#[derive(Accounts)]
#[instruction(index: u16)]
pub struct NullifyMintAuthority<'info> {
    #[account(mut, address = nft_minted_pda.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    // We'll add this to be a little careful
    #[account(
        seeds = [NFT_MINTED_PDA_SEED.as_bytes(), &index.to_le_bytes()],
        bump,
    )]
    pub nft_minted_pda: Account<'info, NftMintedPda>,
    #[account(seeds = [AI_ALIENS_PDA_SEED.as_bytes()], bump)]
    pub ai_aliens_pda: Account<'info, AiAliensPda>,
    pub token_program: Program<'info, Token2022>,
}
