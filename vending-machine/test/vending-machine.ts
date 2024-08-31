import assert from "assert";

import { workspace, BN, AnchorError } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  getMetadataPointerState,
  getPermanentDelegate,
  getTransferHook,
  getGroupMemberPointerState,
  getGroupPointerState,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { TokenMetadata } from "@solana/spl-token-metadata";

import { setPayer, CONNECTION } from "../../util/js/config";
import { ANCHOR_WALLET_KEYPAIR, ATM_PROGRAM_ID } from "../../util/js/constants";
import { VendingMachine } from "../../target/types/vending_machine";
import {
  randomStr,
  getEmittedMetadata,
  fieldToAnchorParam,
} from "../../util/js/helpers";
import { interpretTxErr } from "../../util/js/tx";
import {
  VENDING_MACHINE_PDA_SEED,
  TREASURY_PUBLIC_KEY,
  MEMBER_PDA_SEED,
  indexToSeed,
} from "../js/vending-machine";
import {
  FIELD_AUTHORITY_PDA_SEED,
  fieldToSeedStr,
} from "../../field-authority-interface/js";
import { HolderMetadataPlugin } from "../../target/types/holder_metadata_plugin";

describe("Vending Machine", () => {
  const creator = Keypair.generate();
  const maxSupply = 10000;
  const mintPriceLamports = 0.1 * LAMPORTS_PER_SOL;

  const metadataTemplate = Keypair.generate();
  const vendingMachineData = Keypair.generate();

  it("Init", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    const data = {
      creator: creator.publicKey,
      metadataTemplate: metadataTemplate.publicKey,
      maxSupply: new BN(maxSupply.toString()),
      mintPriceLamports: new BN(mintPriceLamports.toString()),
    };

    await program.methods
      .init(data)
      .accounts({
        vendingMachineData: vendingMachineData.publicKey,
      })
      .signers([vendingMachineData])
      .rpc();

    // Check vending machine data
    const v = await program.account.vendingMachineData.fetch(
      vendingMachineData.publicKey
    );
    assert(v.creator.equals(creator.publicKey));
    assert(v.metadataTemplate.equals(metadataTemplate.publicKey));
    assert.equal(v.maxSupply, maxSupply);
    assert.equal(v.mintPriceLamports, mintPriceLamports);
  });
});
