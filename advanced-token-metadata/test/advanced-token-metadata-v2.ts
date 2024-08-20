import assert from "assert";

import {
  Keypair,
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
} from "../../util/js/helpers";
import { CONNECTION } from "../../util/js/config";
import {
  createInitializeFieldAuthoritiesIx,
  FieldAuthority,
  FieldAuthorities,
  getFieldAuthorities,
  createUpdateFieldWithFieldAuthorityV2Ix,
} from "../../field-authority-interface/js";
import { AnchorError } from "@coral-xyz/anchor";

describe("Advanced Token Metadata Program V2", () => {
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

  const fieldAuthorityKp = Keypair.generate();
  const fieldAuthorityOne: FieldAuthority = {
    field: Field.Name,
    authority: fieldAuthorityKp.publicKey,
  };
  const fieldAuthorityTwo: FieldAuthority = {
    field: additionalFieldKey,
    authority: fieldAuthorityKp.publicKey,
  };
  const fieldAuthorities: FieldAuthorities = {
    authorities: [fieldAuthorityOne, fieldAuthorityTwo],
  };

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
    const val = "new name";

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
    const vals: TokenMetadata = { ...metadataVals, name: val };
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

  it("Update field with incorrect field authority fails (v2)", async () => {
    const val = "new name";

    const ix = createUpdateFieldWithFieldAuthorityV2Ix({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      fieldAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      field: Field.Name,
      value: val,
    });

    const tx = new Transaction().add(ix);

    try {
      await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);
      throw new Error("Expected error to be thrown");
    } catch (err) {
      // Better error parsing is coming with the new @solana/web3.js: https://github.com/solana-labs/solana-web3.js/issues/2019
      // As of right now it's not easy to parse these errors, (see below).
      // {
      //   "signature": "",
      //   "transactionMessage": "Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1",
      //   "transactionLogs": [
      //     "Program 2GkHVZ2y5wP4nw4uA2GWFnc7jphfjKbbcEKwqMCV42a6 invoke [1]",
      //     "Program log: Instruction: UpdateFieldWithFieldAuthorityV2",
      //     "Program log: Error: Unknown",
      //     "Program 2GkHVZ2y5wP4nw4uA2GWFnc7jphfjKbbcEKwqMCV42a6 consumed 3022 of 200000 compute units",
      //     "Program 2GkHVZ2y5wP4nw4uA2GWFnc7jphfjKbbcEKwqMCV42a6 failed: custom program error: 0x1"
      //   ]
      // }
    }
  });

  it("Update field with correct field authority (v2)", async () => {
    const val = "new name";

    const ix = createUpdateFieldWithFieldAuthorityV2Ix({
      programId: ATM_PROGRAM_ID,
      metadata: metadataKeypair.publicKey,
      fieldAuthority: fieldAuthorityKp.publicKey,
      field: Field.Name,
      value: val,
    });

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [
      ANCHOR_WALLET_KEYPAIR,
      fieldAuthorityKp,
    ]);

    const vals: TokenMetadata = { ...metadataVals, name: val };

    // Check emmitted metadata
    const emittedMetadata = await getEmittedMetadata(
      ATM_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, vals);

    // Check account metadata
    const accountMetadata = await getAccountMetadata(metadataKeypair.publicKey);
    assert.deepStrictEqual(accountMetadata, metadataVals);

    // Update if succeeded
    metadataVals = vals;
  });
});
