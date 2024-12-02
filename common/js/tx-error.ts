/**
 * TODO: Break into multiple classes with inheritance
 * TODO: Add code, message, logs, and cause to error object
 */
export enum InterpretedTxErrType {
  Unknown = "Unknown",
  InsufficientFunds = "InsufficientFunds",
  AllocateAccountAlreadyInUse = "AllocateAccountAlreadyInUse",
}

export class InterpretedTxErr extends Error {
  public type: InterpretedTxErrType;

  constructor(type: InterpretedTxErrType) {
    super("Interpreted transaction error");
    this.name = "InterpretedTxError";
    this.type = type;
  }
}

/**
 * TODO: Add typing to params, distinguish between Anchor and regular errors
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function interpretTxErr(err: any): InterpretedTxErr {
  if (!err) {
    return new InterpretedTxErr(InterpretedTxErrType.Unknown);
  }

  // Interpret from message
  if (typeof err.message === "string") {
    if (
      err.message.includes(
        "Attempt to debit an account but found no record of a prior credit."
      )
    ) {
      return new InterpretedTxErr(InterpretedTxErrType.InsufficientFunds);
    }
  }

  // Interpret from logs
  if (Array.isArray(err.logs)) {
    const logStr = JSON.stringify(err.logs);
    if (
      logStr.includes("insufficient lamports") ||
      logStr.includes("insufficient funds")
    ) {
      return new InterpretedTxErr(InterpretedTxErrType.InsufficientFunds);
    }

    if (
      logStr.includes("Allocate: account Address") &&
      logStr.includes("already in use")
    ) {
      return new InterpretedTxErr(
        InterpretedTxErrType.AllocateAccountAlreadyInUse
      );
    }
  }

  return new InterpretedTxErr(InterpretedTxErrType.Unknown);
}
