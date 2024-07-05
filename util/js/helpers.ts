import "dotenv/config";

import crypto from "crypto";
import assert from "assert";

import {
  ParsedTransactionWithMeta,
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
} from "@solana/spl-token-metadata";

import { ANCHOR_WALLET_KEYPAIR, ATM_PROGRAM_ID } from "./constants";
import { CONNECTION } from "./config";

export function randomStr(numChars: number): string {
  return crypto.randomBytes(numChars).toString("hex").slice(0, numChars);
}

// Alternative Method
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getAccountMetadata(
  metadataPubkey: PublicKey
): Promise<TokenMetadata> {
  const accountInfo = await CONNECTION.getAccountInfo(metadataPubkey);
  if (!accountInfo) {
    throw new Error("Account not found");
  }
  // From https://github.com/ZYJLiu/anchor-token-metadata/blob/f9114d9d14a0620d1a7cfd5806c82887a72dc5e3/tests/token-metadata.ts#L22
  // Metadata starts with offset of 12 bytes
  // 8 byte discriminator + 4 byte extra offset? (not sure)
  return unpack(accountInfo.data.subarray(12));
}

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

export async function createMetadataAccount(
  metadataKeypair: Keypair,
  metadataVals: TokenMetadata,
  additionalFieldKey: string
): Promise<void> {
  // Calculate space for metadata account
  const tlSpace = 4; // 2 bytes for type, 2 bytes for length, for TLV encoding
  const space =
    TOKEN_METADATA_DISCRIMINATOR.length + tlSpace + pack(metadataVals).length;

  // Calculate lamports for metadata account
  metadataVals.additionalMetadata.push([
    // Temporary
    additionalFieldKey,
    randomStr(10),
  ]);
  const futureSpace =
    TOKEN_METADATA_DISCRIMINATOR.length + tlSpace + pack(metadataVals).length;
  metadataVals.additionalMetadata.pop();
  const lamports = await CONNECTION.getMinimumBalanceForRentExemption(
    futureSpace
  );

  // Create metadata account
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: ANCHOR_WALLET_KEYPAIR.publicKey,
    newAccountPubkey: metadataKeypair.publicKey,
    lamports,
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
  assert.equal(balance, lamports);
}

export async function setupMintMetadataToken(
  mintKeypair: Keypair,
  metadataKeypair: Keypair,
  metadataVals: TokenMetadata,
  additionalFieldKey: string
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
    additionalFieldKey
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

  return tokenAddress;
}
