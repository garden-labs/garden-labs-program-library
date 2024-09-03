import "dotenv/config";

import path from "path";
import { readFileSync } from "fs";

import toml from "@iarna/toml";
import { web3 } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import expandTilde from "expand-tilde";
import appRoot from "app-root-path";

// Derive Anchor wallet keypair from Anchor.toml
const ANCHOR_TOML_JSON = toml.parse(
  readFileSync(path.join(appRoot.path, "Anchor.toml"), "utf-8")
);
const ANCHOR_WALLET_PATH = expandTilde(
  (ANCHOR_TOML_JSON.provider as { wallet: string }).wallet
);
export const ANCHOR_WALLET_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(readFileSync(ANCHOR_WALLET_PATH).toString()))
);

export const BUILD_ATM_SCRIPT_PATH = path.join(
  appRoot.path,
  "util",
  "bash",
  "build",
  "advanced-token-metadata.sh"
);

export const DEPLOY_ATM_SCRIPT_PATH = path.join(
  appRoot.path,
  "util",
  "bash",
  "deploy",
  "advanced-token-metadata.sh"
);

const ATM_KEYPAIR_PATH = path.join(
  appRoot.path,
  "target",
  "deploy",
  "advanced_token_metadata-keypair.json"
);

const ATM_KEYPAIR = web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(readFileSync(ATM_KEYPAIR_PATH).toString()))
);

export const ATM_PROGRAM_ID = ATM_KEYPAIR.publicKey;
