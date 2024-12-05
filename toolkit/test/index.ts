import assert from "assert";

import { describe, it, beforeAll } from "vitest";
import { workspace } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createMint,
  TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";

import { setPayer, ANCHOR_WALLET_KEYPAIR, getConnection } from "../../test";
import { Toolkit } from "../../target/types/toolkit";

describe("toolkit", () => {
  const mint = Keypair.generate();

  beforeAll(async () => {
    await createMint(
      getConnection(),
      ANCHOR_WALLET_KEYPAIR,
      mint.publicKey,
      null,
      6,
      mint
    );
  });

  async function initIfNeeded(): Promise<void> {
    const { program } = setPayer<Toolkit>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.toolkit
    );

    await program.methods
      .initIfNeeded()
      .accounts({
        user: ANCHOR_WALLET_KEYPAIR.publicKey,
        mint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Verify the ATA was created
    const ata = await getAssociatedTokenAddress(
      mint.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey
    );
    const ataInfo = await getAccount(getConnection(), ata);
    assert(ataInfo.mint.equals(mint.publicKey));
    assert(ataInfo.owner.equals(ANCHOR_WALLET_KEYPAIR.publicKey));
  }

  it("Init if needed, needed", async () => {
    await initIfNeeded();
  });

  it("Init if needed, not needed", async () => {
    await initIfNeeded();
  });
});
