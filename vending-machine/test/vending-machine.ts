import assert from "assert";

import { workspace, BN, AnchorError } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
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
import { randomStr, getEmittedMetadata } from "../../util/js/helpers";
import {
  VENDING_MACHINE_PDA_SEED,
  TREASURY_PUBLIC_KEY,
} from "../js/vending-machine";
import {
  FIELD_AUTHORITY_PDA_SEED,
  fieldToSeedStr,
} from "../../field-authority-interface/js/field-authority-interface";

describe("Vending Machine", () => {
  const vendingMachineData = Keypair.generate();
  const creator = Keypair.generate();
  const colMint = Keypair.generate();
  const maxSupply = 10000;
  const mintPriceLamports = 0.1 * LAMPORTS_PER_SOL;
  const name = randomStr(32);
  const symbol = randomStr(10);
  const uri = randomStr(200);
  const holderFieldKey = randomStr(28);
  const holderFieldDefaultVal = randomStr(200);

  const mints: PublicKey[] = [];

  const [vendingMachinePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(VENDING_MACHINE_PDA_SEED)],
    setPayer<VendingMachine>(ANCHOR_WALLET_KEYPAIR, workspace.VendingMachine)
      .program.programId
  );

  function getColMetadataVals(): TokenMetadata {
    const metadataVals: TokenMetadata = {
      name,
      symbol,
      uri: `${uri}collection.json`,
      updateAuthority: vendingMachinePda,
      mint: colMint.publicKey,
      additionalMetadata: [],
    };
    return metadataVals;
  }

  function getMemberMetadataVals(index: number): TokenMetadata {
    const mint = mints[index - 1];

    const metadataVals: TokenMetadata = {
      name: `${name} #${index}`,
      symbol,
      uri: `${uri}${index}.json`,
      updateAuthority: vendingMachinePda,
      mint,
      additionalMetadata: [],
    };
    return metadataVals;
  }

  it("Init fails with invalid name", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    try {
      await program.methods
        .init({
          admin: ANCHOR_WALLET_KEYPAIR.publicKey,
          creator: creator.publicKey,
          maxSupply,
          mintPriceLamports: new BN(mintPriceLamports.toString()),
          name: randomStr(33),
          symbol,
          uri,
          holderFieldKey,
          holderFieldDefaultVal,
        })
        .accounts({
          colMint: colMint.publicKey,
          vendingMachineData: vendingMachineData.publicKey,
        })
        .signers([vendingMachineData, colMint])
        .rpc();
    } catch (err) {
      if (
        !(
          err instanceof AnchorError &&
          err.error.errorCode.code === "NameTooLong"
        )
      ) {
        throw err;
      }
    }
  });

  it("Init fails with invalid symbol", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    try {
      await program.methods
        .init({
          admin: ANCHOR_WALLET_KEYPAIR.publicKey,
          creator: creator.publicKey,
          maxSupply,
          mintPriceLamports: new BN(mintPriceLamports.toString()),
          name,
          symbol: randomStr(11),
          uri,
          holderFieldKey,
          holderFieldDefaultVal,
        })
        .accounts({
          colMint: colMint.publicKey,
          vendingMachineData: vendingMachineData.publicKey,
        })
        .signers([vendingMachineData, colMint])
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

  it("Init fails with invalid uri", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    try {
      await program.methods
        .init({
          admin: ANCHOR_WALLET_KEYPAIR.publicKey,
          creator: creator.publicKey,
          maxSupply,
          mintPriceLamports: new BN(mintPriceLamports.toString()),
          name,
          symbol,
          uri: randomStr(201),
          holderFieldKey,
          holderFieldDefaultVal,
        })
        .accounts({
          colMint: colMint.publicKey,
          vendingMachineData: vendingMachineData.publicKey,
        })
        .signers([vendingMachineData, colMint])
        .rpc();
    } catch (err) {
      if (
        !(
          err instanceof AnchorError &&
          err.error.errorCode.code === "UriTooLong"
        )
      ) {
        throw err;
      }
    }
  });

  // TODO: Test holder field empty

  it("Init", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    await program.methods
      .init({
        admin: ANCHOR_WALLET_KEYPAIR.publicKey,
        creator: creator.publicKey,
        maxSupply,
        mintPriceLamports: new BN(mintPriceLamports.toString()),
        name,
        symbol,
        uri,
        holderFieldKey,
        holderFieldDefaultVal,
      })
      .accounts({
        colMint: colMint.publicKey,
        vendingMachineData: vendingMachineData.publicKey,
      })
      .signers([vendingMachineData, colMint])
      .rpc();

    // Check vending machine data
    const v = await program.account.vendingMachineData.fetch(
      vendingMachineData.publicKey
    );
    assert(v.admin.equals(ANCHOR_WALLET_KEYPAIR.publicKey));
    assert(v.creator.equals(creator.publicKey));
    assert.equal(v.maxSupply, maxSupply);
    assert.equal(v.mintPriceLamports, mintPriceLamports);
    assert.equal(v.name, name);
    assert.equal(v.symbol, symbol);
    assert.equal(v.uri, uri);

    // Get mint info
    const mintInfo = await getMint(
      CONNECTION,
      colMint.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Check mint authority is Vending Machine PDA
    assert(mintInfo.mintAuthority?.equals(vendingMachinePda));

    // Check group pointer
    const groupPointerState = getGroupPointerState(mintInfo);
    assert(groupPointerState?.authority?.equals(vendingMachinePda));
    assert(groupPointerState?.groupAddress?.equals(colMint.publicKey));

    // Check collection metadata
    const emittedMetadata = await getEmittedMetadata(
      TOKEN_2022_PROGRAM_ID,
      colMint.publicKey
    );
    const metadataVals = getColMetadataVals();
    assert.deepStrictEqual(emittedMetadata, metadataVals);

    // TODO: Check group once group is enabled in token-2022
  });

  it("Mint NFT", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    const mint = Keypair.generate();
    const metadata = Keypair.generate();

    const [fieldPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(holderFieldKey)),
        metadata.publicKey.toBuffer(),
      ],
      ATM_PROGRAM_ID
    );

    const preTreasuryBalance = await CONNECTION.getBalance(TREASURY_PUBLIC_KEY);
    const preCreatorBalance = await CONNECTION.getBalance(creator.publicKey);

    await program.methods
      .mintNft(new BN("1"))
      .accounts({
        treasury: TREASURY_PUBLIC_KEY,
        creator: creator.publicKey,
        mint: mint.publicKey,
        metadata: metadata.publicKey,
        receiver: ANCHOR_WALLET_KEYPAIR.publicKey,
        metadataProgram: ATM_PROGRAM_ID,
        fieldPda,
        vendingMachineData: vendingMachineData.publicKey,
      })
      .signers([mint, metadata])
      .rpc();

    // Add to mints array for future tests
    mints.push(mint.publicKey);

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
    const anchorWalletAta = await getAssociatedTokenAddress(
      mint.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    const anchorWalletAtaBalance = await CONNECTION.getTokenAccountBalance(
      anchorWalletAta
    );
    assert.equal(anchorWalletAtaBalance.value.amount, 1);

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
    const metadataVals = getMemberMetadataVals(1);
    metadataVals.additionalMetadata.push([
      holderFieldKey,
      holderFieldDefaultVal,
    ]);
    assert.deepStrictEqual(emittedMetadata, metadataVals);

    // Check mint authority is None
    assert.equal(mintInfo.mintAuthority, null);

    // TODO: Check member once group is enabled in token-2022
  });

  // TODO: Check max holder field length

  // TODO: Test no holder field

  // TODO: Test royalties on transfer once implemented
});
