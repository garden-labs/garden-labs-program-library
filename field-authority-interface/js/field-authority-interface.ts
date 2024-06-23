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
// Configure by looking at the release commit
import { splDiscriminate } from "@solana/spl-type-length-value";
import {
  getBytesEncoder,
  getStringEncoder,
  getStructEncoder,
  getDataEnumCodec,
  mapEncoder,
  getTupleEncoder,
} from "@solana/codecs";
import type { Encoder } from "@solana/codecs";

// The following functions are from: https://github.com/solana-labs/solana-program-library/blob/8c8e7de68b96f8853fdc555ce0af3cfdc717bf55/token-metadata/js/src/instruction.ts

function getInstructionEncoder<T extends object>(
  discriminator: Uint8Array,
  dataEncoder: Encoder<T>
): Encoder<T> {
  return mapEncoder(
    getTupleEncoder([getBytesEncoder(), dataEncoder]),
    (data: T): [Uint8Array, T] => [discriminator, data]
  );
}

function getPublicKeyEncoder(): Encoder<PublicKey> {
  return mapEncoder(getBytesEncoder({ size: 32 }), (publicKey: PublicKey) =>
    publicKey.toBytes()
  );
}

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

export function createAddFieldAuthorityIx(
  payer: PublicKey,
  metadata: PublicKey,
  updateAuthority: PublicKey,
  fieldAuthority: PublicKey,
  field: Field | string,
  programId: PublicKey
): TransactionInstruction {
  const data = Buffer.from(
    getInstructionEncoder(
      splDiscriminate("field_interface_interface:add_field_authority"),
      getStructEncoder([
        ["field", getDataEnumCodec(getFieldCodec())],
        ["authority", getPublicKeyEncoder()],
      ])
    ).encode({
      field: getFieldConfig(field),
      authority: fieldAuthority,
    })
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
  const data = Buffer.from(
    getInstructionEncoder(
      splDiscriminate(
        "field_interface_interface:update_field_with_field_authority"
      ),
      getStructEncoder([
        ["field", getDataEnumCodec(getFieldCodec())],
        ["value", getStringEncoder()],
      ])
    ).encode({ field: getFieldConfig(field), value })
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
  const data = Buffer.from(
    getInstructionEncoder(
      splDiscriminate("field_interface_interface:remove_field_authority"),
      getStructEncoder([["field", getDataEnumCodec(getFieldCodec())]])
    ).encode({ field: getFieldConfig(field) })
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
