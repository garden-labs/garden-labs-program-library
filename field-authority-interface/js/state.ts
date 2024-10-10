import { Field } from "@solana/spl-token-metadata";

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
