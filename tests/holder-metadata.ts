import assert from "assert";

import {
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { TokenMetadata, Field } from "@solana/spl-token-metadata";
import * as borsh from "@coral-xyz/borsh";

import { ANCHOR_WALLET_KEYPAIR, EXAMPLE_PROGRAM_ID } from "../util/constants";
import {
  HOLDER_METADATA_PDA_SEED,
  toAnchorParam,
} from "../util/holder-metadata";
import {
  createAddFieldAuthorityIx,
  FIELD_AUTHORITY_PDA_SEED,
  fieldToSeedStr,
} from "../util/field-authority-interface";
import {
  getEmittedMetadata,
  randomStr,
  setupMintMetadataToken,
} from "../util/helpers";
import { CONNECTION, setHolderMetadataPayer } from "../util/config";

describe("Holder Metadata Program", () => {
  const mints: PublicKey[] = [];
  const metadatas: PublicKey[] = [];
  const tokens: PublicKey[] = [];
  const testHolder = Keypair.generate();

  const [holderMetadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(HOLDER_METADATA_PDA_SEED)],
    setHolderMetadataPayer(ANCHOR_WALLET_KEYPAIR).program.programId
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

  const additionalFieldKey = "additional field key";

  it("Setup mint, metadata, and token", async () => {
    const mintKeypair = Keypair.generate();
    const metadataKeypair = Keypair.generate();
    const metadataVals = getMetadataVals(mintKeypair.publicKey);

    const token = await setupMintMetadataToken(
      mintKeypair,
      metadataKeypair,
      metadataVals,
      additionalFieldKey
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
      EXAMPLE_PROGRAM_ID
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
      EXAMPLE_PROGRAM_ID
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
    payer: Keypair
  ): Promise<void> {
    const { program } = setHolderMetadataPayer(payer);

    const val = randomStr(10);

    const param = toAnchorParam(Field.Name);

    const [fieldPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(Field.Name)),
        metadata.toBuffer(),
      ],
      EXAMPLE_PROGRAM_ID
    );

    await program.methods
      .updateHolderField(param, val)
      .accounts({
        mint,
        metadata,
        holderTokenAccount: token,
        holderMetadataPda,
        fieldPda,
        fieldAuthorityProgram: EXAMPLE_PROGRAM_ID,
      })
      .rpc();

    // Check emmitted metadata
    const metadataVals = getMetadataVals(mint);
    metadataVals.name = val;
    const emittedMetadata = await getEmittedMetadata(
      EXAMPLE_PROGRAM_ID,
      metadata
    );
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
      metadataVals,
      additionalFieldKey
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
