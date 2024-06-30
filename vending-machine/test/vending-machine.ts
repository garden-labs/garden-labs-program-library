import assert from "assert";

import { workspace, BN, AnchorError } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { setPayer } from "../../util/js/config";
import { ANCHOR_WALLET_KEYPAIR } from "../../util/js/constants";
import { VendingMachine } from "../../target/types/vending_machine";
import { randomStr } from "../../util/js/helpers";
import { VENDING_MACHINE_PDA_SEED } from "vending-machine/js/vending-machine";

describe("Vending Machine", () => {
  const vendingMachineData = Keypair.generate();
  const admin = ANCHOR_WALLET_KEYPAIR;
  const treasury = Keypair.generate();
  const maxSupply = 10000;
  const mintPriceLamports = 0.1 * LAMPORTS_PER_SOL;
  const namePrefix = randomStr(32);
  const symbol = randomStr(10);
  const uriPrefix = randomStr(200);

  const [vendingMachinePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(VENDING_MACHINE_PDA_SEED)],
    setPayer<VendingMachine>(ANCHOR_WALLET_KEYPAIR, workspace.VendingMachine)
      .program.programId
  );

  it("Init fails with invalid name prefix", async () => {
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

  it("Init fails with invalid symbol prefix", async () => {
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
          namePrefix,
          symbol: randomStr(11),
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
          err.error.errorCode.code === "SymbolTooLong"
        )
      ) {
        throw err;
      }
    }
  });

  it("Init fails with invalid uri prefix", async () => {
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
          namePrefix,
          symbol,
          uriPrefix: randomStr(201),
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
          err.error.errorCode.code === "UriPrefixTooLong"
        )
      ) {
        throw err;
      }
    }
  });

  it("Init", async () => {
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

  it("Create mint", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    const mint = Keypair.generate();

    await program.methods
      .mintNft()
      .accounts({
        treasury: treasury.publicKey,
        vendingMachineData: vendingMachineData.publicKey,
      })
      .rpc();
  });
});
