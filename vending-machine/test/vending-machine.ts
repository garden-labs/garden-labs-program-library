import assert from "assert";

import { workspace } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";

import { setPayer } from "../../util/js/config";
import { ANCHOR_WALLET_KEYPAIR } from "../../util/js/constants";
import { VendingMachine } from "../../target/types/vending_machine";

describe("Vending Machine", () => {
  it("Initialize", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    const admin = ANCHOR_WALLET_KEYPAIR.publicKey;
    const vendingMachineDataKp = Keypair.generate();
    const vendingMachineData = vendingMachineDataKp.publicKey;

    await program.methods
      .init({
        admin,
      })
      .accountsPartial({
        vendingMachineData,
      })
      .signers([vendingMachineDataKp])
      .rpc();

    // Check state
    const v = await program.account.vendingMachineData.fetch(
      vendingMachineData
    );
    assert(v.admin.equals(admin));
  });
});
