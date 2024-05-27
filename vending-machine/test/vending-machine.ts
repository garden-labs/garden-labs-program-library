import assert from "assert";

import {
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { TokenMetadata, Field } from "@solana/spl-token-metadata";
import * as borsh from "@coral-xyz/borsh";

import { ANCHOR_WALLET_KEYPAIR, ATM_PROGRAM_ID } from "../../util/js/constants";
import {
  HOLDER_METADATA_PDA_SEED,
  toAnchorParam,
} from "../js/holder-metadata-plugin";
import {
  createAddFieldAuthorityIx,
  FIELD_AUTHORITY_PDA_SEED,
  fieldToSeedStr,
} from "../../field-authority-interface/js/field-authority-interface";
import {
  getEmittedMetadata,
  randomStr,
  setupMintMetadataToken,
} from "../../util/js/helpers";
import { CONNECTION, setHolderMetadataPayer } from "../../util/js/config";

describe("Vending Machine", () => {
  it("Initialize", async () => {});
});
