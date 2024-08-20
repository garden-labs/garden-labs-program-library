import { Connection, PublicKey } from "@solana/web3.js";
import { TlvState } from "@solana/spl-type-length-value";

import {
  FieldAuthorities,
  unpack,
  FIELD_AUTHORITIES_DISCRIMINATOR,
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
