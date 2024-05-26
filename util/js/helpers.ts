import "dotenv/config";

import crypto from "crypto";
import assert from "assert";
import { execSync } from "child_process";

import {
  ParsedTransactionWithMeta,
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
  createEmitInstruction,
  pack,
  unpack,
  TOKEN_METADATA_DISCRIMINATOR,
  TokenMetadata,
  createInitializeInstruction,
} from "@solana/spl-token-metadata";

import {
  ANCHOR_WALLET_KEYPAIR,
  DEPLOY_ATM_SCRIPT_PATH,
  ATM_PROGRAM_ID,
} from "./constants";
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
  // Retries necessary due to "Unable to obtain a new blockhash" error
  async function attemptEmit(retries: number): Promise<string> {
    try {
      const emitIx = createEmitInstruction({
        programId,
        metadata: metadataPubkey,
      });
      const emitTx = new Transaction().add(emitIx);
      return await sendAndConfirmTransaction(CONNECTION, emitTx, [
        ANCHOR_WALLET_KEYPAIR,
      ]);
    } catch (err) {
      if (retries === 0) {
        // eslint-disable-next-line no-console
        console.error(err);
        throw new Error("Max retries reached");
      }
      return attemptEmit(retries - 1);
    }
  }

  const sig = await attemptEmit(10);

  // Get emitted metadata
  const tx = await CONNECTION.getParsedTransaction(sig);
  if (!tx || !tx.meta) {
    throw new Error("Transaction or metadata is null");
  }
  // TODO: Remove once web3.js typings are updated
  interface TxWithData extends ParsedTransactionWithMeta {
    meta: ParsedTransactionWithMeta["meta"] & {
      returnData: {
        data: string[];
      };
    };
  }
  const txWithData = tx as TxWithData;
  const data = Buffer.from(txWithData.meta.returnData.data[0], "base64");

  return unpack(data);
}

// TODO: Deploy via Anchor config? Perhaps we need this method for local validator
let atmProgramDeployed = process.env.TEST_ENV !== "localnet";
export function ensureAtmProgramDeployed(): void {
  if (!atmProgramDeployed) {
    // eslint-disable-next-line no-console
    console.log("Deploying advanced token metadata program...");
    execSync(DEPLOY_ATM_SCRIPT_PATH);
    atmProgramDeployed = true;
  }
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
    1,
    undefined
  );

  ensureAtmProgramDeployed();

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
