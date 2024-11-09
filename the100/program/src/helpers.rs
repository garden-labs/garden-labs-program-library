use {
    crate::constants::THE100_PDA_SEED,
    anchor_lang::{prelude::*, solana_program::native_token::LAMPORTS_PER_SOL},
    anchor_spl::token_interface::{token_metadata_update_field, TokenMetadataUpdateField},
    spl_token_metadata_interface::state::{Field, TokenMetadata},
};

fn get_the100_pda() -> Pubkey {
    let (pda, _bump) = Pubkey::find_program_address(&[THE100_PDA_SEED.as_bytes()], &crate::ID);
    return pda;
}

pub fn get_metadata_init_vals(index: u16, mint: Pubkey) -> Result<TokenMetadata> {
    let init_vals = TokenMetadata {
        name: format!("the100 Channel #{}", index),
        symbol: "THE100".to_string(),
        uri: format!("https://firebasestorage.googleapis.com/v0/b/the100-f61ce.appspot.com/o/uri%2F{}.json?alt=media", index - 1),
        update_authority: Some(get_the100_pda()).try_into().unwrap(),
        mint,
        // These need to be added with an additional instruction
        additional_metadata: vec![
            ("channel_num".to_string(), index.to_string()),
        ],
    };
    return Ok(init_vals);
}

pub fn update_field<'info>(
    token_program: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    the100_pda: AccountInfo<'info>,
    the100_pda_bump: u8,
    field: Field,
    val: String,
) -> Result<()> {
    let accounts = TokenMetadataUpdateField {
        token_program_id: token_program.clone(),
        metadata: mint,
        update_authority: the100_pda,
    };
    let the100_pda_seeds: &[&[u8]; 2] = &[THE100_PDA_SEED.as_bytes(), &[the100_pda_bump]];
    let signer_seeds = &[&the100_pda_seeds[..]];
    let update_field_ctx = CpiContext::new_with_signer(token_program, accounts, signer_seeds);
    token_metadata_update_field(update_field_ctx, field, val)?;

    Ok(())
}

pub fn get_mint_fee_lamports(index: u16) -> u64 {
    return 1 * LAMPORTS_PER_SOL + 900_000 * (index as u64).pow(2);
}
