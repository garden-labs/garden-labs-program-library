use crate::constants::DUMMY_PUBKEY_STR;
use crate::errors::VendingMachineError;

use anchor_lang::prelude::*;
use std::str::FromStr;

pub fn get_pubkey(str: &str) -> Result<Pubkey> {
    Pubkey::from_str(str).map_err(|_| VendingMachineError::InvalidPublicKey.into())
}

pub fn get_dummy_pubkey() -> Pubkey {
    return get_pubkey(DUMMY_PUBKEY_STR).unwrap();
}

pub fn reach_minimum_balance<'info>(
    account: AccountInfo<'info>,
    payer: Signer<'info>,
) -> Result<()> {
    let min_balance = Rent::get()?.minimum_balance(account.data_len());
    let delta = min_balance.saturating_sub(account.get_lamports());
    if delta > 0 {
        let ix = &anchor_lang::solana_program::system_instruction::transfer(
            payer.key,
            account.key,
            delta,
        );
        let accounts = &[account, payer.to_account_info()];
        anchor_lang::solana_program::program::invoke(ix, accounts)?;
    }

    Ok(())
}
