import assert from "assert";

import {
  Keypair,
  SendTransactionError,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
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
  getEnsureRentMinTx,
  getSpaceRent,
} from "../../util/js/helpers";
import { CONNECTION } from "../../util/js/config";
import {
  createInitializeFieldAuthoritiesIx,
  FieldAuthority,
  FieldAuthorities,
  getFieldAuthorities,
  createUpdateFieldWithFieldAuthorityV2Ix,
  createAddFieldAuthorityV2Ix,
  createRemoveFieldAuthorityV2Ix,
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
    // TODO: Create realloc instruction to metadata program so we don't need to
    // preallocate field authority space
    await setupMintMetadataToken(
      mintKeypair,
      metadataKeypair,
      metadataVals,
      fieldAuthorities
    );
  });

  it("Add some lamports to field authority one", async () => {
    const ix = SystemProgram.transfer({
      fromPubkey: ANCHOR_WALLET_KEYPAIR.publicKey,
      toPubkey: fieldAuthorityKpOne.publicKey,
      lamports: 0.2 * LAMPORTS_PER_SOL,
    });
    await sendAndConfirmTransaction(CONNECTION, new Transaction().add(ix), [
      ANCHOR_WALLET_KEYPAIR,
    ]);
  });

  it("Update field with update authority (regular)", async () => {
    const key = Field.Name;
    const val = randomStr(20);
    const vals = updateField(metadataVals, key, val);

    const updateIx = createUpdateFieldInstruction({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      field: key,
      value: val,
    });
    const tx = new Transaction().add(updateIx);

    const { rent } = await getSpaceRent(CONNECTION, vals, fieldAuthorities);
    const rentIx = await getEnsureRentMinTx(
      CONNECTION,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      metadataKeypair.publicKey,
      rent
    );
    if (rentIx) {
      tx.add(rentIx);
    }

    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

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
    // Init ix
    const ix = createInitializeFieldAuthoritiesIx({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      fieldAuthorities,
    });
    const tx = new Transaction().add(ix);

    // Ensure rent minimum
    const { rent } = await getSpaceRent(
      CONNECTION,
      metadataVals,
      fieldAuthorities
    );
    const rentIx = await getEnsureRentMinTx(
      CONNECTION,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      metadataKeypair.publicKey,
      rent
    );
    if (rentIx) {
      tx.add(rentIx);
    }

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
    fa: PublicKey = fieldAuthorityKpOne.publicKey,
    signers: Keypair[] = [fieldAuthorityKpOne]
  ): Promise<void> {
    const vals = updateField(metadataVals, field, val);

    const ix = createUpdateFieldWithFieldAuthorityV2Ix({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      fieldAuthority: fa,
      field,
      value: val,
    });
    const tx = new Transaction().add(ix);

    const { rent } = await getSpaceRent(CONNECTION, vals, fieldAuthorities);
    const rentIx = await getEnsureRentMinTx(
      CONNECTION,
      signers[0].publicKey,
      metadataKeypair.publicKey,
      rent
    );
    if (rentIx) {
      tx.add(rentIx);
    }

    await sendAndConfirmTransaction(CONNECTION, tx, signers);

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
        ANCHOR_WALLET_KEYPAIR.publicKey,
        [ANCHOR_WALLET_KEYPAIR]
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
      ANCHOR_WALLET_KEYPAIR.publicKey,
      [ANCHOR_WALLET_KEYPAIR]
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

  async function addFieldAuthorityTest(
    fieldAuthority: FieldAuthority,
    signer: Keypair = ANCHOR_WALLET_KEYPAIR
  ): Promise<void> {
    // Add field authority ix
    const addFieldAuthIx = createAddFieldAuthorityV2Ix({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      fieldAuthority,
      idempotent: true,
    });
    const tx = new Transaction().add(addFieldAuthIx);

    // Add rent ix
    const newFieldAuthorities: FieldAuthorities = {
      authorities: [...fieldAuthorities.authorities, fieldAuthority],
    };
    const { rent } = await getSpaceRent(
      CONNECTION,
      metadataVals,
      newFieldAuthorities
    );
    const minRentIx = await getEnsureRentMinTx(
      CONNECTION,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      metadataKeypair.publicKey,
      rent
    );
    if (minRentIx) {
      tx.add(minRentIx);
    }

    await sendAndConfirmTransaction(CONNECTION, tx, [signer]);

    // Check field authorities
    const accountFieldAuthorities = await getFieldAuthorities(
      CONNECTION,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(accountFieldAuthorities, newFieldAuthorities);

    // Update if succeeded
    fieldAuthorities.authorities.push(fieldAuthority);
  }

  it("Add field authority v2 fails with non update authority", async () => {
    const fieldAuthority: FieldAuthority = {
      field: Field.Name,
      authority: fieldAuthorityKpTwo.publicKey,
    };
    try {
      await addFieldAuthorityTest(fieldAuthority, fieldAuthorityKpOne);
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

  it("Add field authority v2", async () => {
    const fieldAuthority: FieldAuthority = {
      field: Field.Name,
      authority: fieldAuthorityKpTwo.publicKey,
    };
    await addFieldAuthorityTest(fieldAuthority);
  });

  it("Update field with new field authority", async () => {
    const val = randomStr(10);
    await updateFieldWithFieldAuthorityTest(
      Field.Name,
      val,
      fieldAuthorityKpTwo.publicKey,
      [ANCHOR_WALLET_KEYPAIR, fieldAuthorityKpTwo]
    );
  });

  it("Update field with old field authority", async () => {
    const val = randomStr(10);
    await updateFieldWithFieldAuthorityTest(Field.Name, val);
  });

  async function removeFieldAuthorityTest(
    fieldAuthority: FieldAuthority,
    signer: Keypair = ANCHOR_WALLET_KEYPAIR
  ): Promise<void> {
    // Add field authority ix
    const removeFieldAuthIx = createRemoveFieldAuthorityV2Ix({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      fieldAuthority,
      idempotent: true,
    });
    const tx = new Transaction().add(removeFieldAuthIx);

    await sendAndConfirmTransaction(CONNECTION, tx, [signer]);

    // Check field authorities
    const newAuthorities = fieldAuthorities.authorities.filter(
      (fa) =>
        fa.field !== fieldAuthority.field ||
        fa.authority !== fieldAuthority.authority
    );
    const newFieldAuthorities = {
      authorities: newAuthorities,
    };

    const accountFieldAuthorities = await getFieldAuthorities(
      CONNECTION,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(accountFieldAuthorities, newFieldAuthorities);

    // Update if succeeded
    fieldAuthorities.authorities.push(fieldAuthority);
  }

  it("Remove field authority v2", async () => {
    await removeFieldAuthorityTest(fieldAuthorities.authorities[0]);
  });

  it("Update field with removed field authority fails", async () => {
    const val = randomStr(10);

    try {
      await updateFieldWithFieldAuthorityTest(Field.Name, val);
      throw new Error("Should have thrown");
    } catch (err) {
      // Better error parsing is coming with the new @solana/web3.js
      // https://github.com/solana-labs/solana-web3.js/issues/2019
      assert(err instanceof SendTransactionError);
    }
  });

  // TODO: Remove field authority with non-update authority fails

  // TODO: Test re-adding, re-removing, with and without indempotent
});
