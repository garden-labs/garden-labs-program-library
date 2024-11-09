import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const THE100_PDA_SEED = "the100-pda";
export const TREASURY_PUBLIC_KEY = new PublicKey(
  "JCXiqb3oL3xPrs9VWbDPcotEN8mEiNNba7E5fWhz6k8R"
);

export const MEMBER_PDA_SEED = "member-pda";

export function indexToSeed(index: number): Buffer {
  const buffer = Buffer.alloc(2); // 2 bytes for u16
  buffer.writeUInt16LE(index, 0); // Write u16 value in little-endian format
  return buffer;
}

export function getMintFeeLamports(index: number): number {
  return 2 * LAMPORTS_PER_SOL + 800_000 * index ** 2;
}
