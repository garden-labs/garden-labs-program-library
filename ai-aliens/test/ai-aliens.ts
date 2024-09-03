import assert from "assert";

import {
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SendTransactionError,
  SystemProgram,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { BN, workspace } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getMetadataPointerState,
  getPermanentDelegate,
  getTransferHook,
  getGroupMemberPointerState,
} from "@solana/spl-token";
import { TokenMetadata, Field } from "@solana/spl-token-metadata";

import {
  getEmittedMetadata,
  randomStr,
  fieldToAnchorParam,
} from "../../util/js/helpers";
import { CONNECTION, setPayer } from "../../util/js/config";
import { ANCHOR_WALLET_KEYPAIR } from "../../util/js/constants";
import { ATM_PROGRAM_ID } from "../../advanced-token-metadata/js";
import {
  FIELD_AUTHORITY_PDA_SEED,
  fieldToSeedStr,
} from "../../field-authority-interface/js";
import {
  AI_ALIENS_AUTHORITY_PDA_SEED,
  NFT_MINTED_PDA_SEED,
  NICKNAME_FIELD_KEY,
  indexToSeed,
} from "../js/ai-aliens";
import { interpretTxErr, InterpretedTxErrType } from "../../util/js/tx";
import { AiAliens } from "../../target/types/ai_aliens";
import { HolderMetadataPlugin } from "../../target/types/holder_metadata_plugin";

describe("AI Aliens Program", () => {
  const mintPriceLamports = 0.1 * LAMPORTS_PER_SOL;
  const maxSupply = 1000;
  const mints: PublicKey[] = [];
  const metadatas: PublicKey[] = [];
  const admin = ANCHOR_WALLET_KEYPAIR.publicKey;
  const treasury = Keypair.generate().publicKey;
  const insufficientFundsAccount = Keypair.generate();

  const [aiAliensPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(AI_ALIENS_AUTHORITY_PDA_SEED)],
    setPayer<AiAliens>(ANCHOR_WALLET_KEYPAIR, workspace.AiAliens).program
      .programId
  );

  function getMetadataVals(index: number): TokenMetadata {
    const mint = mints[index - 1];

    const metadataVals: TokenMetadata = {
      name: `AI Alien #${index}`,
      symbol: "AIALIENS",
      uri: `https://firebasestorage.googleapis.com/v0/b/ai-aliens.appspot.com/o/uri%2F${index}.json?alt=media`,
      updateAuthority: aiAliensPda,
      mint,
      additionalMetadata: [],
    };
    return metadataVals;
  }

  it("Handle init", async () => {
    const { program } = setPayer<AiAliens>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.AiAliens
    );

    const tempTreasury = Keypair.generate().publicKey;
    const tempMaxSupply = 0;
    const tempMintPriceLamports = 0;

    await program.methods
      .init(
        admin,
        tempTreasury,
        tempMaxSupply,
        new BN(tempMintPriceLamports.toString())
      )
      .rpc();

    // Check state
    const aiAliensPdaData = await program.account.aiAliensPda.fetch(
      aiAliensPda
    );
    assert(aiAliensPdaData.admin.equals(admin));
    assert(aiAliensPdaData.treasury.equals(tempTreasury));
    assert.equal(aiAliensPdaData.maxSupply, tempMaxSupply);
    assert.equal(aiAliensPdaData.mintPriceLamports, tempMintPriceLamports);
  });

  it("Update state", async () => {
    const { program } = setPayer<AiAliens>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.AiAliens
    );

    await program.methods
      .updateState(
        admin,
        treasury,
        maxSupply,
        new BN(mintPriceLamports.toString())
      )
      .rpc();

    // Check state
    const aiAliensPdaData = await program.account.aiAliensPda.fetch(
      aiAliensPda
    );
    assert(aiAliensPdaData.treasury.equals(treasury));
    assert.equal(aiAliensPdaData.maxSupply, maxSupply);
    assert.equal(aiAliensPdaData.mintPriceLamports, mintPriceLamports);
  });

  async function createMint(
    index: number,
    payer: Keypair = ANCHOR_WALLET_KEYPAIR
  ): Promise<void> {
    const mintKeypair = Keypair.generate();
    const metadataKeypair = Keypair.generate();

    const { program } = setPayer<AiAliens>(payer, workspace.AiAliens);

    const [nftMintedPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(NFT_MINTED_PDA_SEED), indexToSeed(index)],
      setPayer<AiAliens>(payer, workspace.AiAliens).program.programId
    );

    const [fieldPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(NICKNAME_FIELD_KEY)),
        metadataKeypair.publicKey.toBuffer(),
      ],
      ATM_PROGRAM_ID
    );

    const treasuryBalanceBefore = await CONNECTION.getBalance(treasury);

    await program.methods
      .createMint(index)
      .accounts({
        treasury,
        mint: mintKeypair.publicKey,
        metadata: metadataKeypair.publicKey,
        fieldPda,
        metadataProgram: ATM_PROGRAM_ID,
      })
      .signers([mintKeypair, metadataKeypair])
      .rpc();

    const treasuryBalanceAfter = await CONNECTION.getBalance(treasury);

    // Check mint price transfer
    assert.equal(
      treasuryBalanceBefore,
      treasuryBalanceAfter - mintPriceLamports
    );

    // Check mint minted PDA
    const nftMintedPdaData = await program.account.nftMintedPda.fetch(
      nftMintedPda
    );
    assert(nftMintedPdaData.mint.equals(mintKeypair.publicKey));

    // Check metadata pointer
    const mintInfo = await getMint(
      CONNECTION,
      mintKeypair.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    const metadataPointerState = getMetadataPointerState(mintInfo);
    assert(metadataPointerState);
    assert(metadataPointerState.metadataAddress);
    assert(
      metadataPointerState.metadataAddress.equals(metadataKeypair.publicKey)
    );

    // Check permanent delegate
    const permanentDelegate = getPermanentDelegate(mintInfo);
    assert(permanentDelegate);
    assert(permanentDelegate.delegate.equals(aiAliensPda));

    // Check transfer hook
    const transferHook = getTransferHook(mintInfo);
    assert(transferHook);
    assert(transferHook.authority.equals(aiAliensPda));
    assert(transferHook.programId.equals(PublicKey.default));

    // Check group member pointer
    const groupMemberPointerState = getGroupMemberPointerState(mintInfo);
    assert(groupMemberPointerState);
    assert(groupMemberPointerState.authority);
    assert(groupMemberPointerState.authority.equals(aiAliensPda));
    assert.equal(groupMemberPointerState.memberAddress, null);

    mints.push(mintKeypair.publicKey);
    metadatas.push(metadataKeypair.publicKey);
  }

  async function createToken(mint: PublicKey): Promise<void> {
    const { program } = setPayer<AiAliens>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.AiAliens
    );

    const anchorWalletAta = await getAssociatedTokenAddress(
      mint,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    await program.methods
      .createToken()
      .accounts({
        mint,
        dest: ANCHOR_WALLET_KEYPAIR.publicKey,
      })
      .rpc();

    // Check destination ATA
    const anchorWalletAtaBalance = await CONNECTION.getTokenAccountBalance(
      anchorWalletAta
    );
    assert.equal(anchorWalletAtaBalance.value.amount, 1);

    // Check mint
    const mintInfo = await getMint(
      CONNECTION,
      mint,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    assert.equal(mintInfo.supply, BigInt(1));
  }

  it("Create mint below index 1 fails", async () => {
    assert.rejects(async () => {
      await createMint(0);
    });
  });

  it("Create mint above max supply fails", async () => {
    assert.rejects(async () => {
      await createMint(maxSupply + 1);
    });
  });

  it("Create mint at index 1 succeeds", async () => {
    await createMint(1);
  });

  it("Create mint at index 1 fails", async () => {
    assert.rejects(async () => {
      await createMint(1);
    });
  });

  it("Create mint at index 2 succeeds", async () => {
    await createMint(2);
  });

  it("Create mint at index 10 succeeds", async () => {
    await createMint(10);
  });

  it("Create mint at index 1000 succeeds", async () => {
    await createMint(1000);
  });

  it("Create insufficent funds account", async () => {
    const ix = SystemProgram.transfer({
      fromPubkey: ANCHOR_WALLET_KEYPAIR.publicKey,
      toPubkey: insufficientFundsAccount.publicKey,
      lamports: mintPriceLamports, // With fees and rent this will be slightly under
    });
    const tx = new Transaction().add(ix);
    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);
  });

  it("Create mint fails with insufficient funds", async () => {
    try {
      await createMint(3, insufficientFundsAccount);
      throw new Error("Expected error to be thrown");
    } catch (err) {
      const interpretedTxErr = interpretTxErr(err);
      assert.equal(
        interpretedTxErr.type,
        InterpretedTxErrType.InsufficientFunds
      );
    }
  });

  it("Create mint fails with zero funds", async () => {
    const zeroFundsAccount = Keypair.generate();
    try {
      await createMint(4, zeroFundsAccount);
      throw new Error("Expected error to be thrown");
    } catch (err) {
      const interpretedTxErr = interpretTxErr(err);
      assert.equal(
        interpretedTxErr.type,
        InterpretedTxErrType.InsufficientFunds
      );
    }
  });

  it("Create token succeeds", async () => {
    const proms = mints.map(createToken);
    await Promise.all(proms);
  });

  async function updateNickname(index: number, val: string): Promise<void> {
    const { program } = setPayer<HolderMetadataPlugin>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.HolderMetadataPlugin
    );

    const field = NICKNAME_FIELD_KEY;
    const param = fieldToAnchorParam(field);

    const mint = mints[index - 1];
    const metadata = metadatas[index - 1];

    const [fieldPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(field)),
        metadata.toBuffer(),
      ],
      ATM_PROGRAM_ID
    );

    await program.methods
      .updateHolderField(param, val)
      .accounts({
        mint,
        metadata,
        fieldPda,
        fieldAuthorityProgram: ATM_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    // Check metadata
    const metadataVals = getMetadataVals(index);
    metadataVals.additionalMetadata.push([field, val]);
    const emittedMetadata = await getEmittedMetadata(ATM_PROGRAM_ID, metadata);
    assert.deepStrictEqual(emittedMetadata, metadataVals);
  }

  it("Update nickname", async () => {
    await updateNickname(1, randomStr(30));
  });

  it("Update nickname fails with too long nickname", async () => {
    assert(async () => {
      try {
        await updateNickname(1, randomStr(31));
        throw new Error("Expected error to be thrown");
      } catch (e) {
        assert(e instanceof SendTransactionError);
      }
    });
  });

  async function updateUriWithAdmin(index: number, uri: string): Promise<void> {
    const { program } = setPayer<AiAliens>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.AiAliens
    );

    const fieldParam = fieldToAnchorParam(Field.Uri);
    const metadata = metadatas[index - 1];

    await program.methods
      .updateField(fieldParam, uri)
      .accounts({
        metadata,
        metadataProgram: ATM_PROGRAM_ID,
      })
      .rpc();

    // Check emmitted metadata
    const metadataVals = getMetadataVals(index);
    metadataVals.uri = uri;
    const emittedMetadata = await getEmittedMetadata(ATM_PROGRAM_ID, metadata);
    assert.deepStrictEqual(emittedMetadata, metadataVals);
  }

  it("Update field with admin", async () => {
    const index = 2;
    await updateUriWithAdmin(index, "test-uri-update");

    // Clean this up because we use this value live on devnet
    const metadataVals = getMetadataVals(index);
    await updateUriWithAdmin(index, metadataVals.uri);
  });

  it("Nullify mint authority", async () => {
    const { program } = setPayer<AiAliens>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.AiAliens
    );

    const index = 1;
    const mint = mints[index - 1];

    await program.methods
      .nullifyMintAuthority(index)
      .accounts({
        mint,
      })
      .rpc();

    // Check mint authority
    const mintInfo = await getMint(
      CONNECTION,
      mint,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    assert.equal(mintInfo.mintAuthority, null);
  });
});
