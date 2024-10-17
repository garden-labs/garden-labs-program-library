use {
  crate::{
      constants::{MAX_SUPPLY, MEMBER_PDA_SEED, MINT_FEE_LAMPORTS, THE100_PDA_SEED},
      errors::The100Error,
      helpers::{
          get_metadata_init_vals, get_admin_pubkey, update_field,
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
          TokenMetadataUpdateField, token_member_initialize, TokenMemberInitialize
      },
  },
  gpl_common::reach_minimum_rent,
  spl_token_metadata_interface::state::Field,
  spl_type_length_value::state::{TlvState, TlvStateBorrowed},
};

#[derive(Accounts)]
pub struct InitGroup<'info> {
  // TODO: Check address is admin
  #[account(constraint = payer.key() == get_admin_pubkey())]
  pub payer: Signer<'info>,
}

pub fn handle_init_group(mut ctx: Context<InitGroup>) -> Result<()> {
  // Initialize token group member
  // let accounts = TokenGroupInitialize {
  //   token_program_id: ctx.accounts.token_program.to_account_info(),
  //   group: ctx.accounts.mint.to_account_info(),
  //   mint: ctx.accounts.mint.to_account_info(),
  //   mint_authority: ctx.accounts.the100_pda.to_account_info(),
  // };
  
  Ok(())
}