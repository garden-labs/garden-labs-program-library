import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getFieldConfig } from "@solana/spl-token-metadata";
// NOTE: This must match the version of @solana/spl-token-metadata
// Configure by looking at the release commit
import { splDiscriminate } from "@solana/spl-type-length-value";

import { getInstructionEncoder } from "./instructions";
import { FieldAuthorities, fieldAuthoritiesCodec } from "./state-v2";

export interface InitializeFieldAuthoritiesV2Args {
  programId: PublicKey;
  metadata: PublicKey;
  updateAuthority: PublicKey;
  fieldAuthorities: FieldAuthorities;
}

export function createInitializeFieldAuthoritiesV2Ix(
  args: InitializeFieldAuthoritiesV2Args
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
          "field_authority_interface:initialize_field_authorities_v2"
        ),
        // Will need to alter this if instruction data contains more than FieldAuthorities
        fieldAuthoritiesCodec
      ).encode({
        authorities: authoritiesConfig,
      })
    ),
  });
}
