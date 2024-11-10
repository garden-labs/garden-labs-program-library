import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const THE100_PDA_SEED = "the100-pda";
// TEMP (Hot 2): Change back on final deployment
// export const TREASURY_PUBKEY = new PublicKey(
//   "JCXiqb3oL3xPrs9VWbDPcotEN8mEiNNba7E5fWhz6k8R"
// );
export const TREASURY_PUBKEY = new PublicKey("FqAtC5ZXgmp47g3fJncrvUwicbNuNveoUKdbtF6JZSqc");

export const COL_DATA_PUBKEY = new PublicKey("5nsUiCG3YhmMFCUbVNqjccCsdyhrRA9xj3zoQJQCB2zB");

export const MEMBER_PDA_SEED = "member-pda";

export function indexToSeed(index: number): Buffer {
  const buffer = Buffer.alloc(2); // 2 bytes for u16
  buffer.writeUInt16LE(index, 0); // Write u16 value in little-endian format
  return buffer;
}

export function getMintFeeLamports(index: number): number {
  return 1 * LAMPORTS_PER_SOL + 900_000 * index ** 2;
}
