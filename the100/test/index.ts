import assert from "assert";

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

import { setPayer, getConnection } from "../../util/js/config";
import { ANCHOR_WALLET_KEYPAIR } from "../../util/js/constants";
import { The100 } from "../../target/types/the_100";
import { getAccountMetadata, getEmittedMetadata } from "../../common/js";
import {
  THE100_PDA_SEED,
  TREASURY_PUBLIC_KEY,
  MEMBER_PDA_SEED,
  indexToSeed,
} from "../js";
import { HolderMetadataPlugin } from "../../target/types/holder_metadata_plugin";
import { HOLDER_METADATA_PDA_SEED } from "../../holder-metadata-plugin/js";

describe("the100", () => {
  const maxSupply = 100;
  const mintFee = 2 * LAMPORTS_PER_SOL;

  const [the100Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(THE100_PDA_SEED)],
    // eslint-disable-next-line @typescript-eslint/dot-notation
    new Program<The100>(workspace.the100.idl).programId
  );

  const holder = Keypair.generate();

  const mints: Keypair[] = [];

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
      name: `the100 Channel #${index}`,
      symbol: "THE100",
      uri: `TODO/${index}.json`,
      updateAuthority: the100Pda,
      mint,
      additionalMetadata: [],
    };
    return metadata;
  }

  it("Mint NFT", async () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const { program } = setPayer<The100>(holder, workspace.the100);

    const index = 1;

    const mint = Keypair.generate();
    mints.push(mint);

    const preTreasuryBalance = await getConnection().getBalance(
      TREASURY_PUBLIC_KEY
    );

    await program.methods
      .mintNft(index)
      .accounts({
        treasury: TREASURY_PUBLIC_KEY,
        mint: mint.publicKey,
        receiver: holder.publicKey,
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

    // Check mint fees
    const postTreasuryBalance = await getConnection().getBalance(
      TREASURY_PUBLIC_KEY
    );
    assert.equal(postTreasuryBalance - preTreasuryBalance, mintFee);

    // Check emitted metadata
    const emittedMetadata = await getEmittedMetadata(
      getConnection(),
      TOKEN_2022_PROGRAM_ID,
      mint.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey
    );
    const vals = getInitMetadataVals(1, mint.publicKey);
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

    // TODO: Check actual member once group is enabled in token-2022
  });

  it("Mint NFT index 1 twice fails", async () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const { program } = setPayer<The100>(holder, workspace.the100);

    try {
      const index = 1;
      const mint = Keypair.generate();

      await program.methods
        .mintNft(index)
        .accounts({
          treasury: TREASURY_PUBLIC_KEY,
          mint: mint.publicKey,
          receiver: holder.publicKey,
        })
        .signers([mint])
        .rpc();
      throw new Error("Should have thrown");
    } catch (err) {
      assert(err instanceof SendTransactionError);
    }
  });

  it("Mint NFT index 0 fails", async () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const { program } = setPayer<The100>(holder, workspace.the100);

    try {
      const index = 0;
      const mint = Keypair.generate();

      await program.methods
        .mintNft(index)
        .accounts({
          treasury: TREASURY_PUBLIC_KEY,
          mint: mint.publicKey,
          receiver: holder.publicKey,
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
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const { program } = setPayer<The100>(holder, workspace.the100);

    try {
      const index = maxSupply + 1;
      const mint = Keypair.generate();

      await program.methods
        .mintNft(index)
        .accounts({
          treasury: TREASURY_PUBLIC_KEY,
          mint: mint.publicKey,
          receiver: holder.publicKey,
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

  // it("Update holder field with holder", async () => {
  //   const { program } = setPayer<HolderMetadataPlugin>(
  //     holder,
  //     workspace.HolderMetadataPlugin
  //   );

  //   const index = 1;
  //   const mint = mints[index - 1];
  //   const metadata = metadatas[index - 1];

  //   const param = fieldToAnchorParam(holderField.field);
  //   const newHolderFieldVal = randomStr(10);

  //   await program.methods
  //     .updateHolderFieldV2(param, newHolderFieldVal)
  //     .accounts({
  //       mint: mint.publicKey,
  //       metadata: metadata.publicKey,
  //       fieldAuthorityProgram: ATM_PROGRAM_ID,
  //       tokenProgram: TOKEN_2022_PROGRAM_ID,
  //     })
  //     .rpc();

  //   const vals = getInitMetadataVals(index, mint.publicKey);
  //   vals.additionalMetadata.push([
  //     holderField.field as string,
  //     newHolderFieldVal,
  //   ]);
  //   const emittedMetadata = await getEmittedMetadata(
  //     getConnection(),
  //     ATM_PROGRAM_ID,
  //     metadata.publicKey,
  //     ANCHOR_WALLET_KEYPAIR.publicKey
  //   );
  //   assert.deepStrictEqual(emittedMetadata, vals);
  // });

  // TODO: Test wrong metadata template values, specifically the wrong update authority
});
