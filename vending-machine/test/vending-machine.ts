import assert from "assert";

import { workspace, BN, AnchorError, Program } from "@coral-xyz/anchor";
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
  getSpaceRent,
  getEnsureRentMinTx,
} from "../../util/js/helpers";
import { interpretTxErr } from "../../util/js/tx";
import {
  VENDING_MACHINE_PDA_SEED,
  TREASURY_PUBLIC_KEY,
  MEMBER_PDA_SEED,
  indexToSeed,
} from "../js/vending-machine";
import {
  createInitializeFieldAuthoritiesIx,
  FIELD_AUTHORITY_PDA_SEED,
  FieldAuthorities,
  FieldAuthority,
  fieldToSeedStr,
  getFieldAuthorities,
} from "../../field-authority-interface/js";
import { HolderMetadataPlugin } from "../../target/types/holder_metadata_plugin";

describe("Vending Machine", () => {
  const admin = Keypair.generate();
  const creator = Keypair.generate();
  const maxSupply = 100;
  const mintPriceLamports = 1 * LAMPORTS_PER_SOL;

  const [vendingMachinePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(VENDING_MACHINE_PDA_SEED)],
    new Program<VendingMachine>(workspace.VendingMachine.idl).programId
  );

  const mintTemplate = Keypair.generate();
  const metadataTemplate = Keypair.generate();
  const metadataTemplateVals: TokenMetadata = {
    name: "the100",
    symbol: "THE100",
    uri: "https://arweave.net/",
    updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey, // Not used
    mint: mintTemplate.publicKey,
    additionalMetadata: [],
  };

  const holderField: FieldAuthority = {
    field: "streamUrl",
    authority: new Program<HolderMetadataPlugin>(
      workspace.HolderMetadataPlugin.idl
    ).programId,
  };
  const fieldAuthorities: FieldAuthorities = {
    authorities: [holderField],
  };

  const vendingMachineData = Keypair.generate();

  const holder = Keypair.generate();

  it("Init", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    const data = {
      admin: admin.publicKey,
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

  it("Create metadata template and field authorities", async () => {
    await setupMintMetadata(
      mintTemplate,
      metadataTemplate,
      metadataTemplateVals,
      fieldAuthorities
    );

    // TODO: Modularize this in helpers, perhaps after SDK is updated
    // Init ix
    const ix = createInitializeFieldAuthoritiesIx({
      programId: ATM_PROGRAM_ID,
      metadata: metadataTemplate.publicKey,
      updateAuthority: metadataTemplateVals.updateAuthority as PublicKey,
      fieldAuthorities,
    });
    const tx = new Transaction().add(ix);

    // Ensure rent minimum
    const { rent } = await getSpaceRent(
      CONNECTION,
      metadataTemplateVals,
      fieldAuthorities
    );
    const rentIx = await getEnsureRentMinTx(
      CONNECTION,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      metadataTemplate.publicKey,
      rent
    );
    if (rentIx) {
      tx.add(rentIx);
    }

    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

    // Check field authorities
    const accountFieldAuthorities = await getFieldAuthorities(
      CONNECTION,
      metadataTemplate.publicKey
    );
    assert.deepStrictEqual(accountFieldAuthorities, fieldAuthorities);
  });

  it("Setup holder for next test", async () => {
    if (process.env.TEST_ENV !== "localnet") {
      throw new Error("Test unsupported on non-localnet");
    }

    // Give holder some lamports
    const amount = 10 * LAMPORTS_PER_SOL;
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: ANCHOR_WALLET_KEYPAIR.publicKey,
        toPubkey: holder.publicKey,
        lamports: amount,
      })
    );
    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);
    const holderBalance = await CONNECTION.getBalance(holder.publicKey);
    assert.equal(holderBalance, amount);
  });

  function getMetadataVals(index: number, mint: PublicKey): TokenMetadata {
    const metadata: TokenMetadata = {
      name: `${metadataTemplateVals.name} #${index}`,
      symbol: metadataTemplateVals.symbol,
      uri: `${metadataTemplateVals.uri}${index}.json`,
      updateAuthority: vendingMachinePda,
      mint,
      additionalMetadata: [],
    };
    return metadata;
  }

  it("Mint NFT", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    const index = 1;
    const mint = Keypair.generate();
    const metadata = Keypair.generate();

    const preTreasuryBalance = await CONNECTION.getBalance(TREASURY_PUBLIC_KEY);
    const preCreatorBalance = await CONNECTION.getBalance(creator.publicKey);

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

    // Get mint info
    const mintInfo = await getMint(
      CONNECTION,
      mint.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Check metadata pointer
    const metadataPointerState = getMetadataPointerState(mintInfo);
    assert(metadataPointerState);
    assert(metadataPointerState.metadataAddress);
    assert(metadataPointerState.metadataAddress.equals(metadata.publicKey));

    // Check group member pointer
    const groupMemberPointerState = getGroupMemberPointerState(mintInfo);
    assert(groupMemberPointerState?.authority?.equals(vendingMachinePda));
    assert(groupMemberPointerState?.memberAddress?.equals(mint.publicKey));

    // Check transfer hook
    const transferHook = getTransferHook(mintInfo);
    assert(transferHook?.authority?.equals(vendingMachinePda));
    assert(transferHook?.programId.equals(PublicKey.default));

    // Check permanent delegate
    const permanentDelegate = getPermanentDelegate(mintInfo);
    assert(permanentDelegate?.delegate?.equals(vendingMachinePda));

    // Check token balance
    const holderAta = await getAssociatedTokenAddress(
      mint.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    const holderAtaBalance = await CONNECTION.getTokenAccountBalance(holderAta);
    assert.equal(holderAtaBalance.value.amount, 1);

    // Check protocol fees
    const postTreasuryBalance = await CONNECTION.getBalance(
      TREASURY_PUBLIC_KEY
    );
    assert.equal(postTreasuryBalance - preTreasuryBalance, 1_000_000);

    // Check mint price
    const postCreatorBalance = await CONNECTION.getBalance(creator.publicKey);
    assert.equal(postCreatorBalance - preCreatorBalance, mintPriceLamports);

    // Check metadata
    const emittedMetadata = await getEmittedMetadata(
      ATM_PROGRAM_ID,
      metadata.publicKey
    );
    const vals = getMetadataVals(1, mint.publicKey);
    // metadataVals.additionalMetadata.push([
    //   holderFieldKey,
    //   holderFieldDefaultVal,
    // ]);
    assert.deepStrictEqual(emittedMetadata, vals);

    // Check mint authority is None
    assert.equal(mintInfo.mintAuthority, null);

    // Check member PDA data
    const [memberPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(MEMBER_PDA_SEED),
        vendingMachineData.publicKey.toBuffer(),
        indexToSeed(new BN(index.toString())),
      ],
      program.programId
    );
    const memberPdaData = await program.account.memberPda.fetch(memberPda);
    assert(memberPdaData.mint.equals(mint.publicKey));

    // Check field authorities
    const accountFieldAuthorities = await getFieldAuthorities(
      CONNECTION,
      metadataTemplate.publicKey
    );
    assert.deepStrictEqual(accountFieldAuthorities, fieldAuthorities);

    // TODO: Check actual member once group is enabled in token-2022
  });

  // TODO: Test wrong metadata template values, specifically the wrong update authority
});
