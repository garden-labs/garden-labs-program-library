import assert from "assert";

import {
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { AuthorityType, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenMetadata, Field } from "@solana/spl-token-metadata";
import * as borsh from "@coral-xyz/borsh";
import { workspace } from "@coral-xyz/anchor";

import { ANCHOR_WALLET_KEYPAIR, ATM_PROGRAM_ID } from "../../util/js/constants";
import { HOLDER_METADATA_PDA_SEED } from "../js/holder-metadata-plugin";
import {
  createAddFieldAuthorityV2Ix,
  createInitializeFieldAuthoritiesIx,
  FIELD_AUTHORITY_PDA_SEED,
  FieldAuthorities,
  FieldAuthority,
  fieldToSeedStr,
  getFieldAuthorities,
} from "../../field-authority-interface/js";
import {
  getEmittedMetadata,
  randomStr,
  setupMintMetadataToken,
  fieldToAnchorParam,
  getSpaceRent,
  getEnsureRentMinTx,
  getAccountMetadata,
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

  const fieldAuthority: FieldAuthority = {
    field: Field.Name,
    authority: holderMetadataPda,
  };
  const fieldAuthorities: FieldAuthorities = {
    authorities: [fieldAuthority],
  };

  const additionalFieldKey = "additional field key";

  it("Setup mint, metadata, and token", async () => {
    const mintKeypair = Keypair.generate();
    const metadataKeypair = Keypair.generate();
    const metadataVals = getMetadataVals(mintKeypair.publicKey);

    const token = await setupMintMetadataToken(
      mintKeypair,
      metadataKeypair,
      metadataVals,
      fieldAuthorities // Only creates space
    );

    mints.push(mintKeypair.publicKey);
    metadatas.push(metadataKeypair.publicKey);
    tokens.push(token);
  });

  it("Initialize field authorities", async () => {
    // Init ix
    const ix = createInitializeFieldAuthoritiesIx({
      programId: ATM_PROGRAM_ID,
      metadata: metadatas[0],
      updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      fieldAuthorities,
    });
    const tx = new Transaction().add(ix);

    // Ensure rent minimum
    const { rent } = await getSpaceRent(
      CONNECTION,
      getMetadataVals(mints[0]),
      fieldAuthorities
    );
    const rentIx = await getEnsureRentMinTx(
      CONNECTION,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      metadatas[0],
      rent
    );
    if (rentIx) {
      tx.add(rentIx);
    }

    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

    // Check emmitted metadata
    const emittedMetadata = await getEmittedMetadata(
      ATM_PROGRAM_ID,
      metadatas[0]
    );
    assert.deepStrictEqual(emittedMetadata, getMetadataVals(mints[0]));

    // Check account metadata
    const accountMetadata = await getAccountMetadata(metadatas[0]);
    assert.deepStrictEqual(accountMetadata, getMetadataVals(mints[0]));

    // Check field authorities
    const accountFieldAuthorities = await getFieldAuthorities(
      CONNECTION,
      metadatas[0]
    );
    assert.deepStrictEqual(accountFieldAuthorities, fieldAuthorities);
  });

  it("Add name as holder field", async () => {
    const ix = createAddFieldAuthorityV2Ix({
      programId: ATM_PROGRAM_ID,
      metadata: metadatas[0],
      updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
      fieldAuthority,
      idempotent: true,
    });

    const tx = new Transaction().add(ix);

    await sendAndConfirmTransaction(CONNECTION, tx, [ANCHOR_WALLET_KEYPAIR]);

    // Check field authorities
    const accountFieldAuthorities = await getFieldAuthorities(
      CONNECTION,
      metadatas[0]
    );
    assert.deepStrictEqual(accountFieldAuthorities, fieldAuthorities);
  });

  async function updateNameWithHolderV2(
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

    await program.methods
      .updateHolderFieldV2(param, val)
      // TODO: Fix holderTokenAccount error when using `accounts()`
      .accountsPartial({
        mint,
        metadata,
        holderTokenAccount: token,
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
    await updateNameWithHolderV2(
      mints[index],
      metadatas[index],
      tokens[index],
      ANCHOR_WALLET_KEYPAIR
    );
  });

  it("Update longer name with holder metadata succeeds", async () => {
    const index = 0;
    await updateNameWithHolderV2(
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
      await updateNameWithHolderV2(
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
      await updateNameWithHolderV2(
        mints[0],
        metadatas[0],
        tokens[1],
        ANCHOR_WALLET_KEYPAIR
      );
    });
  });

  it("Update name with wrong metadata fails", async () => {
    assert.rejects(async () => {
      await updateNameWithHolderV2(
        mints[0],
        metadatas[1],
        tokens[0],
        ANCHOR_WALLET_KEYPAIR
      );
    });
  });

  it("Update name with wrong metadata fails", async () => {
    assert.rejects(async () => {
      await updateNameWithHolderV2(
        mints[1],
        metadatas[0],
        tokens[0],
        ANCHOR_WALLET_KEYPAIR
      );
    });
  });
});
