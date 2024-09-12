import "dotenv/config";

import {
  AnchorProvider,
  setProvider,
  Wallet,
  Program,
  Idl,
} from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";

// NOTE: Returning the same connection object helps prevent "transaction already
// processed" errors in tests
let connection: Connection;
const commitmentLevel = "confirmed";
export function getConnection(): Connection {
  if (connection) {
    return connection;
  }

  connection = new Connection(
    AnchorProvider.env().connection.rpcEndpoint,
    commitmentLevel
  );

  return connection;
}

function setProv(payer: Keypair): AnchorProvider {
  const provider = new AnchorProvider(getConnection(), new Wallet(payer), {
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
