import assert from "assert";

import { workspace, BN, AnchorError } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { setPayer } from "../../util/js/config";
import { ANCHOR_WALLET_KEYPAIR } from "../../util/js/constants";
import { VendingMachine } from "../../target/types/vending_machine";
import { randomStr } from "../../util/js/helpers";

describe("Vending Machine", () => {
  const vendingMachineData = Keypair.generate();
  const admin = ANCHOR_WALLET_KEYPAIR;
  const treasury = Keypair.generate();
  const maxSupply = 10000;
  const mintPriceLamports = 0.1 * LAMPORTS_PER_SOL;
  const namePrefix = randomStr(32);
  const symbol = randomStr(10);
  const uriPrefix = randomStr(200);

  it("Initialize fails with invalid name prefix", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    try {
      await program.methods
        .init({
          admin: admin.publicKey,
          treasury: treasury.publicKey,
          maxSupply,
          mintPriceLamports: new BN(mintPriceLamports.toString()),
          namePrefix: randomStr(33),
          symbol,
          uriPrefix,
        })
        .accountsPartial({
          vendingMachineData: vendingMachineData.publicKey,
        })
        .signers([vendingMachineData])
        .rpc();
    } catch (err) {
      if (
        !(
          err instanceof AnchorError &&
          err.error.errorCode.code === "NamePrefixTooLong"
        )
      ) {
        throw err;
      }
    }
  });

  it("Initialize", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    await program.methods
      .init({
        admin: admin.publicKey,
        treasury: treasury.publicKey,
        maxSupply,
        mintPriceLamports: new BN(mintPriceLamports.toString()),
        namePrefix,
        symbol,
        uriPrefix,
      })
      .accountsPartial({
        vendingMachineData: vendingMachineData.publicKey,
      })
      .signers([vendingMachineData])
      .rpc();

    // Check state
    const v = await program.account.vendingMachineData.fetch(
      vendingMachineData.publicKey
    );
    assert(v.admin.equals(admin.publicKey));
    assert(v.treasury.equals(treasury.publicKey));
    assert.equal(v.maxSupply, maxSupply);
    assert.equal(v.mintPriceLamports, mintPriceLamports);
    assert.equal(v.namePrefix, namePrefix);
    assert.equal(v.symbol, symbol);
    assert.equal(v.uriPrefix, uriPrefix);
  });
});
