import assert from "assert";

import {
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { TokenMetadata, Field } from "@solana/spl-token-metadata";
import * as borsh from "@coral-xyz/borsh";

import { ANCHOR_WALLET_KEYPAIR, EXAMPLE_PROGRAM_ID } from "../util/constants";
import {
  getEmittedMetadata,
  randomStr,
  setupMintMetadataToken,
} from "../util/helpers";
import { CONNECTION } from "../util/config";
import {
  createAddFieldAuthorityIx,
  fieldToSeedStr,
  createUpdateFieldWithFieldAuthorityIx,
  FIELD_AUTHORITY_PDA_SEED,
  createRemoveFieldAuthorityIx,
} from "../util/field-authority-interface";

describe("Token Metadata Example Program", () => {
  const mintKeypair = Keypair.generate();
  let tokenAddress: PublicKey; // Initialized in setup
  const metadataKeypair = Keypair.generate();

  let metadataVals: TokenMetadata = {
    name: "My test token",
    symbol: "TEST",
    uri: "http://test.test",
    updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
    mint: mintKeypair.publicKey,
    additionalMetadata: [],
  };
  const additionalFieldKey = "additional field key";

  const fieldAuthority = Keypair.generate();

  it("Setup mint, metadata, and token", async () => {
    tokenAddress = await setupMintMetadataToken(
      mintKeypair,
      metadataKeypair,
      metadataVals,
      additionalFieldKey
    );

    // Check emmitted metadata
    const emittedMetadata = await getEmittedMetadata(
      EXAMPLE_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, metadataVals);
  });

  async function addFieldAuthorityTest(field: Field | string): Promise<void> {
    const ix = createAddFieldAuthorityIx(
      ANCHOR_WALLET_KEYPAIR.publicKey,
      metadataKeypair.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      fieldAuthority.publicKey,
      field,
      EXAMPLE_PROGRAM_ID
    );

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

    // Check created PDA
    const [fieldPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(field)),
        metadataKeypair.publicKey.toBuffer(),
      ],
      EXAMPLE_PROGRAM_ID
    );
    const fieldPdaInfo = await CONNECTION.getAccountInfo(fieldPda);
    assert(fieldPdaInfo);
    const fieldAuthoritySchema = borsh.struct([borsh.publicKey("authority")]);
    const { authority } = fieldAuthoritySchema.decode(fieldPdaInfo.data);
    assert(fieldAuthority.publicKey.equals(authority));
  }

  it("Add field authority", async () => {
    await addFieldAuthorityTest(Field.Name);
  });

  async function updateFieldWithFieldAuthorityTest(
    field: Field | string,
    val: string
  ): Promise<void> {
    const ix = createUpdateFieldWithFieldAuthorityIx(
      metadataKeypair.publicKey,
      fieldAuthority.publicKey,
      field,
      val,
      EXAMPLE_PROGRAM_ID
    );

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [
      ANCHOR_WALLET_KEYPAIR,
      fieldAuthority,
    ]);

    // Check emmitted metadata
    const vals: TokenMetadata = { ...metadataVals, name: val };
    const emittedMetadata = await getEmittedMetadata(
      EXAMPLE_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, vals);

    // Update if succeeded
    metadataVals = vals;
  }

  it("Update field with field authority", async () => {
    await updateFieldWithFieldAuthorityTest(Field.Name, randomStr(10));
  });

  it("Remove field authority", async () => {
    const ix = createRemoveFieldAuthorityIx(
      metadataKeypair.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      Field.Name,
      EXAMPLE_PROGRAM_ID
    );

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

    // Check deleted PDA
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(Field.Name)),
        metadataKeypair.publicKey.toBuffer(),
      ],
      EXAMPLE_PROGRAM_ID
    );
    const pdaInfo = await CONNECTION.getAccountInfo(pda);
    assert.equal(pdaInfo, undefined);
  });

  it("(Re-initialize) Add field authority", async () => {
    await addFieldAuthorityTest(Field.Name);
  });

  it("Add field authority fails with existing field authority", async () => {
    assert.rejects(async () => {
      await addFieldAuthorityTest(Field.Name);
    });
  });

  it("Add field authority with additional field", async () => {
    await addFieldAuthorityTest("additional field key");
  });

  // TODO: Test with wrong authority
});
