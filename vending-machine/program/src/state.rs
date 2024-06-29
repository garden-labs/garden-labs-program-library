use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug, InitSpace)]
pub struct VendingMachineData {
    pub admin: Pubkey,            // 32
    pub treasury: Pubkey,         // 32
    pub max_supply: u16,          // 2
    pub mint_price_lamports: u64, // 8
    #[max_len(32)]
    pub name_prefix: String, // 32
    #[max_len(32)]
    pub symbol: String, // 32
    #[max_len(200)]
    pub uri_prefix: String, // 200
}

// impl VendingMachineData {
//     pub fn validate(&self) -> Result<()> {
//         require!(
//             self.name_prefix.len() <= 32,
//             VendingMachineError::NamePrefixTooLong
//         );
//         require!(self.symbol.len() <= 32, VendingMachineError::SymbolTooLong);
//         require!(
//             self.uri_prefix.len() <= 200,
//             VendingMachineError::UriPrefixTooLong
//         );
//         require!(self.max_supply > 0, VendingMachineError::InvalidMaxSupply);
//         require!(
//             self.mint_price_lamports > 0,
//             VendingMachineError::InvalidMintPrice
//         );
//         Ok(())
//     }
// }
