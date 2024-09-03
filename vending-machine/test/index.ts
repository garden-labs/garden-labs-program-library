import assert from "assert";

import { workspace, BN, Program, AnchorError } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  SendTransactionError,
} from "@solana/web3.js";
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  getMetadataPointerState,
  getPermanentDelegate,
  getTransferHook,
  getGroupMemberPointerState,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { TokenMetadata } from "@solana/spl-token-metadata";

import { setPayer, getConnection } from "../../util/js/config";
import { ANCHOR_WALLET_KEYPAIR } from "../../util/js/constants";
import { ATM_PROGRAM_ID } from "../../advanced-token-metadata/js";
import { VendingMachine } from "../../target/types/vending_machine";
import { setupMintMetadata } from "../../util/js/helpers";
import {
  randomStr,
  getEnsureRentMinTx,
  getEmittedMetadata,
  fieldToAnchorParam,
} from "../../common/js";
import {
  VENDING_MACHINE_PDA_SEED,
  TREASURY_PUBLIC_KEY,
  MEMBER_PDA_SEED,
  indexToSeed,
} from "../js";
import {
  createInitializeFieldAuthoritiesIx,
  FieldAuthorities,
  FieldAuthority,
  getFieldAuthorities,
  getSpaceRent,
} from "../../field-authority-interface/js";
import { HolderMetadataPlugin } from "../../target/types/holder_metadata_plugin";
import { HOLDER_METADATA_PDA_SEED } from "../../holder-metadata-plugin/js";

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

  const [holderMetadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(HOLDER_METADATA_PDA_SEED)],
    new Program<HolderMetadataPlugin>(workspace.HolderMetadataPlugin.idl)
      .programId
  );
  const holderField: FieldAuthority = {
    field: "streamUrl",
    authority: holderMetadataPda,
  };
  const fieldAuthorities: FieldAuthorities = {
    authorities: [holderField],
  };

  const vendingMachineData = Keypair.generate();
  console.log("Vending Machine Data:", creator.publicKey.toBase58()); // Log for manual testing in backend

  const holder = Keypair.generate();

  const mints: Keypair[] = [];
  const metadatas: Keypair[] = [];

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
      getConnection(),
      metadataTemplateVals,
      fieldAuthorities
    );
    const rentIx = await getEnsureRentMinTx(
      getConnection(),
      ANCHOR_WALLET_KEYPAIR.publicKey,
      metadataTemplate.publicKey,
      rent
    );
    if (rentIx) {
      tx.add(rentIx);
    }

    await sendAndConfirmTransaction(getConnection(), tx, [
      ANCHOR_WALLET_KEYPAIR,
    ]);

    // Check field authorities
    const accountFieldAuthorities = await getFieldAuthorities(
      getConnection(),
      metadataTemplate.publicKey
    );
    assert.deepStrictEqual(accountFieldAuthorities, fieldAuthorities);
  });

  it("Setup holder for next tests", async () => {
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
    await sendAndConfirmTransaction(getConnection(), tx, [
      ANCHOR_WALLET_KEYPAIR,
    ]);
    const holderBalance = await getConnection().getBalance(holder.publicKey);
    assert.equal(holderBalance, amount);
  });

  function getInitMetadataVals(index: number, mint: PublicKey): TokenMetadata {
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
      holder,
      workspace.VendingMachine
    );

    const index = 1;

    const mint = Keypair.generate();
    mints.push(mint);

    const metadata = Keypair.generate();
    metadatas.push(metadata);

    const preTreasuryBalance = await getConnection().getBalance(
      TREASURY_PUBLIC_KEY
    );
    const preCreatorBalance = await getConnection().getBalance(
      creator.publicKey
    );

    await program.methods
      .mintNft(new BN(index.toString()))
      .accounts({
        treasury: TREASURY_PUBLIC_KEY,
        creator: creator.publicKey,
        mint: mint.publicKey,
        metadata: metadata.publicKey,
        receiver: holder.publicKey,
        metadataProgram: ATM_PROGRAM_ID,
        vendingMachineData: vendingMachineData.publicKey,
        metadataTemplate: metadataTemplate.publicKey,
      })
      .signers([mint, metadata])
      .rpc();

    // Get mint info
    const mintInfo = await getMint(
      getConnection(),
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
      holder.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    const holderAtaBalance = await getConnection().getTokenAccountBalance(
      holderAta
    );
    assert.equal(holderAtaBalance.value.amount, 1);

    // Check protocol fees
    const postTreasuryBalance = await getConnection().getBalance(
      TREASURY_PUBLIC_KEY
    );
    assert.equal(postTreasuryBalance - preTreasuryBalance, 1_000_000);

    // Check mint price
    const postCreatorBalance = await getConnection().getBalance(
      creator.publicKey
    );
    assert.equal(postCreatorBalance - preCreatorBalance, mintPriceLamports);

    // Check metadata
    const emittedMetadata = await getEmittedMetadata(
      getConnection(),
      ATM_PROGRAM_ID,
      metadata.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey
    );
    const vals = getInitMetadataVals(1, mint.publicKey);
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
      getConnection(),
      metadataTemplate.publicKey
    );
    assert.deepStrictEqual(accountFieldAuthorities, fieldAuthorities);

    // TODO: Check actual member once group is enabled in token-2022
  });

  it("Mint NFT index 1 twice fails", async () => {
    const { program } = setPayer<VendingMachine>(
      holder,
      workspace.VendingMachine
    );

    try {
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
          receiver: holder.publicKey,
          metadataProgram: ATM_PROGRAM_ID,
          vendingMachineData: vendingMachineData.publicKey,
          metadataTemplate: metadataTemplate.publicKey,
        })
        .signers([mint, metadata])
        .rpc();
      throw new Error("Should have thrown");
    } catch (err) {
      assert(err instanceof SendTransactionError);
    }
  });

  it("Mint NFT index 0 fails", async () => {
    const { program } = setPayer<VendingMachine>(
      holder,
      workspace.VendingMachine
    );

    try {
      const index = 0;
      const mint = Keypair.generate();
      const metadata = Keypair.generate();

      await program.methods
        .mintNft(new BN(index.toString()))
        .accounts({
          treasury: TREASURY_PUBLIC_KEY,
          creator: creator.publicKey,
          mint: mint.publicKey,
          metadata: metadata.publicKey,
          receiver: holder.publicKey,
          metadataProgram: ATM_PROGRAM_ID,
          vendingMachineData: vendingMachineData.publicKey,
          metadataTemplate: metadataTemplate.publicKey,
        })
        .signers([mint, metadata])
        .rpc();
      throw new Error("Should have thrown");
    } catch (err) {
      assert(
        err instanceof AnchorError &&
          err.error.errorCode.code === "IndexOutOfBounds"
      );
    }
  });

  it("Mint NFT index above max supply fails", async () => {
    const { program } = setPayer<VendingMachine>(
      holder,
      workspace.VendingMachine
    );

    try {
      const index = maxSupply + 1;
      const mint = Keypair.generate();
      const metadata = Keypair.generate();

      await program.methods
        .mintNft(new BN(index.toString()))
        .accounts({
          treasury: TREASURY_PUBLIC_KEY,
          creator: creator.publicKey,
          mint: mint.publicKey,
          metadata: metadata.publicKey,
          receiver: holder.publicKey,
          metadataProgram: ATM_PROGRAM_ID,
          vendingMachineData: vendingMachineData.publicKey,
          metadataTemplate: metadataTemplate.publicKey,
        })
        .signers([mint, metadata])
        .rpc();
      throw new Error("Should have thrown");
    } catch (err) {
      assert(
        err instanceof AnchorError &&
          err.error.errorCode.code === "IndexOutOfBounds"
      );
    }
  });

  it("Update holder field with holder", async () => {
    const { program } = setPayer<HolderMetadataPlugin>(
      holder,
      workspace.HolderMetadataPlugin
    );

    const index = 1;
    const mint = mints[index - 1];
    const metadata = metadatas[index - 1];

    const param = fieldToAnchorParam(holderField.field);
    const newHolderFieldVal = randomStr(10);

    await program.methods
      .updateHolderFieldV2(param, newHolderFieldVal)
      .accounts({
        mint: mint.publicKey,
        metadata: metadata.publicKey,
        fieldAuthorityProgram: ATM_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    const vals = getInitMetadataVals(index, mint.publicKey);
    vals.additionalMetadata.push([
      holderField.field as string,
      newHolderFieldVal,
    ]);
    const emittedMetadata = await getEmittedMetadata(
      getConnection(),
      ATM_PROGRAM_ID,
      metadata.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, vals);
  });

  // TODO: Test wrong metadata template values, specifically the wrong update authority
});
