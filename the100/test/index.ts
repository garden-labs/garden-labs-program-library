import assert from "assert";

// TODO: Get globals recognized in Cursor IDE
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, it, beforeAll } from "vitest";
import { workspace, Program, AnchorError } from "@coral-xyz/anchor";
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

import {
  setPayer,
  getConnection,
  ANCHOR_WALLET_KEYPAIR,
  updateField,
} from "../../util";
import { The100 } from "../../target/types/the_100";
import {
  getAccountMetadata,
  getEmittedMetadata,
  randomStr,
} from "../../common/js";
import {
  THE100_PDA_SEED,
  MEMBER_PDA_SEED,
  indexToSeed,
  getMintFeeLamports
} from "../js";

describe("the100", () => {
  const maxSupply = 100;

  const colData = Keypair.generate();
  const admin = ANCHOR_WALLET_KEYPAIR;
  const treasury = Keypair.generate().publicKey;
  const holder = Keypair.generate();

  const [the100Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(THE100_PDA_SEED)],
    // eslint-disable-next-line @typescript-eslint/dot-notation
    new Program<The100>(workspace.the100.idl).programId
  );

  const mints: Map<number, Keypair> = new Map();

  // Setup holder
  beforeAll(async () => {
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

  it("Init collection data", async () => {
    const tempTreasury = Keypair.generate().publicKey;

    const { program } = setPayer<The100>(admin, workspace.the100);

    await program.methods
      .initColData(admin.publicKey, tempTreasury)
      .accounts({
        colData: colData.publicKey,
      })
      .signers([colData])
      .rpc();

    const c = await program.account.colData.fetch(colData.publicKey);
    assert(c.admin.equals(admin.publicKey));
    assert(c.treasury.equals(tempTreasury));
  });

  async function updateColData(a: Keypair, t: PublicKey): Promise<void> {
    const { program } = setPayer<The100>(a, workspace.the100);

    await program.methods
      .updateColData(a.publicKey, t)
      .accounts({
        colData: colData.publicKey,
      })
      .rpc();

    const c = await program.account.colData.fetch(colData.publicKey);
    assert(c.admin.equals(a.publicKey));
    assert(c.treasury.equals(t));
  }

  it("Update collection data", async () => {
    await updateColData(admin, treasury);
  });

  it("Update collection data with wrong admin fails", async () => {
    const newTreasury = Keypair.generate().publicKey;

    try {
      await updateColData(holder, newTreasury);
      throw new Error("Should have thrown");
    } catch (err) {
      assert(
        err instanceof AnchorError &&
        err.error.errorCode.code === "ConstraintRaw"
      );
    }
  });

  // TODO: Finish implementation once Anchor supports
  // async function initGroup(payer: Keypair): Promise<void> {
  //   // eslint-disable-next-line @typescript-eslint/dot-notation
  //   const { program } = setPayer<The100>(payer, workspace.the100);

  //   const mint = Keypair.generate();

  //   await program.methods
  //     .initGroup()
  //     .accounts({
  //       mint: mint.publicKey,
  //       colData: colData.publicKey,
  //     })
  //     .signers([mint])
  //     .rpc();

  //   // TODO: Check metadata

  //   // TODO: Check group
  // }

  function getInitMetadataVals(index: number, mint: PublicKey): TokenMetadata {
    const metadata: TokenMetadata = {
      name: `the100 Channel #${index}`,
      symbol: "THE100",
      uri: `https://firebasestorage.googleapis.com/v0/b/the100-f61ce.appspot.com/o/uri%2F${
        index - 1
      }.json?alt=media`,
      updateAuthority: the100Pda,
      mint,
      // TODO: Perhaps add my own "unpack" method to make this camelcase
      additionalMetadata: [["channel_num", index.toString()]],
    };
    return metadata;
  }

  async function testMint(
    index: number,
    receiver: Keypair,
    treasuryPubkey: PublicKey = treasury
  ): Promise<void> {
    const { program } = setPayer<The100>(receiver, workspace.the100);

    const preTreasuryBalance = await getConnection().getBalance(treasury);

    const mint = Keypair.generate();

    await program.methods
      .mintNft(index)
      .accounts({
        treasury: treasuryPubkey,
        mint: mint.publicKey,
        receiver: receiver.publicKey,
        colData: colData.publicKey,
      })
      .signers([mint])
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
    assert(metadataPointerState.metadataAddress.equals(mint.publicKey));

    // Check group member pointer
    const groupMemberPointerState = getGroupMemberPointerState(mintInfo);
    assert(groupMemberPointerState?.authority?.equals(the100Pda));
    assert(groupMemberPointerState?.memberAddress?.equals(mint.publicKey));

    // Check transfer hook
    const transferHook = getTransferHook(mintInfo);
    assert(transferHook?.authority?.equals(the100Pda));
    assert(transferHook?.programId.equals(PublicKey.default));

    // Check permanent delegate
    const permanentDelegate = getPermanentDelegate(mintInfo);
    assert(permanentDelegate?.delegate?.equals(the100Pda));

    // Check token balance
    const receiverAta = await getAssociatedTokenAddress(
      mint.publicKey,
      receiver.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    const receiverAtaBalance = await getConnection().getTokenAccountBalance(
      receiverAta
    );
    assert.equal(receiverAtaBalance.value.amount, 1);

    // Check mint fees
    const postTreasuryBalance = await getConnection().getBalance(treasury);
    assert.equal(
      postTreasuryBalance - preTreasuryBalance,
      getMintFeeLamports(index)
    );

    // Check emitted metadata
    const emittedMetadata = await getEmittedMetadata(
      getConnection(),
      TOKEN_2022_PROGRAM_ID,
      mint.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey
    );
    const vals = getInitMetadataVals(index, mint.publicKey);
    assert.deepStrictEqual(emittedMetadata, vals);

    // Check account metadata
    const accountMetadata = await getAccountMetadata(
      getConnection(),
      mint.publicKey
    );
    assert.deepStrictEqual(accountMetadata, vals);

    // Check mint authority is None
    assert.equal(mintInfo.mintAuthority, null);

    // Check member PDA data
    const [memberPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(MEMBER_PDA_SEED), indexToSeed(index)],
      program.programId
    );
    const memberPdaData = await program.account.memberPda.fetch(memberPda);
    assert(memberPdaData.mint.equals(mint.publicKey));
    assert(memberPdaData.colData.equals(colData.publicKey));

    // TODO: Check actual group member once supported in Anchor

    // Add if succeeded
    mints.set(index, mint);
  }

  const sharedIndex = 11;

  it("Mint NFT", async () => {
    await testMint(sharedIndex, holder);
  });

  it("Mint NFT index 11 twice fails", async () => {
    const { program } = setPayer<The100>(holder, workspace.the100);

    try {
      const mint = Keypair.generate();

      await program.methods
        .mintNft(sharedIndex)
        .accounts({
          treasury,
          mint: mint.publicKey,
          receiver: holder.publicKey,
          colData: colData.publicKey,
        })
        .signers([mint])
        .rpc();
      throw new Error("Should have thrown");
    } catch (err) {
      assert(err instanceof SendTransactionError);
    }
  });

  it("Mint NFT with wrong treasury fails", async () => {
    const { program } = setPayer<The100>(holder, workspace.the100);

    try {
      const index = 12;
      const mint = Keypair.generate();

      await program.methods
        .mintNft(index)
        .accounts({
          treasury: Keypair.generate().publicKey,
          mint: mint.publicKey,
          receiver: holder.publicKey,
          colData: colData.publicKey,
        })
        .signers([mint])
        .rpc();
      throw new Error("Should have thrown");
    } catch (err) {
      assert(
        err instanceof AnchorError &&
          err.error.errorCode.code === "ConstraintRaw"
      );
    }
  });

  it("Mint NFT index 0 fails", async () => {
    const { program } = setPayer<The100>(holder, workspace.the100);

    try {
      const index = 0;
      const mint = Keypair.generate();

      await program.methods
        .mintNft(index)
        .accounts({
          treasury,
          mint: mint.publicKey,
          receiver: holder.publicKey,
          colData: colData.publicKey,
        })
        .signers([mint])
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
    const { program } = setPayer<The100>(holder, workspace.the100);

    try {
      const index = maxSupply + 1;
      const mint = Keypair.generate();

      await program.methods
        .mintNft(index)
        .accounts({
          treasury,
          mint: mint.publicKey,
          receiver: holder.publicKey,
          colData: colData.publicKey,
        })
        .signers([mint])
        .rpc();
      throw new Error("Should have thrown");
    } catch (err) {
      assert(
        err instanceof AnchorError &&
          err.error.errorCode.code === "IndexOutOfBounds"
      );
    }
  });

  async function updateHolderField(
    index: number,
    field: string,
    val: string,
    h: Keypair = holder
  ): Promise<void> {
    const { program } = setPayer<The100>(h, workspace.the100);

    const mint = mints.get(index)!.publicKey;

    // Get prev vals
    const prevVals = await getAccountMetadata(getConnection(), mint);

    await program.methods
      .updateHolderField(field, val)
      .accounts({
        mint,
      })
      .rpc();

    const newVals = updateField(prevVals, field, val);

    // Check emitted metadata
    const emittedMetadata = await getEmittedMetadata(
      getConnection(),
      TOKEN_2022_PROGRAM_ID,
      mint,
      ANCHOR_WALLET_KEYPAIR.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, newVals);

    // Check account metadata
    const accountMetadata = await getAccountMetadata(getConnection(), mint);
    assert.deepStrictEqual(accountMetadata, newVals);
  }

  it("Updates network field", async () => {
    await updateHolderField(11, "network", randomStr(32));
  });

  it("Too long network fails", async () => {
    try {
      await updateHolderField(11, "network", randomStr(33));
      throw new Error("Should have thrown");
    } catch (err) {
      assert(
        err instanceof AnchorError &&
          err.error.errorCode.code === "HolderFieldValTooLong"
      );
    }
  });

  it("Updates genre field", async () => {
    await updateHolderField(11, "genre", randomStr(32));
  });

  it("Too long genre fails", async () => {
    try {
      await updateHolderField(11, "genre", randomStr(33));
    } catch (err) {
      assert(
        err instanceof AnchorError &&
          err.error.errorCode.code === "HolderFieldValTooLong"
      );
    }
  });

  it("Updates stream_url field", async () => {
    await updateHolderField(11, "stream_url", randomStr(200));
  });

  it("Too long stream fails", async () => {
    try {
      await updateHolderField(11, "stream_url", randomStr(201));
    } catch (err) {
      assert(
        err instanceof AnchorError &&
          err.error.errorCode.code === "HolderFieldValTooLong"
      );
    }
  });

  it("Update invalid holder field fails", async () => {
    try {
      await updateHolderField(11, "non-holder-field", "blablabla");
      throw new Error("Should have thrown");
    } catch (err) {
      assert(
        err instanceof AnchorError &&
          err.error.errorCode.code === "InvalidHolderField"
      );
    }
  });

  it("Update field with wrong holder fails", async () => {
    try {
      await updateHolderField(11, "network", "The Lab", admin);
      throw new Error("Should have thrown");
    } catch (err) {
      assert(
        err instanceof AnchorError &&
          err.error.errorCode.code === "AccountNotInitialized" // Holder token account
      );
    }
  });

  it("Mint min/reserved with wrong admin fails", async () => {
    const index = 1;

    try {
      await testMint(index, holder);
      throw new Error("Should have thrown");
    } catch (err) {
      assert(
        err instanceof AnchorError &&
          err.error.errorCode.code === "ReservedChannel"
      );
    }
  });

  it("Mint min/reserved with admin succeeds", async () => {
    const index = 2;
    await testMint(index, admin);
  });

  // Arbitrary channel test (for mint price)
  it("Mint arbitrary channel", async () => {
    const index = 44;
    await testMint(index, holder);
  });
});
