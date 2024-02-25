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
  const mintKeypair = Keypair.generate();
  let tokenAddress: PublicKey; // Initialized in tests
  const metadataKeypair = Keypair.generate();

  const [holderMetadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(HOLDER_METADATA_PDA_SEED)],
    setHolderMetadataPayer(ANCHOR_WALLET_KEYPAIR).program.programId
  );

  let metadataVals: TokenMetadata = {
    name: "My test token",
    symbol: "TEST",
    uri: "http://test.test",
    updateAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
    mint: mintKeypair.publicKey,
    additionalMetadata: [],
  };
  const additionalFieldKey = "additional field key";

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

  it("Add name as holder field", async () => {
    const ix = createAddFieldAuthorityIx(
      ANCHOR_WALLET_KEYPAIR.publicKey,
      metadataKeypair.publicKey,
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
        metadataKeypair.publicKey.toBuffer(),
      ],
      EXAMPLE_PROGRAM_ID
    );
    const pdaInfo = await CONNECTION.getAccountInfo(pda);
    assert(pdaInfo);
    const fieldAuthoritySchema = borsh.struct([borsh.publicKey("authority")]);
    const { authority } = fieldAuthoritySchema.decode(pdaInfo.data);
    assert(holderMetadataPda.equals(authority));
  });

  it("update name with holder metadata succeeds", async () => {
    const { program } = setHolderMetadataPayer(ANCHOR_WALLET_KEYPAIR);

    const val = randomStr(10);

    const param = toAnchorParam(Field.Name);

    const [fieldPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(Field.Name)),
        metadataKeypair.publicKey.toBuffer(),
      ],
      EXAMPLE_PROGRAM_ID
    );

    await program.methods
      .updateHolderField(param, val)
      .accounts({
        mint: mintKeypair.publicKey,
        metadata: metadataKeypair.publicKey,
        holderTokenAccount: tokenAddress,
        holderMetadataPda,
        fieldPda,
        fieldAuthorityProgram: EXAMPLE_PROGRAM_ID,
      })
      .rpc();

    // Check emmitted metadata
    const vals: TokenMetadata = { ...metadataVals, name: val };
    const emittedMetadata = await getEmittedMetadata(
      EXAMPLE_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, vals);

    // Update if succeeded
    metadataVals = vals;
  });
});
