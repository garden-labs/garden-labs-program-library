import "dotenv/config";

import path from "path";
import { readFileSync } from "fs";

import toml from "@iarna/toml";
import { web3 } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import expandTilde from "expand-tilde";

// Derive Anchor wallet keypair from Anchor.toml
const tomlStr = readFileSync(
  path.join(__dirname, "..", "..", "Anchor.toml"),
  "utf-8"
);
const parsed = toml.parse(tomlStr);
const anchorWalletPath = parsed.provider.wallet as string;
const anchorWalletPathExpanded = expandTilde(anchorWalletPath);
export const ANCHOR_WALLET_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(readFileSync(anchorWalletPathExpanded).toString()))
);

export const BUILD_ATM_SCRIPT_PATH = path.join(
  __dirname,
  "..",
  "bash",
  "build",
  "advanced-token-metadata.sh"
);

export const DEPLOY_ATM_SCRIPT_PATH = path.join(
  __dirname,
  "..",
  "bash",
  "deploy",
  "advanced-token-metadata.sh"
);

const ATM_KEYPAIR_PATH = path.join(
  __dirname,
  "..",
  "..",
  "target",
  "deploy",
  "advanced_token_metadata-keypair.json"
);

const ATM_KEYPAIR = web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(readFileSync(ATM_KEYPAIR_PATH).toString()))
);

export const ATM_PROGRAM_ID = ATM_KEYPAIR.publicKey;
