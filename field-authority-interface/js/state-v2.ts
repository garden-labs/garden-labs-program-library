import { PublicKey } from "@solana/web3.js";
import {
  Field,
  getFieldCodec,
  getFieldConfig,
} from "@solana/spl-token-metadata";
import { splDiscriminate } from "@solana/spl-type-length-value";
import {
  getStructCodec,
  getArrayCodec,
  getDataEnumCodec,
  getBytesCodec,
} from "@solana/codecs";

export const FIELD_AUTHORITIES_DISCRIMINATOR =
  splDiscriminate("field_authorities");

export interface FieldAuthority {
  field: Field | string;
  authority: PublicKey;
}

export interface FieldAuthorities {
  authorities: FieldAuthority[];
}

export const fieldAuthorityCodec = getStructCodec([
  ["field", getDataEnumCodec(getFieldCodec())],
  ["authority", getBytesCodec({ size: 32 })],
]);

export const fieldAuthoritiesCodec = getStructCodec([
  ["authorities", getArrayCodec(fieldAuthorityCodec)],
]);

// Pack FieldAuthorities into byte slab
export function pack(fieldAuthorities: FieldAuthorities): Uint8Array {
  const fieldAuthoritiesConfig = {
    authorities: fieldAuthorities.authorities.map((authority) => ({
      field: getFieldConfig(authority.field),
      authority: authority.authority.toBuffer(),
    })),
  };

  return fieldAuthoritiesCodec.encode(fieldAuthoritiesConfig);
}

// TODO: Submit a PR to make these public / add this function:
// https://github.com/solana-labs/solana-program-library/blob/5feb1170d7d17bb78247a82c2613468b9788a6c5/token-metadata/js/src/field.ts#L20

type FieldLayout =
  | { __kind: "Name" }
  | { __kind: "Symbol" }
  | { __kind: "Uri" }
  | { __kind: "Key"; value: [string] };

function getField(layout: FieldLayout): Field | string {
  // eslint-disable-next-line no-underscore-dangle
  switch (layout.__kind) {
    case "Name":
      return Field.Name;
    case "Symbol":
      return Field.Symbol;
    case "Uri":
      return Field.Uri;
    case "Key":
      return layout.value[0];
    default:
      throw new Error(`Invalid Field layout: ${JSON.stringify(layout)}`);
  }
}

// Unpack byte slab into TokenMetadata
export function unpack(buffer: Buffer | Uint8Array): FieldAuthorities {
  const data = fieldAuthoritiesCodec.decode(buffer);

  return {
    authorities: data.authorities.map((authority) => ({
      field: getField(authority.field),
      authority: new PublicKey(authority.authority),
    })),
  };
}
