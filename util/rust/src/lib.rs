use anchor_lang::prelude::*;
use std::str::FromStr;

#[error_code]
pub enum GplError {
    #[msg("The public key is invalid")]
    InvalidPublicKey,
}

pub const DUMMY_PUBKEY_STR: &str = "EiH1P1VKhRm9DSMQikddHPs96Zm4cHKiQ87C3DBU7mrv";

pub fn get_pubkey(str: &str) -> Result<Pubkey> {
    Pubkey::from_str(str).map_err(|_| GplError::InvalidPublicKey.into())
}

pub fn get_dummy_pubkey() -> Pubkey {
    return get_pubkey(DUMMY_PUBKEY_STR).unwrap();
}

pub fn reach_minimum_rent<'info>(payer: Signer<'info>, account: AccountInfo<'info>) -> Result<()> {
    let min_rent = Rent::get()?.minimum_balance(account.data_len());
    let delta = min_rent.saturating_sub(account.get_lamports());
    if delta > 0 {
        let ix = &anchor_lang::solana_program::system_instruction::transfer(
            payer.key,
            account.key,
            delta,
        );
        let accounts = &[payer.to_account_info(), account];
        anchor_lang::solana_program::program::invoke(ix, accounts)?;
    }

    Ok(())
}
