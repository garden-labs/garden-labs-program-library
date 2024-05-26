import "dotenv/config";

import path from "path";
import { readFileSync } from "fs";

import { web3 } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";

export const ANCHOR_WALLET_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(
    JSON.parse(
      readFileSync(process.env.ANCHOR_WALLET_PATH as string).toString()
    )
  )
);

export const BUILD_ATM_SCRIPT_PATH = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "build",
  "advanced-token-metadata.sh"
);

export const DEPLOY_ATM_SCRIPT_PATH = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "deploy",
  "advanced-token-metadata.sh"
);

const ATM_KEYPAIR_PATH = path.join(
  __dirname,
  "..",
  "target",
  "deploy",
  "advanced_token_metadata-keypair.json"
);

const ATM_KEYPAIR = web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(readFileSync(ATM_KEYPAIR_PATH).toString()))
);

export const ATM_PROGRAM_ID = ATM_KEYPAIR.publicKey;
