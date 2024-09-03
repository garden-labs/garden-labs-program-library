import "dotenv/config";

import path from "path";
import { readFileSync } from "fs";

import toml from "@iarna/toml";
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
