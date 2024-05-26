/* eslint-disable @typescript-eslint/ban-types */

import { Field } from "@solana/spl-token-metadata";

export const HOLDER_METADATA_PDA_SEED = "holder-metadata-pda";

type AnchorFieldParam =
  | { name: {} }
  | { symbol: {} }
  | { uri: {} }
  | { key: [string] };

export function toAnchorParam(field: Field | string): AnchorFieldParam {
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
