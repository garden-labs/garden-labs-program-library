import assert from "assert";

import {
  Keypair,
  SendTransactionError,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TokenMetadata,
  Field,
  createUpdateFieldInstruction,
} from "@solana/spl-token-metadata";

import { ANCHOR_WALLET_KEYPAIR, ATM_PROGRAM_ID } from "../../util/js/constants";
import {
  getEmittedMetadata,
  setupMintMetadataToken,
  getAccountMetadata,
  randomStr,
  updateField,
} from "../../util/js/helpers";
import { CONNECTION } from "../../util/js/config";
import {
  createInitializeFieldAuthoritiesIx,
  FieldAuthority,
  FieldAuthorities,
  getFieldAuthorities,
  createUpdateFieldWithFieldAuthorityV2Ix,
} from "../../field-authority-interface/js";

describe("Advanced Token Metadata Program V2", () => {
  const mintKeypair = Keypair.generate();
  const metadataKeypair = Keypair.generate();

  let metadataVals: TokenMetadata = {
    name: randomStr(10),
    symbol: randomStr(10),
    uri: randomStr(10),
    updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
    mint: mintKeypair.publicKey,
    additionalMetadata: [],
  };
  const additionalFieldKey = randomStr(10);

  const fieldAuthorityKpOne = Keypair.generate();
  const fieldAuthorityOne: FieldAuthority = {
    field: Field.Name,
    authority: fieldAuthorityKpOne.publicKey,
  };
  const fieldAuthorityTwo: FieldAuthority = {
    field: additionalFieldKey,
    authority: ANCHOR_WALLET_KEYPAIR.publicKey,
  };
  const fieldAuthorities: FieldAuthorities = {
    authorities: [fieldAuthorityOne, fieldAuthorityTwo],
  };

  const fieldAuthorityKpTwo = Keypair.generate();

  it("Setup mint, metadata, and token", async () => {
    await setupMintMetadataToken(
      mintKeypair,
      metadataKeypair,
      metadataVals,
      additionalFieldKey,
      fieldAuthorities
    );
  });

  it("Update field with update authority (regular)", async () => {
    const val = randomStr(20);

    const ix = createUpdateFieldInstruction({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      field: Field.Name,
      value: val,
    });

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

    const vals = updateField(metadataVals, Field.Name, val);

    // Check emmitted metadata
    const emittedMetadata = await getEmittedMetadata(
      ATM_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, vals);

    // Check account metadata
    const accountMetadata = await getAccountMetadata(metadataKeypair.publicKey);
    assert.deepStrictEqual(accountMetadata, vals);

    // Update if succeeded
    metadataVals = vals;
  });

  it("Initialize field authorities", async () => {
    const ix = createInitializeFieldAuthoritiesIx({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      fieldAuthorities,
    });

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

    // Check emmitted metadata
    const emittedMetadata = await getEmittedMetadata(
      ATM_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, metadataVals);

    // Check account metadata
    const accountMetadata = await getAccountMetadata(metadataKeypair.publicKey);
    assert.deepStrictEqual(accountMetadata, metadataVals);

    // Check field authorities
    const accountFieldAuthorities = await getFieldAuthorities(
      CONNECTION,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(accountFieldAuthorities, fieldAuthorities);
  });

  async function updateFieldWithFieldAuthorityTest(
    field: Field | string,
    val: string,
    fa: Keypair = fieldAuthorityKpOne,
    signers: Keypair[] = [ANCHOR_WALLET_KEYPAIR, fa]
  ): Promise<void> {
    const ix = createUpdateFieldWithFieldAuthorityV2Ix({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      fieldAuthority: fa.publicKey,
      field,
      value: val,
    });

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, signers);

    const vals = updateField(metadataVals, field, val);

    // Check emmitted metadata
    const emittedMetadata = await getEmittedMetadata(
      ATM_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, vals);

    // Check account metadata
    const accountMetadata = await getAccountMetadata(metadataKeypair.publicKey);
    assert.deepStrictEqual(accountMetadata, vals);

    // Update if succeeded
    metadataVals = vals;
  }

  it("Update field with incorrect field authority fails (v2)", async () => {
    const val = randomStr(10);

    try {
      await updateFieldWithFieldAuthorityTest(
        Field.Name,
        val,
        ANCHOR_WALLET_KEYPAIR
      );
      throw new Error("Should have thrown");
    } catch (err) {
      // Better error parsing is coming with the new @solana/web3.js
      // https://github.com/solana-labs/solana-web3.js/issues/2019
      assert(err instanceof SendTransactionError);
    }
  });

  it("Update field with correct field authority (v2)", async () => {
    const val = randomStr(10);
    await updateFieldWithFieldAuthorityTest(Field.Name, val);
  });

  it("Update additional field with correct field authority (v2)", async () => {
    const val = randomStr(10);
    await updateFieldWithFieldAuthorityTest(
      additionalFieldKey,
      val,
      ANCHOR_WALLET_KEYPAIR
    );
  });

  it("Update field with non-signer fails", async () => {
    const val = randomStr(10);
    try {
      await updateFieldWithFieldAuthorityTest(Field.Name, val, undefined, [
        ANCHOR_WALLET_KEYPAIR,
      ]);
      throw new Error("Should have thrown");
    } catch (err) {
      // Better error parsing is coming with the new @solana/web3.js
      // https://github.com/solana-labs/solana-web3.js/issues/2019

      // SendTransactionError doens't work here, probably caught in JS
      if (
        !(
          err instanceof Error &&
          err.message.includes("Signature verification failed.")
        )
      ) {
        throw err;
      }
    }
  });

  // TODO: Add field authority

  // TODO: Test with new field authority

  // TODO: Remove field authority

  // TODO: Test removed field authority
});
