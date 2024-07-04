import assert from "assert";

import { workspace, BN, AnchorError } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  getMetadataPointerState,
  getPermanentDelegate,
  getTransferHook,
  getGroupMemberPointerState,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import { setPayer, CONNECTION } from "../../util/js/config";
import { ANCHOR_WALLET_KEYPAIR, ATM_PROGRAM_ID } from "../../util/js/constants";
import { VendingMachine } from "../../target/types/vending_machine";
import { randomStr } from "../../util/js/helpers";
import {
  VENDING_MACHINE_PDA_SEED,
  TREASURY_PUBLIC_KEY,
} from "../js/vending-machine";

describe("Vending Machine", () => {
  const vendingMachineData = Keypair.generate();
  const creator = Keypair.generate();
  const maxSupply = 10000;
  const mintPriceLamports = 0.1 * LAMPORTS_PER_SOL;
  const namePrefix = randomStr(32);
  const symbol = randomStr(10);
  const uriPrefix = randomStr(200);

  const [vendingMachinePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(VENDING_MACHINE_PDA_SEED)],
    setPayer<VendingMachine>(ANCHOR_WALLET_KEYPAIR, workspace.VendingMachine)
      .program.programId
  );

  it("Init fails with invalid name prefix", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    try {
      await program.methods
        .init({
          admin: ANCHOR_WALLET_KEYPAIR.publicKey,
          creator: creator.publicKey,
          maxSupply,
          mintPriceLamports: new BN(mintPriceLamports.toString()),
          namePrefix: randomStr(33),
          symbol,
          uriPrefix,
        })
        .accounts({
          vendingMachineData: vendingMachineData.publicKey,
        })
        .signers([vendingMachineData])
        .rpc();
    } catch (err) {
      if (
        !(
          err instanceof AnchorError &&
          err.error.errorCode.code === "NamePrefixTooLong"
        )
      ) {
        throw err;
      }
    }
  });

  it("Init fails with invalid symbol prefix", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    try {
      await program.methods
        .init({
          admin: ANCHOR_WALLET_KEYPAIR.publicKey,
          creator: creator.publicKey,
          maxSupply,
          mintPriceLamports: new BN(mintPriceLamports.toString()),
          namePrefix,
          symbol: randomStr(11),
          uriPrefix,
        })
        .accounts({
          vendingMachineData: vendingMachineData.publicKey,
        })
        .signers([vendingMachineData])
        .rpc();
    } catch (err) {
      if (
        !(
          err instanceof AnchorError &&
          err.error.errorCode.code === "SymbolTooLong"
        )
      ) {
        throw err;
      }
    }
  });

  it("Init fails with invalid uri prefix", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    try {
      await program.methods
        .init({
          admin: ANCHOR_WALLET_KEYPAIR.publicKey,
          creator: creator.publicKey,
          maxSupply,
          mintPriceLamports: new BN(mintPriceLamports.toString()),
          namePrefix,
          symbol,
          uriPrefix: randomStr(201),
        })
        .accounts({
          vendingMachineData: vendingMachineData.publicKey,
        })
        .signers([vendingMachineData])
        .rpc();
    } catch (err) {
      if (
        !(
          err instanceof AnchorError &&
          err.error.errorCode.code === "UriPrefixTooLong"
        )
      ) {
        throw err;
      }
    }
  });

  it("Init", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    await program.methods
      .init({
        admin: ANCHOR_WALLET_KEYPAIR.publicKey,
        creator: creator.publicKey,
        maxSupply,
        mintPriceLamports: new BN(mintPriceLamports.toString()),
        namePrefix,
        symbol,
        uriPrefix,
      })
      .accounts({
        vendingMachineData: vendingMachineData.publicKey,
      })
      .signers([vendingMachineData])
      .rpc();

    // Check vending machine data
    const v = await program.account.vendingMachineData.fetch(
      vendingMachineData.publicKey
    );
    assert(v.admin.equals(ANCHOR_WALLET_KEYPAIR.publicKey));
    assert(v.creator.equals(creator.publicKey));
    assert.equal(v.maxSupply, maxSupply);
    assert.equal(v.mintPriceLamports, mintPriceLamports);
    assert.equal(v.namePrefix, namePrefix);
    assert.equal(v.symbol, symbol);
    assert.equal(v.uriPrefix, uriPrefix);
  });

  it("Create NFT", async () => {
    const { program } = setPayer<VendingMachine>(
      ANCHOR_WALLET_KEYPAIR,
      workspace.VendingMachine
    );

    const mint = Keypair.generate();
    const metadata = Keypair.generate();

    const preTreasuryBalance = await CONNECTION.getBalance(TREASURY_PUBLIC_KEY);
    const preCreatorBalance = await CONNECTION.getBalance(creator.publicKey);

    await program.methods
      .mintNft(new BN("1"))
      .accounts({
        treasury: TREASURY_PUBLIC_KEY,
        creator: creator.publicKey,
        mint: mint.publicKey,
        metadata: metadata.publicKey,
        receiver: ANCHOR_WALLET_KEYPAIR.publicKey,
        metadataProgram: ATM_PROGRAM_ID,
        vendingMachineData: vendingMachineData.publicKey,
      })
      .signers([mint, metadata])
      .rpc();

    // Check metadata pointer
    const mintInfo = await getMint(
      CONNECTION,
      mint.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    const metadataPointerState = getMetadataPointerState(mintInfo);
    assert(metadataPointerState);
    assert(metadataPointerState.metadataAddress);
    assert(metadataPointerState.metadataAddress.equals(metadata.publicKey));

    // Check group member pointer
    const groupMemberPointerState = getGroupMemberPointerState(mintInfo);
    assert(groupMemberPointerState);
    assert(groupMemberPointerState.authority);
    assert(groupMemberPointerState.authority.equals(vendingMachinePda));
    assert(groupMemberPointerState.memberAddress);
    assert(groupMemberPointerState.memberAddress.equals(mint.publicKey));

    // Check transfer hook
    const transferHook = getTransferHook(mintInfo);
    assert(transferHook);
    assert(transferHook.authority.equals(vendingMachinePda));
    assert(transferHook.programId.equals(program.programId));

    // Check permanent delegate
    const permanentDelegate = getPermanentDelegate(mintInfo);
    assert(permanentDelegate);
    assert(permanentDelegate.delegate.equals(vendingMachinePda));

    // Check token balance
    const anchorWalletAta = await getAssociatedTokenAddress(
      mint.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    const anchorWalletAtaBalance = await CONNECTION.getTokenAccountBalance(
      anchorWalletAta
    );
    assert.equal(anchorWalletAtaBalance.value.amount, 1);

    // Check protocol fees
    const postTreasuryBalance = await CONNECTION.getBalance(
      TREASURY_PUBLIC_KEY
    );
    assert.equal(postTreasuryBalance - preTreasuryBalance, 1_000_000);

    // Check mint price
    const postCreatorBalance = await CONNECTION.getBalance(creator.publicKey);
    assert.equal(postCreatorBalance - preCreatorBalance, mintPriceLamports);

    // TODO: Check mint authority and freeze authority
  });
});
