import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  getFieldConfig,
  Field,
  getFieldCodec,
} from "@solana/spl-token-metadata";
// NOTE: This must match the version of @solana/spl-token-metadata
// Configure by looking at the release commit
import { splDiscriminate } from "@solana/spl-type-length-value";
import {
  getStructEncoder,
  getDataEnumCodec,
  getStringEncoder,
  getBooleanEncoder,
} from "@solana/codecs";

import { getInstructionEncoder } from "./instructions";
import {
  FieldAuthorities,
  fieldAuthoritiesCodec,
  FieldAuthority,
  fieldAuthorityCodec,
} from "./state-v2";

export interface InitializeFieldAuthoritiesArgs {
  programId: PublicKey;
  metadata: PublicKey;
  updateAuthority: PublicKey;
  fieldAuthorities: FieldAuthorities;
}

export function createInitializeFieldAuthoritiesIx(
  args: InitializeFieldAuthoritiesArgs
): TransactionInstruction {
  const { programId, metadata, updateAuthority, fieldAuthorities } = args;

  const authoritiesConfig = fieldAuthorities.authorities.map((authority) => ({
    field: getFieldConfig(authority.field),
    authority: authority.authority.toBuffer(),
  }));

  return new TransactionInstruction({
    programId,
    keys: [
      { isSigner: false, isWritable: true, pubkey: metadata },
      { isSigner: true, isWritable: false, pubkey: updateAuthority },
    ],
    data: Buffer.from(
      getInstructionEncoder(
        splDiscriminate(
          "field_authority_interface:initialize_field_authorities"
        ),
        // Will need to alter this if instruction data contains more than FieldAuthorities
        fieldAuthoritiesCodec
      ).encode({
        authorities: authoritiesConfig,
      })
    ),
  });
}

export interface AddFieldAuthorityV2Args {
  programId: PublicKey;
  metadata: PublicKey;
  updateAuthority: PublicKey;
  fieldAuthority: FieldAuthority;
  idempotent: boolean;
}

export function createAddFieldAuthorityV2Ix(
  args: AddFieldAuthorityV2Args
): TransactionInstruction {
  const { programId, metadata, updateAuthority, fieldAuthority, idempotent } =
    args;

  return new TransactionInstruction({
    programId,
    keys: [
      { isSigner: false, isWritable: true, pubkey: metadata },
      { isSigner: true, isWritable: false, pubkey: updateAuthority },
    ],
    data: Buffer.from(
      getInstructionEncoder(
        splDiscriminate("field_authority_interface:add_field_authority_v2"),
        getStructEncoder([
          ["idempotent", getBooleanEncoder()],
          ["field_authority", fieldAuthorityCodec],
        ])
      ).encode({
        idempotent,
        field_authority: {
          field: getFieldConfig(fieldAuthority.field),
          authority: fieldAuthority.authority.toBuffer(),
        },
      })
    ),
  });
}

export interface UpdateFieldWithFieldAuthorityV2Args {
  programId: PublicKey;
  metadata: PublicKey;
  fieldAuthority: PublicKey;
  field: Field | string;
  value: string;
}

export function createUpdateFieldWithFieldAuthorityV2Ix(
  args: UpdateFieldWithFieldAuthorityV2Args
): TransactionInstruction {
  const { programId, metadata, fieldAuthority, field, value } = args;

  return new TransactionInstruction({
    programId,
    keys: [
      { isSigner: false, isWritable: true, pubkey: metadata },
      { isSigner: true, isWritable: false, pubkey: fieldAuthority },
    ],
    data: Buffer.from(
      getInstructionEncoder(
        splDiscriminate(
          "field_authority_interface:update_field_with_field_authority_v2"
        ),
        getStructEncoder([
          ["field", getDataEnumCodec(getFieldCodec())],
          ["value", getStringEncoder()],
        ])
      ).encode({ field: getFieldConfig(field), value })
    ),
  });
}

export interface RemoveFieldAuthorityV2Args {
  programId: PublicKey;
  metadata: PublicKey;
  updateAuthority: PublicKey;
  fieldAuthority: FieldAuthority;
  idempotent: boolean;
}

export function createRemoveFieldAuthorityV2Ix(
  args: RemoveFieldAuthorityV2Args
): TransactionInstruction {
  const { programId, metadata, updateAuthority, fieldAuthority, idempotent } =
    args;

  return new TransactionInstruction({
    programId,
    keys: [
      { isSigner: false, isWritable: true, pubkey: metadata },
      { isSigner: true, isWritable: false, pubkey: updateAuthority },
    ],
    data: Buffer.from(
      getInstructionEncoder(
        splDiscriminate("field_authority_interface:remove_field_authority_v2"),
        getStructEncoder([
          ["idempotent", getBooleanEncoder()],
          ["field_authority", fieldAuthorityCodec],
        ])
      ).encode({
        idempotent,
        field_authority: {
          field: getFieldConfig(fieldAuthority.field),
          authority: fieldAuthority.authority.toBuffer(),
        },
      })
    ),
  });
}
