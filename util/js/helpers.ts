/* eslint-disable @typescript-eslint/ban-types */

import "dotenv/config";

import crypto from "crypto";
import assert from "assert";

import {
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  SystemProgram,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
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
import { token } from "@coral-xyz/anchor/dist/cjs/utils";

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

  const tlv = new TlvState(accountInfo.data, 8, 4);
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

// TODO: Perhaps remove adding future space beforehand and place that before
// functions that require it.
export async function createMetadataAccount(
  metadataKeypair: Keypair,
  metadataVals: TokenMetadata,
  additionalFieldKey: string,
  fieldAuthorities?: FieldAuthorities
): Promise<void> {
  // TODO: Is this actually just length and the descriminator below counts for type?
  // 2 bytes for type, 2 bytes for length, for TLV encoding
  const tlSpace = 4;

  // Calculate space for metadata
  const metadataSpace =
    TOKEN_METADATA_DISCRIMINATOR.length + tlSpace + pack(metadataVals).length;

  // Calculate space for metadata with additional fields
  metadataVals.additionalMetadata.push([
    // Temporary
    additionalFieldKey,
    randomStr(10),
  ]);
  const futureMetadataSpace =
    TOKEN_METADATA_DISCRIMINATOR.length + tlSpace + pack(metadataVals).length;
  metadataVals.additionalMetadata.pop();

  // Calculate space for field authorities
  const fieldAuthoritiesSpace = fieldAuthorities
    ? FIELD_AUTHORITIES_DISCRIMINATOR.length +
      tlSpace +
      packFieldAuthorities(fieldAuthorities).length
    : 0;

  // Calculate lamports for future space
  const lamports = await CONNECTION.getMinimumBalanceForRentExemption(
    futureMetadataSpace + fieldAuthoritiesSpace
  );

  // Create metadata account
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: ANCHOR_WALLET_KEYPAIR.publicKey,
    newAccountPubkey: metadataKeypair.publicKey,
    lamports,
    space: metadataSpace + fieldAuthoritiesSpace,
    programId: ATM_PROGRAM_ID,
  });
  const createAccountTx = new Transaction().add(createAccountIx);
  await sendAndConfirmTransaction(CONNECTION, createAccountTx, [
    ANCHOR_WALLET_KEYPAIR,
    metadataKeypair,
  ]);

  // Check balance
  const balance = await CONNECTION.getBalance(metadataKeypair.publicKey);
  assert.equal(balance, lamports);
}

export async function setupMintMetadataToken(
  mintKeypair: Keypair,
  metadataKeypair: Keypair,
  metadataVals: TokenMetadata,
  additionalFieldKey: string,
  fieldAuthorities?: FieldAuthorities
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
    additionalFieldKey,
    fieldAuthorities
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

function fieldToObjKey(field: Field | string): string {
  switch (field) {
    case Field.Name:
      return "name";
    case Field.Symbol:
      return "symbol";
    case Field.Uri:
      return "uri";
    // String
    default:
      return field;
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
