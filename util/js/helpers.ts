import "dotenv/config";

import assert from "assert";

import {
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import {
  createMint,
  mintTo,
  createAssociatedTokenAccount,
} from "@solana/spl-token";
import {
  TokenMetadata,
  createInitializeInstruction,
  Field,
} from "@solana/spl-token-metadata";

import { ANCHOR_WALLET_KEYPAIR } from "./constants";
import { ATM_PROGRAM_ID } from "../../advanced-token-metadata/js";
import { getConnection } from "./config";
import type { FieldAuthorities } from "../../field-authority-interface/js";
import { getAccountMetadata, getEmittedMetadata } from "../../common/js";
import { getSpaceRent } from "../../field-authority-interface/js";

// TODO: Create realloc instruction to metadata program so we don't need to
// preallocate field authority space
export async function createMetadataAccount(
  metadataKeypair: Keypair,
  metadataVals: TokenMetadata,
  futureFieldAuthorities?: FieldAuthorities
): Promise<void> {
  const { space, rent } = await getSpaceRent(
    getConnection(),
    metadataVals,
    futureFieldAuthorities
  );

  // Create metadata account
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: ANCHOR_WALLET_KEYPAIR.publicKey,
    newAccountPubkey: metadataKeypair.publicKey,
    lamports: rent,
    space,
    programId: ATM_PROGRAM_ID,
  });
  const createAccountTx = new Transaction().add(createAccountIx);
  await sendAndConfirmTransaction(getConnection(), createAccountTx, [
    ANCHOR_WALLET_KEYPAIR,
    metadataKeypair,
  ]);

  // Check balance
  const balance = await getConnection().getBalance(metadataKeypair.publicKey);
  assert.equal(balance, rent);
}

export async function setupMintMetadata(
  mintKeypair: Keypair,
  metadataKeypair: Keypair,
  metadataVals: TokenMetadata,
  futureFieldAuthorities?: FieldAuthorities
): Promise<void> {
  // Create mint
  await createMint(
    getConnection(),
    ANCHOR_WALLET_KEYPAIR,
    ANCHOR_WALLET_KEYPAIR.publicKey,
    null,
    0, // NFT
    mintKeypair
  );

  await createMetadataAccount(
    metadataKeypair,
    metadataVals,
    futureFieldAuthorities
  );

  // Set metadata account data
  const initDataIx = createInitializeInstruction({
    programId: ATM_PROGRAM_ID,
    metadata: metadataKeypair.publicKey,
    updateAuthority: metadataVals.updateAuthority as PublicKey,
    mint: metadataVals.mint,
    mintAuthority: ANCHOR_WALLET_KEYPAIR.publicKey,
    name: metadataVals.name,
    symbol: metadataVals.symbol,
    uri: metadataVals.uri,
  });
  const initTx = new Transaction().add(initDataIx);
  await sendAndConfirmTransaction(getConnection(), initTx, [
    ANCHOR_WALLET_KEYPAIR,
  ]);

  // Check emmitted metadata
  const emittedMetadata = await getEmittedMetadata(
    getConnection(),
    ATM_PROGRAM_ID,
    metadataKeypair.publicKey,
    ANCHOR_WALLET_KEYPAIR.publicKey
  );
  assert.deepStrictEqual(emittedMetadata, metadataVals);

  // Check account metadata
  const accountMetadata = await getAccountMetadata(
    getConnection(),
    metadataKeypair.publicKey
  );
  assert.deepStrictEqual(accountMetadata, metadataVals);
}

// TODO: Create realloc instruction to metadata program so we don't need to
// preallocate field authority space
export async function setupMintMetadataToken(
  mintKeypair: Keypair,
  metadataKeypair: Keypair,
  metadataVals: TokenMetadata,
  futureFieldAuthorities?: FieldAuthorities
): Promise<PublicKey> {
  // Create mint and metadata accounts
  await setupMintMetadata(
    mintKeypair,
    metadataKeypair,
    metadataVals,
    futureFieldAuthorities
  );

  // Mint token
  const tokenAddress = await createAssociatedTokenAccount(
    getConnection(),
    ANCHOR_WALLET_KEYPAIR,
    mintKeypair.publicKey,
    ANCHOR_WALLET_KEYPAIR.publicKey
  );
  await mintTo(
    getConnection(),
    ANCHOR_WALLET_KEYPAIR,
    mintKeypair.publicKey,
    tokenAddress,
    ANCHOR_WALLET_KEYPAIR,
    1
  );

  return tokenAddress;
}

/**
 * @returns new TokenMetadata object with updated field
 */
export function updateField(
  tokenMetadata: TokenMetadata,
  field: Field | string,
  val: string
): TokenMetadata {
  switch (field) {
    case Field.Name:
      return { ...tokenMetadata, name: val };
    case Field.Symbol:
      return { ...tokenMetadata, symbol: val };
    case Field.Uri:
      return { ...tokenMetadata, uri: val };
    // String
    default:
      break;
  }
  const filtered = tokenMetadata.additionalMetadata.filter(
    ([key]) => key !== field
  );
  return {
    ...tokenMetadata,
    additionalMetadata: [...filtered, [field, val]],
  };
}
