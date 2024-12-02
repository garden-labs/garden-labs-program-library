import crypto from "crypto";

import {
  TransactionInstruction,
  PublicKey,
  SystemProgram,
  Connection,
} from "@solana/web3.js";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function randomStr(numChars: number): string {
  return crypto.randomBytes(numChars).toString("hex").slice(0, numChars);
}

/**
 * @returns null if account already has enough lamports to meet rent exemption
 */
export async function getReachMinRentTx(
  connection: Connection,
  payer: PublicKey,
  account: PublicKey,
  minRent: number
): Promise<TransactionInstruction | null> {
  let currentRent = 0;
  const accountInfo = await connection.getAccountInfo(account);
  if (accountInfo) {
    currentRent = accountInfo.lamports;
  }

  if (currentRent >= minRent) {
    return null;
  }

  return SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: account,
    lamports: minRent - currentRent,
  });
}
