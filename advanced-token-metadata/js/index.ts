import path from "path";
import { readFileSync } from "fs";

import { Keypair } from "@solana/web3.js";
import appRoot from "app-root-path";

const ATM_KEYPAIR_PATH = path.join(
  appRoot.path,
  "target",
  "deploy",
  "advanced_token_metadata-keypair.json"
);

const ATM_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(readFileSync(ATM_KEYPAIR_PATH).toString()))
);

export const ATM_PROGRAM_ID = ATM_KEYPAIR.publicKey;
