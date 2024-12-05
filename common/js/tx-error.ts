export class TxErr extends Error {}
export class InsufficientFundsTxErr extends TxErr {}

export function parseForTxErr(err: unknown): TxErr | null {
  // Parse message
  if (err && typeof err === "object") {
    if ("message" in err && typeof err.message === "string") {
      if (
        err.message.includes(
          "Attempt to debit an account but found no record of a prior credit."
        )
      ) {
        return new InsufficientFundsTxErr();
      }
    }

    // Parse logs
    if ("logs" in err && Array.isArray(err.logs)) {
      const logStr = JSON.stringify(err.logs);
      if (
        logStr.includes("insufficient lamports") ||
        logStr.includes("insufficient funds")
      ) {
        return new InsufficientFundsTxErr();
      }
    }
  }

  return null;
}
