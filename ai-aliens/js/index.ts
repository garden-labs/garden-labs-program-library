export const AI_ALIENS_AUTHORITY_PDA_SEED = "ai-aliens-pda";
export const NFT_MINTED_PDA_SEED = "nft-minted-pda";
export const NICKNAME_FIELD_KEY = "nickname";

export function indexToSeed(index: number): Buffer {
  const buffer = Buffer.alloc(2); // 2 bytes
  buffer.writeUInt16LE(index, 0); // Write u16 value in little-endian format
  return buffer;
}
