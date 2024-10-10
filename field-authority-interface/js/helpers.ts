import { Connection, PublicKey } from "@solana/web3.js";
import { TlvState } from "@solana/spl-type-length-value";
import {
  TOKEN_METADATA_DISCRIMINATOR,
  TokenMetadata,
  pack,
} from "@solana/spl-token-metadata";

import {
  FieldAuthorities,
  unpack,
  FIELD_AUTHORITIES_DISCRIMINATOR,
  pack as packFieldAuthorities,
} from "./state-v2";

export async function getFieldAuthorities(
  connection: Connection,
  metadataPubkey: PublicKey
): Promise<FieldAuthorities> {
  const accountInfo = await connection.getAccountInfo(metadataPubkey);
  if (!accountInfo) {
    throw new Error("Account not found");
  }

  const tlv = new TlvState(accountInfo.data, 8, 4);
  const buffer = tlv.firstBytes(FIELD_AUTHORITIES_DISCRIMINATOR);
  if (!buffer) {
    throw new Error("Field authorities not found");
  }

  return unpack(buffer);
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
