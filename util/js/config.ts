import "dotenv/config";

import {
  AnchorProvider,
  setProvider,
  Wallet,
  Program,
  Idl,
} from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";

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

export function setPayer<T extends Idl>(
  payer: Keypair,
  prog: Program<T>
): {
  provider: AnchorProvider;
  program: Program<T>;
} {
  const provider = setProv(payer);

  const program = new Program(prog.idl, provider);

  return { provider, program };
}
