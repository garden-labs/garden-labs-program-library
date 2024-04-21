import { SendTransactionError } from "@solana/web3.js";

export enum InterpretedTxErr {
  Unknown,
  InsufficientFunds,
}

export function interpretTxErr(err: unknown): InterpretedTxErr {
  if (err instanceof SendTransactionError) {
    if (
      err.message.includes(
        "Attempt to debit an account but found no record of a prior credit."
      )
    ) {
      return InterpretedTxErr.InsufficientFunds;
    }

    const logStr = JSON.stringify(err.logs);
    if (
      logStr.includes("insufficient lamports") ||
      logStr.includes("insufficient funds")
    ) {
      return InterpretedTxErr.InsufficientFunds;
    }
  }

  return InterpretedTxErr.Unknown;
}
