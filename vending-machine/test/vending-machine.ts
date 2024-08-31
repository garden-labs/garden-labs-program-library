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
  setupMintMetadata,
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

  const mintTemplate = Keypair.generate();
  const metadataTemplate = Keypair.generate();
  const metadataVals: TokenMetadata = {
    name: randomStr(10),
    symbol: randomStr(10),
    uri: randomStr(10),
    updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
    mint: mintTemplate.publicKey,
    additionalMetadata: [],
  };
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

  it("Create template metadata", async () => {
    await setupMintMetadata(mintTemplate, metadataTemplate, metadataVals);
  });

  it("Mint NFT", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    const index = 1;
    const mint = Keypair.generate();
    const metadata = Keypair.generate();

    await program.methods
      .mintNft(new BN(index.toString()))
      .accounts({
        treasury: TREASURY_PUBLIC_KEY,
        creator: creator.publicKey,
        mint: mint.publicKey,
        metadata: metadata.publicKey,
        receiver: ANCHOR_WALLET_KEYPAIR.publicKey,
        metadataProgram: ATM_PROGRAM_ID,
        vendingMachineData: vendingMachineData.publicKey,
        metadataTemplate: metadataTemplate.publicKey,
      })
      .signers([mint, metadata])
      .rpc();
  });
});
