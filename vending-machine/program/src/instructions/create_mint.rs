use crate::VendingMachineData;

use anchor_lang::prelude::*;

pub fn handle_create_mint(ctx: Context<CreateMint>) -> Result<()> {
    // TODO: Use collection pointer to determine if mint exists

    Ok(())
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    // /// CHECK: Account checked in constraints
    // #[account(mut, constraint = treasury.key() == vending_machine_data.treasury)]
    // pub treasury: UncheckedAccount<'info>,
    // /// CHECK: Account checked in CPI
    // #[account(
    //     init,
    //     payer = payer,
    //     space = ExtensionType::try_calculate_account_len::<MintState>(&[
    //         MetadataPointer,
    //         GroupMemberPointer,
    //         TransferHook,
    //         PermanentDelegate
    //     ])?,
    //     owner = token_program.key(),
    // )]
    // pub mint: UncheckedAccount<'info>,
    // pub vending_machine_data: Account<'info, VendingMachineData>,
}
