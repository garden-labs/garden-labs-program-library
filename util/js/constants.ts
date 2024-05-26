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

export const BUILD_EXAMPLE_SCRIPT_PATH = path.join(
  __dirname,
  "..",
  "scripts",
  "build",
  "spl-token-metadata-example.sh"
);

export const DEPLOY_EXAMPLE_SCRIPT_PATH = path.join(
  __dirname,
  "..",
  "scripts",
  "deploy",
  "spl-token-metadata-example.sh"
);

const EXAMPLE_KEYPAIR_PATH = path.join(
  __dirname,
  "..",
  "target",
  "deploy",
  "spl_token_metadata_example-keypair.json"
);

const EXAMPLE_KEYPAIR = web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(readFileSync(EXAMPLE_KEYPAIR_PATH).toString()))
);

export const EXAMPLE_PROGRAM_ID = EXAMPLE_KEYPAIR.publicKey;
