import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";
import {
  createEmitInstruction,
  unpack,
  TOKEN_METADATA_DISCRIMINATOR,
  TokenMetadata,
  Field,
} from "@solana/spl-token-metadata";
import { TlvState } from "@solana/spl-type-length-value";

/* eslint-disable @typescript-eslint/ban-types */
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

/**
 * Alternative Method (assumes tlv account)
 */
export async function getAccountMetadata(
  connection: Connection,
  metadataPubkey: PublicKey
): Promise<TokenMetadata> {
  const accountInfo = await connection.getAccountInfo(metadataPubkey);
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

/**
 * TODO: Figure out way to simulate without payer
 *
 * Primary Method (data structure agnostic, uses simulation)
 */
export async function getEmittedMetadata(
  connection: Connection,
  programId: PublicKey,
  metadataPubkey: PublicKey,
  payer: PublicKey
): Promise<TokenMetadata> {
  const emitIx = createEmitInstruction({
    programId,
    metadata: metadataPubkey,
  });
  const latestBlockhash = await connection.getLatestBlockhash();
  const txMsg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [emitIx],
  }).compileToV0Message();
  const v0Tx = new VersionedTransaction(txMsg);
  const res = (await connection.simulateTransaction(v0Tx)).value;

  if (!res.returnData?.data) {
    throw new Error("Return data is null");
  }

  const data = Buffer.from(res.returnData.data[0], "base64");
  return unpack(data);
}
