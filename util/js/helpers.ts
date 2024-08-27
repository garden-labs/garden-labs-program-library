// TODO: Begin adding things like Connection to params, make this a library

/* eslint-disable @typescript-eslint/ban-types */

import "dotenv/config";

import crypto from "crypto";
import assert from "assert";

import {
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  PublicKey,
  SystemProgram,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";
import {
  createMint,
  mintTo,
  createAssociatedTokenAccount,
} from "@solana/spl-token";
import {
  createEmitInstruction,
  pack,
  unpack,
  TOKEN_METADATA_DISCRIMINATOR,
  TokenMetadata,
  createInitializeInstruction,
  Field,
} from "@solana/spl-token-metadata";
import { TlvState } from "@solana/spl-type-length-value";

import { ANCHOR_WALLET_KEYPAIR, ATM_PROGRAM_ID } from "./constants";
import { CONNECTION } from "./config";
import type { FieldAuthorities } from "../../field-authority-interface/js";
import {
  pack as packFieldAuthorities,
  FIELD_AUTHORITIES_DISCRIMINATOR,
} from "../../field-authority-interface/js";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function randomStr(numChars: number): string {
  return crypto.randomBytes(numChars).toString("hex").slice(0, numChars);
}

// Alternative Method (assumes tlv account)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAccountMetadata(
  metadataPubkey: PublicKey
): Promise<TokenMetadata> {
  const accountInfo = await CONNECTION.getAccountInfo(metadataPubkey);
  if (!accountInfo) {
    throw new Error("Account not found");
  }

  const tlv = new TlvState(
    accountInfo.data,
    TOKEN_METADATA_DISCRIMINATOR.length,
    4 // length
  );
  const buffer = tlv.firstBytes(TOKEN_METADATA_DISCRIMINATOR);
  if (!buffer) {
    throw new Error("Token metadata not found");
  }

  return unpack(buffer);
}

// Primary Method (data structure agnostic, uses simulation)
export async function getEmittedMetadata(
  programId: PublicKey,
  metadataPubkey: PublicKey
): Promise<TokenMetadata> {
  const emitIx = createEmitInstruction({
    programId,
    metadata: metadataPubkey,
  });
  const latestBlockhash = await CONNECTION.getLatestBlockhash();
  const txMsg = new TransactionMessage({
    payerKey: ANCHOR_WALLET_KEYPAIR.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [emitIx],
  }).compileToV0Message();
  const v0Tx = new VersionedTransaction(txMsg);
  const res = (await CONNECTION.simulateTransaction(v0Tx)).value;

  if (!res.returnData?.data) {
    throw new Error("Return data is null");
  }

  const data = Buffer.from(res.returnData.data[0], "base64");
  return unpack(data);
}

export async function getSpaceRent(
  connection: Connection,
  metadata?: TokenMetadata,
  fieldAuthorities?: FieldAuthorities
): Promise<{ space: number; rent: number }> {
  let space = 0;
  let rent = 0;

  if (metadata) {
    space += TOKEN_METADATA_DISCRIMINATOR.length + 4 + pack(metadata).length;
  }

  if (fieldAuthorities) {
    space +=
      FIELD_AUTHORITIES_DISCRIMINATOR.length +
      4 +
      packFieldAuthorities(fieldAuthorities).length;
  }

  if (space === 0) {
    rent = 0;
  } else {
    rent = await connection.getMinimumBalanceForRentExemption(space);
  }

  return { space, rent };
}

/**
 * @returns null if min rent reached
 */
export async function getEnsureRentMinTx(
  connection: Connection,
  payer: PublicKey,
  account: PublicKey,
  minRent: number
): Promise<TransactionInstruction | null> {
  let currentRent = 0;
  const accountInfo = await connection.getAccountInfo(account);
  if (accountInfo) {
    currentRent = accountInfo.lamports;
  }

  if (currentRent >= minRent) {
    return null;
  }

  return SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: account,
    lamports: minRent - currentRent,
  });
}

// TODO: Create realloc instruction to metadata program so we don't need to
// preallocate field authority space
export async function createMetadataAccount(
  metadataKeypair: Keypair,
  metadataVals: TokenMetadata,
  futureFieldAuthorities?: FieldAuthorities
): Promise<void> {
  const { space, rent } = await getSpaceRent(
    CONNECTION,
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
  await sendAndConfirmTransaction(CONNECTION, createAccountTx, [
    ANCHOR_WALLET_KEYPAIR,
    metadataKeypair,
  ]);

  // Check balance
  const balance = await CONNECTION.getBalance(metadataKeypair.publicKey);
  assert.equal(balance, rent);
}

// TODO: Create realloc instruction to metadata program so we don't need to
// preallocate field authority space
export async function setupMintMetadataToken(
  mintKeypair: Keypair,
  metadataKeypair: Keypair,
  metadataVals: TokenMetadata,
  futureFieldAuthorities?: FieldAuthorities
): Promise<PublicKey> {
  // Create mint
  await createMint(
    CONNECTION,
    ANCHOR_WALLET_KEYPAIR,
    ANCHOR_WALLET_KEYPAIR.publicKey,
    null,
    0, // NFT
    mintKeypair
  );

  // Mint token
  const tokenAddress = await createAssociatedTokenAccount(
    CONNECTION,
    ANCHOR_WALLET_KEYPAIR,
    mintKeypair.publicKey,
    ANCHOR_WALLET_KEYPAIR.publicKey
  );
  await mintTo(
    CONNECTION,
    ANCHOR_WALLET_KEYPAIR,
    mintKeypair.publicKey,
    tokenAddress,
    ANCHOR_WALLET_KEYPAIR,
    1
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
  await sendAndConfirmTransaction(CONNECTION, initTx, [ANCHOR_WALLET_KEYPAIR]);

  // Check emmitted metadata
  const emittedMetadata = await getEmittedMetadata(
    ATM_PROGRAM_ID,
    metadataKeypair.publicKey
  );
  assert.deepStrictEqual(emittedMetadata, metadataVals);

  // Check account metadata
  const accountMetadata = await getAccountMetadata(metadataKeypair.publicKey);
  assert.deepStrictEqual(accountMetadata, metadataVals);

  return tokenAddress;
}

type AnchorFieldParam =
  | { name: {} }
  | { symbol: {} }
  | { uri: {} }
  | { key: [string] };

export function fieldToAnchorParam(field: Field | string): AnchorFieldParam {
  switch (field) {
    case Field.Name:
      return { name: {} };
    case Field.Symbol:
      return { symbol: {} };
    case Field.Uri:
      return { uri: {} };
    // String
    default:
      return { key: [field] };
  }
}

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
