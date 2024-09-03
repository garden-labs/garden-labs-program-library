import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export const VENDING_MACHINE_PDA_SEED = "vending-machine-pda";
export const TREASURY_PUBLIC_KEY = new PublicKey(
  "JCXiqb3oL3xPrs9VWbDPcotEN8mEiNNba7E5fWhz6k8R"
);

export const MEMBER_PDA_SEED = "member-pda";

// NOTE: Different from AI Alien's due to u64
export function indexToSeed(index: BN): Buffer {
  const buffer = Buffer.alloc(8); // 8 bytes for u64
  buffer.writeBigUInt64LE(BigInt(index.toString()), 0); // Write u64 value in little-endian format
  return buffer;
}
