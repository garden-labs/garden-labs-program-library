import assert from "assert";

import {
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenMetadata, Field } from "@solana/spl-token-metadata";
import * as borsh from "@coral-xyz/borsh";
import { workspace } from "@coral-xyz/anchor";

import { ANCHOR_WALLET_KEYPAIR } from "../../util/js/constants";
import { ATM_PROGRAM_ID } from "../../advanced-token-metadata/js";
import { HOLDER_METADATA_PDA_SEED } from "../js";
import {
  createAddFieldAuthorityIx,
  FIELD_AUTHORITY_PDA_SEED,
  fieldToSeedStr,
} from "../../field-authority-interface/js";
import {
  getEmittedMetadata,
  randomStr,
  setupMintMetadataToken,
  fieldToAnchorParam,
} from "../../util/js/helpers";
import { CONNECTION, setPayer } from "../../util/js/config";
import { HolderMetadataPlugin } from "../../target/types/holder_metadata_plugin";

describe("Holder Metadata Plugin", () => {
  const mints: PublicKey[] = [];
  const metadatas: PublicKey[] = [];
  const tokens: PublicKey[] = [];
  const testHolder = Keypair.generate();

  const [holderMetadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(HOLDER_METADATA_PDA_SEED)],
    setPayer<HolderMetadataPlugin>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.HolderMetadataPlugin
    ).program.programId
  );

  function getMetadataVals(mint: PublicKey): TokenMetadata {
    const metadataVals: TokenMetadata = {
      name: "My test token",
      symbol: "TEST",
      uri: "http://test.test",
      updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      mint,
      additionalMetadata: [],
    };
    return metadataVals;
  }

  it("Setup mint, metadata, and token", async () => {
    const mintKeypair = Keypair.generate();
    const metadataKeypair = Keypair.generate();
    const metadataVals = getMetadataVals(mintKeypair.publicKey);

    const token = await setupMintMetadataToken(
      mintKeypair,
      metadataKeypair,
      metadataVals
    );

    mints.push(mintKeypair.publicKey);
    metadatas.push(metadataKeypair.publicKey);
    tokens.push(token);
  });

  it("Add name as holder field", async () => {
    const ix = createAddFieldAuthorityIx(
      ANCHOR_WALLET_KEYPAIR.publicKey,
      metadatas[0],
      ANCHOR_WALLET_KEYPAIR.publicKey,
      holderMetadataPda,
      Field.Name,
      ATM_PROGRAM_ID
    );

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

    // Check created PDA
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(Field.Name)),
        metadatas[0].toBuffer(),
      ],
      ATM_PROGRAM_ID
    );
    const pdaInfo = await CONNECTION.getAccountInfo(pda);
    assert(pdaInfo);
    const fieldAuthoritySchema = borsh.struct([borsh.publicKey("authority")]);
    const { authority } = fieldAuthoritySchema.decode(pdaInfo.data);
    assert(holderMetadataPda.equals(authority));
  });

  async function updateNameWithHolder(
    mint: PublicKey,
    metadata: PublicKey,
    token: PublicKey,
    payer: Keypair,
    val: string = randomStr(10)
  ): Promise<void> {
    const { program } = setPayer<HolderMetadataPlugin>(
      payer,
      workspace.HolderMetadataPlugin
    );

    const param = fieldToAnchorParam(Field.Name);

    const [fieldPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(Field.Name)),
        metadata.toBuffer(),
      ],
      ATM_PROGRAM_ID
    );

    await program.methods
      .updateHolderField(param, val)
      // TODO: Fix holderTokenAccount error when using `accounts()`
      .accountsPartial({
        mint,
        metadata,
        // TODO: Figure out what is needed to remove this
        // Perhaps an Anchor bug
        holderTokenAccount: token,
        fieldPda,
        fieldAuthorityProgram: ATM_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Check emmitted metadata
    const metadataVals = getMetadataVals(mint);
    metadataVals.name = val;
    const emittedMetadata = await getEmittedMetadata(ATM_PROGRAM_ID, metadata);
    assert.deepStrictEqual(emittedMetadata, metadataVals);
  }

  it("Update name with holder metadata succeeds", async () => {
    const index = 0;
    await updateNameWithHolder(
      mints[index],
      metadatas[index],
      tokens[index],
      ANCHOR_WALLET_KEYPAIR
    );
  });

  it("Update longer name with holder metadata succeeds", async () => {
    const index = 0;
    await updateNameWithHolder(
      mints[index],
      metadatas[index],
      tokens[index],
      ANCHOR_WALLET_KEYPAIR,
      randomStr(100)
    );
  });

  it("Setup holder for fail test", async () => {
    const ix = SystemProgram.transfer({
      fromPubkey: ANCHOR_WALLET_KEYPAIR.publicKey,
      toPubkey: testHolder.publicKey,
      lamports: 5 * LAMPORTS_PER_SOL,
    });
    const tx = new Transaction().add(ix);
    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

    // Check balance
    const balance = await CONNECTION.getBalance(testHolder.publicKey);
    assert(balance === 5 * LAMPORTS_PER_SOL);
  });

  it("Update name with non-holder fails", async () => {
    const index = 0;
    assert.rejects(async () => {
      await updateNameWithHolder(
        mints[index],
        metadatas[index],
        tokens[index],
        testHolder
      );
    });
  });

  it("Setup token for fail test", async () => {
    const mintKeypair = Keypair.generate();
    const metadataKeypair = Keypair.generate();
    const metadataVals = getMetadataVals(mintKeypair.publicKey);

    const token = await setupMintMetadataToken(
      mintKeypair,
      metadataKeypair,
      metadataVals
    );

    mints.push(mintKeypair.publicKey);
    metadatas.push(metadataKeypair.publicKey);
    tokens.push(token);
  });

  it("Update name with wrong token fails", async () => {
    assert.rejects(async () => {
      await updateNameWithHolder(
        mints[0],
        metadatas[0],
        tokens[1],
        ANCHOR_WALLET_KEYPAIR
      );
    });
  });
});
