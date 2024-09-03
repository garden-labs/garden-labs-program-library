import assert from "assert";

import {
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  SendTransactionError,
} from "@solana/web3.js";
import {
  TokenMetadata,
  Field,
  createUpdateFieldInstruction,
} from "@solana/spl-token-metadata";
import * as borsh from "@coral-xyz/borsh";

import { ANCHOR_WALLET_KEYPAIR } from "../../util/js/constants";
import { ATM_PROGRAM_ID } from "../js";
import {
  getEmittedMetadata,
  randomStr,
  setupMintMetadataToken,
  updateField,
} from "../../util/js/helpers";
import { CONNECTION } from "../../util/js/config";
import {
  createAddFieldAuthorityIx,
  fieldToSeedStr,
  createUpdateFieldWithFieldAuthorityIx,
  FIELD_AUTHORITY_PDA_SEED,
  createRemoveFieldAuthorityIx,
} from "../../field-authority-interface/js";

describe("Advanced Token Metadata Program", () => {
  const mintKeypair = Keypair.generate();
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
    await setupMintMetadataToken(mintKeypair, metadataKeypair, metadataVals);

    // Check emmitted metadata
    const emittedMetadata = await getEmittedMetadata(
      ATM_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, metadataVals);
  });

  async function addFieldAuthorityTest(
    field: Field | string,
    updateAuthority: Keypair = ANCHOR_WALLET_KEYPAIR
  ): Promise<void> {
    const ix = createAddFieldAuthorityIx(
      ANCHOR_WALLET_KEYPAIR.publicKey,
      metadataKeypair.publicKey,
      updateAuthority.publicKey,
      fieldAuthority.publicKey,
      field,
      ATM_PROGRAM_ID
    );

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [
      ANCHOR_WALLET_KEYPAIR,
      updateAuthority,
    ]);

    // Check created PDA
    const [fieldPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(field)),
        metadataKeypair.publicKey.toBuffer(),
      ],
      ATM_PROGRAM_ID
    );
    const fieldPdaInfo = await CONNECTION.getAccountInfo(fieldPda);
    assert(fieldPdaInfo);
    const fieldAuthoritySchema = borsh.struct([borsh.publicKey("authority")]);
    const { authority } = fieldAuthoritySchema.decode(fieldPdaInfo.data);
    assert(fieldAuthority.publicKey.equals(authority));
  }

  it("Update field with update authority (regular)", async () => {
    const val = randomStr(10);

    const ix = createUpdateFieldInstruction({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      field: Field.Name,
      value: val,
    });

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

    // Check emmitted metadata
    const vals = updateField(metadataVals, Field.Name, val);
    const emittedMetadata = await getEmittedMetadata(
      ATM_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, vals);

    // Update if succeeded
    metadataVals = vals;
  });

  it("Add field authority", async () => {
    await addFieldAuthorityTest(Field.Name);
  });

  async function updateFieldWithFieldAuthorityTest(
    field: Field | string,
    val: string,
    fa: Keypair = fieldAuthority
  ): Promise<void> {
    const ix = createUpdateFieldWithFieldAuthorityIx(
      metadataKeypair.publicKey,
      fa.publicKey,
      field,
      val,
      ATM_PROGRAM_ID
    );

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [
      ANCHOR_WALLET_KEYPAIR,
      fa,
    ]);

    const vals = updateField(metadataVals, field, val);

    // Check emmitted metadata
    const emittedMetadata = await getEmittedMetadata(
      ATM_PROGRAM_ID,
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
      ATM_PROGRAM_ID
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
      ATM_PROGRAM_ID
    );
    const pdaInfo = await CONNECTION.getAccountInfo(pda);
    assert.equal(pdaInfo, undefined);
  });

  it("(Re-initialize) Add field authority", async () => {
    await addFieldAuthorityTest(Field.Name);
  });

  it("Add field authority fails with existing field authority", async () => {
    assert(async () => {
      try {
        await addFieldAuthorityTest(Field.Name);
        throw new Error("Should have thrown");
      } catch (e) {
        assert(e instanceof SendTransactionError);
      }
    });
  });

  it("Add field authority with additional field", async () => {
    await addFieldAuthorityTest(additionalFieldKey);
  });

  it("Add field authority with wrong update authority fails", async () => {
    assert(async () => {
      try {
        await addFieldAuthorityTest(Field.Symbol, Keypair.generate());
        throw new Error("Should have thrown");
      } catch (e) {
        assert(e instanceof SendTransactionError);
      }
    });
  });

  it("Update field fails with wrong field authority", async () => {
    assert(async () => {
      try {
        await updateFieldWithFieldAuthorityTest(
          Field.Symbol,
          "NEWSYMBOL",
          Keypair.generate()
        );
        throw new Error("Should have thrown");
      } catch (e) {
        assert(e instanceof SendTransactionError);
      }
    });
  });
});
