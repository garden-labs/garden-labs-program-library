import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  Field,
  getFieldCodec,
  getFieldConfig,
} from "@solana/spl-token-metadata";
// NOTE: This must match the version of @solana/spl-token-metadata
import {
  StructToEncoderTuple,
  getStructEncoder,
  getDataEnumCodec,
  getBytesEncoder,
} from "@solana/codecs-data-structures";
import { splDiscriminate } from "@solana/spl-type-length-value";
import { getStringEncoder } from "@solana/codecs-strings";

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

function packInstruction<T extends object>(
  layout: StructToEncoderTuple<T>,
  discriminator: Uint8Array,
  values: T
): Buffer {
  const encoder = getStructEncoder(layout);
  const data = encoder.encode(values);
  return Buffer.concat([discriminator, data]);
}

export function createAddFieldAuthorityIx(
  payer: PublicKey,
  metadata: PublicKey,
  updateAuthority: PublicKey,
  fieldAuthority: PublicKey,
  field: Field | string,
  programId: PublicKey
): TransactionInstruction {
  const fieldAuthorityBuffer = Buffer.alloc(32);
  if (fieldAuthority) {
    fieldAuthorityBuffer.set(fieldAuthority.toBuffer());
  } else {
    fieldAuthorityBuffer.fill(0);
  }

  const data = packInstruction(
    [
      ["field", getDataEnumCodec(getFieldCodec())],
      ["authority", getBytesEncoder({ size: 32 })],
    ],
    splDiscriminate("field_interface_interface:add_field_authority"),
    { field: getFieldConfig(field), authority: fieldAuthorityBuffer }
  );

  const [fieldPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(FIELD_AUTHORITY_PDA_SEED),
      Buffer.from(fieldToSeedStr(field)),
      metadata.toBuffer(),
    ],
    programId
  );

  const ix = new TransactionInstruction({
    keys: [
      {
        pubkey: payer,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: metadata,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: updateAuthority,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: fieldPda,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
    programId,
  });

  return ix;
}

export function createUpdateFieldWithFieldAuthorityIx(
  metadata: PublicKey,
  fieldAuthority: PublicKey,
  field: Field | string,
  value: string,
  programId: PublicKey
): TransactionInstruction {
  const data = packInstruction(
    [
      ["field", getDataEnumCodec(getFieldCodec())],
      ["value", getStringEncoder()],
    ],
    splDiscriminate(
      "field_interface_interface:update_field_with_field_authority"
    ),
    { field: getFieldConfig(field), value }
  );

  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(FIELD_AUTHORITY_PDA_SEED),
      Buffer.from(fieldToSeedStr(field)),
      metadata.toBuffer(),
    ],
    programId
  );

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: metadata, isSigner: false, isWritable: true },
      {
        pubkey: fieldAuthority,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: pda,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
    programId,
  });

  return ix;
}

export function createRemoveFieldAuthorityIx(
  metadata: PublicKey,
  updateAuthority: PublicKey,
  field: Field | string,
  programId: PublicKey
): TransactionInstruction {
  const data = packInstruction(
    [["field", getDataEnumCodec(getFieldCodec())]],
    splDiscriminate("field_interface_interface:remove_field_authority"),
    { field: getFieldConfig(field) }
  );

  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(FIELD_AUTHORITY_PDA_SEED),
      Buffer.from(fieldToSeedStr(field)),
      metadata.toBuffer(),
    ],
    programId
  );

  const ix = new TransactionInstruction({
    keys: [
      {
        pubkey: metadata,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: updateAuthority,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: pda,
        isSigner: false,
        isWritable: true,
      },
    ],
    data,
    programId,
  });

  return ix;
}
