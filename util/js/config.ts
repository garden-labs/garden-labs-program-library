import "dotenv/config";

import {
  AnchorProvider,
  setProvider,
  Wallet,
  Program,
  Idl,
  workspace,
} from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";

import { HolderMetadataPlugin } from "../../target/types/holder_metadata_plugin";
import { AiAliens } from "../../target/types/ai_aliens";

const commitmentLevel = "confirmed";

let connection;
switch (process.env.TEST_ENV) {
  case "mainnet":
    connection = new Connection(
      process.env.SOLANA_MAINNET_RPC as string,
      commitmentLevel
    );
    break;
  case "devnet":
    connection = new Connection(
      process.env.SOLANA_DEVNET_RPC as string,
      commitmentLevel
    );
    break;
  case "localnet":
    connection = new Connection(
      AnchorProvider.env().connection.rpcEndpoint,
      commitmentLevel
    );
    break;
  default:
    throw new Error("TEST_ENV not set");
}
export const CONNECTION = connection;

function setProv(payer: Keypair): AnchorProvider {
  const provider = new AnchorProvider(CONNECTION, new Wallet(payer), {
    commitment: commitmentLevel,
  });
  setProvider(provider);
  return provider;
}

function setPayer<T extends Idl>(
  payer: Keypair,
  prog: Program<T>
): {
  provider: AnchorProvider;
  program: Program<T>;
} {
  const provider = setProv(payer);

  const program = new Program(prog.idl, prog.programId, provider);

  return { provider, program };
}

// TODO: Move these to test files
// TEMP to get values below
if (process.env.TEST_ENV !== "localnet") {
  setProv(Keypair.generate());
}
const aliensProgram = workspace.AiAliens as Program<AiAliens>;
const holderMetadataPluginProgram =
  workspace.HolderMetadataPlugin as Program<HolderMetadataPlugin>;

export function setHolderMetadataPayer(payer: Keypair): {
  provider: AnchorProvider;
  program: Program<HolderMetadataPlugin>;
} {
  return setPayer(payer, holderMetadataPluginProgram);
}

export function setAiAliensPayer(payer: Keypair): {
  provider: AnchorProvider;
  program: Program<AiAliens>;
} {
  return setPayer(payer, aliensProgram);
}
