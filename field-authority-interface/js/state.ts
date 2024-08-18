import { PublicKey } from "@solana/web3.js";
import { Field } from "@solana/spl-token-metadata";

// V1

export const FIELD_AUTHORITY_PDA_SEED = "field-authority-pda";

export function fieldToSeedStr(field: Field | string): string {
  switch (field) {
    case Field.Name:
      return "name";
    case Field.Symbol:
      return "symbol";
    case Field.Uri:
      return "uri";
    default:
      return `key:${field}`;
  }
}

// V2

export interface FieldAuthority {
  field: Field;
  authority: PublicKey;
}
