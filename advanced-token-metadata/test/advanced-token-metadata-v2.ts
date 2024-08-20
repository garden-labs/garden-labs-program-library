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
  createInitializeFieldAuthoritiesV2Ix,
  FieldAuthority,
  FieldAuthorities,
  getFieldAuthorities,
} from "../../field-authority-interface/js";

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
  const fieldAuthority: FieldAuthority = {
    field: Field.Name,
    authority: fieldAuthorityKp.publicKey,
  };
  const fieldAuthorities: FieldAuthorities = {
    authorities: [fieldAuthority],
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

  it("Initialize field authorities v2", async () => {
    const ix = createInitializeFieldAuthoritiesV2Ix({
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
});
