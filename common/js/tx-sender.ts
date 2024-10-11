import {
  Keypair,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  AddressLookupTableAccount,
  SimulatedTransactionResponse,
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  Connection,
} from "@solana/web3.js";

import { interpretTxErr, InterpretedTxErrType } from "./tx-error";
import { sleep } from "./helpers";

function getPrioFeesIxs(
  computeUnitPrice: number,
  computeUnitLimit: number
): TransactionInstruction[] {
  return [
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: computeUnitPrice,
    }),
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnitLimit,
    }),
  ];
}

function calcMaxCuPrice(prioFeesLamports: number, cuLimit: number): number {
  return Math.floor((prioFeesLamports * 1_000_000) / cuLimit);
}

/**
 * @param bh Helps speed up transaction creation for bundling
 */
async function createV0Tx(
  connection: Connection,
  ixs: TransactionInstruction[],
  payer: PublicKey,
  prioFees?: { cuPrice: number; cuLimit: number },
  lookupTableAccounts?: AddressLookupTableAccount[],
  bh:
    | { blockhash: string; lastValidBlockHeight: number }
    | undefined = undefined
): Promise<{ v0Tx: VersionedTransaction; lastValidBlockHeight: number }> {
  // Grab blockhash, lastValidBlockHeight
  const { blockhash, lastValidBlockHeight } =
    bh || (await connection.getLatestBlockhash());

  const msgIxs = [...ixs];
  if (prioFees) {
    msgIxs.unshift(...getPrioFeesIxs(prioFees.cuPrice, prioFees.cuLimit));
  }
  // Create and sign versioned transaction
  const msg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: msgIxs,
  }).compileToV0Message(lookupTableAccounts);
  const v0Tx = new VersionedTransaction(msg);

  return { v0Tx, lastValidBlockHeight };
}

async function simWithRetry(
  connection: Connection,
  v0Tx: VersionedTransaction,
  lastValidBlockHeight: number,
  requireCu: boolean,
  verifySigs: boolean
): Promise<SimulatedTransactionResponse> {
  let blockHeight = 0;
  while (blockHeight < lastValidBlockHeight) {
    const res = // eslint-disable-next-line no-await-in-loop
      (await connection.simulateTransaction(v0Tx, { sigVerify: verifySigs }))
        .value; // Will throw error as well
    if (res && res.err === "BlockhashNotFound") {
      console.error("Blockhash not found during simulation");
    } else if (!res || res.err) {
      console.log(res);
      const interpretedTxErr = interpretTxErr({
        message: res.err,
        logs: res.logs,
      });
      if (interpretedTxErr.type !== InterpretedTxErrType.Unknown) {
        throw interpretedTxErr;
      } else {
        throw new Error(`Simulation failed: ${JSON.stringify(res)}`);
      }
    } else if (requireCu && !res.unitsConsumed) {
      console.error("CU required but not found during simulation");
    } else {
      return res;
    }

    console.log("Retrying simulation...");
    sleep(200); // To avoid throttling
    // eslint-disable-next-line no-await-in-loop
    blockHeight = await connection.getBlockHeight();
  }

  throw new Error("Simulation with retry failed: Blockhash expired");
}

async function createOptimizedV0Tx(
  connection: Connection,
  ixs: TransactionInstruction[],
  payer: PublicKey,
  prioFeesLamports?: number,
  lookupTableAccounts?: AddressLookupTableAccount[]
): Promise<{ v0Tx: VersionedTransaction; lastValidBlockHeight: number }> {
  console.log("Creating transaction...");
  let { v0Tx, lastValidBlockHeight } = await createV0Tx(
    connection,
    ixs,
    payer,
    prioFeesLamports ? { cuPrice: 0, cuLimit: 1_000_000 } : undefined, // Temporary just to get the CU values
    lookupTableAccounts
  );

  console.log("Optimizing priority fees...");
  if (prioFeesLamports) {
    console.log("Simulating for CU limit...");
    const simRes = await simWithRetry(
      connection,
      v0Tx,
      lastValidBlockHeight,
      !!prioFeesLamports,
      false
    );

    // Replace priority fees with maximized price, minimized limit
    const cuBuffer = 1.2;
    const cuLimit = simRes.unitsConsumed! * cuBuffer;
    const cuPrice = calcMaxCuPrice(prioFeesLamports, cuLimit);
    ({ v0Tx, lastValidBlockHeight } = await createV0Tx(
      connection,
      ixs,
      payer,
      { cuPrice, cuLimit },
      lookupTableAccounts
    ));
  }

  return { v0Tx, lastValidBlockHeight };
}

async function broadcastAndConf(
  connection: Connection,
  rawTx: Uint8Array,
  blockhash: string,
  lastValidBlockHeight: number
): Promise<string> {
  // Send transaction
  let intervalId: NodeJS.Timeout | undefined;
  try {
    const sig = await connection.sendRawTransaction(rawTx, {
      maxRetries: 5,
      skipPreflight: true, // Simulation should occur before this method
    });
    console.log("Sig:", sig);

    // Rebroadcast every 30 seconds
    const rebroadcastInterval = 30 * 1000; // 30 seconds
    intervalId = setInterval(async () => {
      console.log("Rebroadcasting...");
      await connection.sendRawTransaction(rawTx, {
        maxRetries: 5,
        skipPreflight: true,
      });
    }, rebroadcastInterval);

    // Confirm transaction
    console.log("Confirming...");
    const confirmation = await connection.confirmTransaction({
      signature: sig,
      blockhash,
      lastValidBlockHeight,
    });
    if (confirmation.value.err) {
      throw new Error(`${confirmation.value.err.toString()}`);
    }

    console.log(`Transaction confirmed: https://explorer.solana.com/tx/${sig}`);
    return sig;
  } catch (err) {
    console.error("Confirmation Error:", err);
    throw err;
  } finally {
    // Stop rebroadcasting for this transaction
    clearInterval(intervalId);
  }
}

async function simSignSignAndConf(
  connection: Connection,
  v0Tx: VersionedTransaction,
  lastValidBlockHeight: number,
  signTransaction?:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T
      ) => Promise<T>)
    | undefined,
  signers?: Keypair[]
): Promise<string> {
  console.log("Signing...");
  if (signers) {
    v0Tx.sign(signers);
  }
  const signedTx = signTransaction ? await signTransaction(v0Tx) : v0Tx;

  console.log("Simulating for validity...");
  await simWithRetry(connection, signedTx, lastValidBlockHeight, false, true);

  console.log("Serializing...");
  const rawTx = signedTx.serialize();

  console.log("Sending...");
  const sig = await broadcastAndConf(
    connection,
    rawTx,
    signedTx.message.recentBlockhash,
    lastValidBlockHeight
  );
  return sig;
}

export async function optimizeSimSignSendAndConf(
  connection: Connection,
  ixs: TransactionInstruction[],
  payer: PublicKey,
  signTransaction?:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T
      ) => Promise<T>)
    | undefined,
  signers?: Keypair[],
  prioFeesLamports?: number,
  lookupTableAccounts?: AddressLookupTableAccount[],
  retries = 5
): Promise<string> {
  console.log("Creating transaction...");
  const { v0Tx, lastValidBlockHeight } = await createOptimizedV0Tx(
    connection,
    ixs,
    payer,
    prioFeesLamports,
    lookupTableAccounts
  );

  try {
    const sig = await simSignSignAndConf(
      connection,
      v0Tx,
      lastValidBlockHeight,
      signTransaction,
      signers
    );
    return sig;
  } catch (err) {
    console.error("Confirmation Error:", err);
    if (!signTransaction && retries > 0) {
      console.log("Retrying...");
      return optimizeSimSignSendAndConf(
        connection,
        ixs,
        payer,
        signTransaction,
        signers,
        undefined, // We've already set them
        lookupTableAccounts,
        retries - 1
      );
    }
    throw err;
  }
}
