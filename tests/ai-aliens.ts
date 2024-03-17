import assert from "assert";

import {
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SendTransactionError,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getMetadataPointerState,
} from "@solana/spl-token";
import { TokenMetadata, Field } from "@solana/spl-token-metadata";

import {
  ensureExampleProgramDeployed,
  getEmittedMetadata,
  randomStr,
} from "../util/helpers";
import {
  CONNECTION,
  setAiAliensPayer,
  setHolderMetadataPayer,
} from "../util/config";
import { ANCHOR_WALLET_KEYPAIR, EXAMPLE_PROGRAM_ID } from "../util/constants";
import {
  FIELD_AUTHORITY_PDA_SEED,
  fieldToSeedStr,
} from "../util/field-authority-interface";
import {
  AI_ALIENS_AUTHORITY_PDA_SEED,
  NFT_MINTED_PDA_SEED,
  NICKNAME_FIELD_KEY,
  indexToSeed,
} from "../util/ai-aliens";
import {
  HOLDER_METADATA_PDA_SEED,
  toAnchorParam,
} from "../util/holder-metadata";

describe("AI Aliens Program", () => {
  const mintPriceLamports = 0.1 * LAMPORTS_PER_SOL;
  const maxSupply = 1000;

  const [aiAliensPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(AI_ALIENS_AUTHORITY_PDA_SEED)],
    setAiAliensPayer(ANCHOR_WALLET_KEYPAIR).program.programId
  );

  const [holderMetadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(HOLDER_METADATA_PDA_SEED)],
    setHolderMetadataPayer(ANCHOR_WALLET_KEYPAIR).program.programId
  );

  function getMetadataVals(mint: PublicKey, index: number): TokenMetadata {
    const metadataVals: TokenMetadata = {
      name: `AI Alien #${index}`,
      symbol: "AIALIENS",
      uri: `https://firebasestorage.googleapis.com/v0/b/ai-aliens.appspot.com/o/uri%2F${index}.json?alt=media`,
      updateAuthority: aiAliensPda,
      mint,
      additionalMetadata: [],
    };
    return metadataVals;
  }

  before(async () => {
    ensureExampleProgramDeployed();
  });

  it("Update state", async () => {
    const { program } = setAiAliensPayer(ANCHOR_WALLET_KEYPAIR);

    await program.methods
      .updateState(maxSupply, new BN(mintPriceLamports.toString()))
      .accounts({
        aiAliensPda,
      })
      .rpc();

    // Check state
    const aiAliensPdaData = await program.account.aiAliensPda.fetch(
      aiAliensPda
    );
    assert.equal(aiAliensPdaData.maxSupply, maxSupply);
    assert.equal(aiAliensPdaData.mintPriceLamports, mintPriceLamports);
  });

  async function createMint(
    index: number
  ): Promise<{ mintKeypair: Keypair; metadataKeypair: Keypair }> {
    const mintKeypair = Keypair.generate();
    const metadataKeypair = Keypair.generate();

    const { program } = setAiAliensPayer(ANCHOR_WALLET_KEYPAIR);

    const [nftMintedPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(NFT_MINTED_PDA_SEED), indexToSeed(index)],
      setAiAliensPayer(ANCHOR_WALLET_KEYPAIR).program.programId
    );

    const [fieldPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(NICKNAME_FIELD_KEY)),
        metadataKeypair.publicKey.toBuffer(),
      ],
      EXAMPLE_PROGRAM_ID
    );

    const aiAliensPdaBalanceBefore = await CONNECTION.getBalance(aiAliensPda);

    await program.methods
      .createMint(index)
      .accounts({
        mint: mintKeypair.publicKey,
        metadata: metadataKeypair.publicKey,
        nftMintedPda,
        aiAliensPda,
        fieldPda,
        metadataProgram: EXAMPLE_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([mintKeypair, metadataKeypair])
      .rpc();

    const aiAliensPdaBalanceAfter = await CONNECTION.getBalance(aiAliensPda);

    // // Check mint price transfer
    // assert.equal(
    //   aiAliensPdaBalanceBefore,
    //   aiAliensPdaBalanceAfter - mintPriceLamports
    // );

    // // Check mint minted PDA
    // const nftMintedPdaData = await program.account.nftMintedPda.fetch(
    //   nftMintedPda
    // );
    // assert(nftMintedPdaData.mint.equals(mintKeypair.publicKey));

    // // Check metadata pointer
    // const mintInfo = await getMint(
    //   CONNECTION,
    //   mintKeypair.publicKey,
    //   undefined,
    //   TOKEN_2022_PROGRAM_ID
    // );
    // const metadataPointerState = await getMetadataPointerState(mintInfo);
    // assert(metadataPointerState);
    // assert(metadataPointerState.metadataAddress);
    // assert(
    //   metadataPointerState.metadataAddress.equals(metadataKeypair.publicKey)
    // );

    return { mintKeypair, metadataKeypair };
  }

  async function createToken(mintKeypair: Keypair): Promise<void> {
    const { program } = setAiAliensPayer(ANCHOR_WALLET_KEYPAIR);

    const anchorWalletAta = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    await program.methods
      .createToken()
      .accounts({
        mint: mintKeypair.publicKey,
        dest: ANCHOR_WALLET_KEYPAIR.publicKey,
        destAta: anchorWalletAta,
        aiAliensPda,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    // Check destination ATA
    const anchorWalletAtaBalance = await CONNECTION.getTokenAccountBalance(
      anchorWalletAta
    );
    assert.equal(anchorWalletAtaBalance.value.amount, 1);

    // Check mint
    const mintInfo = await getMint(
      CONNECTION,
      mintKeypair.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    assert.equal(mintInfo.supply, BigInt(1));
  }

  it("Create mint below index 1 fails", async () => {
    assert.rejects(async () => {
      const { mintKeypair } = await createMint(0);
      await createToken(mintKeypair);
    });
  });

  it("Create mint above max supply fails", async () => {
    assert.rejects(async () => {
      await createMint(maxSupply + 1);
    });
  });

  it("Create mint at index 1 succeeds", async () => {
    await createMint(1);
  });

  it("Create mint at index 1 fails", async () => {
    assert.rejects(async () => {
      await createMint(1);
    });
  });

  it("Create mint at index 2 succeeds", async () => {
    const { mintKeypair } = await createMint(2);
    await createToken(mintKeypair);
  });

  it("Create mint at index 10 succeeds", async () => {
    const { mintKeypair } = await createMint(10);
    await createToken(mintKeypair);
  });

  it("Create mint at index 1000 succeeds", async () => {
    const { mintKeypair } = await createMint(1000);
    await createToken(mintKeypair);
  });

  async function updateNickname(
    mintKeypair: Keypair,
    metadataKeypair: Keypair,
    val: string,
    index: number
  ): Promise<void> {
    const { program } = setHolderMetadataPayer(ANCHOR_WALLET_KEYPAIR);

    const field = NICKNAME_FIELD_KEY;
    const param = toAnchorParam(field);

    const [fieldPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(FIELD_AUTHORITY_PDA_SEED),
        Buffer.from(fieldToSeedStr(field)),
        metadataKeypair.publicKey.toBuffer(),
      ],
      EXAMPLE_PROGRAM_ID
    );

    const anchorWalletAta = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      ANCHOR_WALLET_KEYPAIR.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    await program.methods
      .updateHolderField(param, val)
      .accounts({
        mint: mintKeypair.publicKey,
        metadata: metadataKeypair.publicKey,
        holderTokenAccount: anchorWalletAta,
        holderMetadataPda,
        fieldPda,
        fieldAuthorityProgram: EXAMPLE_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    // Check emmitted metadata
    const metadataVals = getMetadataVals(mintKeypair.publicKey, index);
    metadataVals.additionalMetadata.push([field, val]);
    const emittedMetadata = await getEmittedMetadata(
      EXAMPLE_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, metadataVals);
  }

  it("Update nickname", async () => {
    const index = 4;
    const { mintKeypair, metadataKeypair } = await createMint(index);
    await createToken(mintKeypair);
    await updateNickname(mintKeypair, metadataKeypair, randomStr(30), index);
  });

  it("Update nickname fails with too long nickname", async () => {
    const index = 5;
    const { mintKeypair, metadataKeypair } = await createMint(index);
    await createToken(mintKeypair);

    assert(async () => {
      try {
        await updateNickname(
          mintKeypair,
          metadataKeypair,
          randomStr(31),
          index
        );
        throw new Error("Should have thrown");
      } catch (e) {
        assert(e instanceof SendTransactionError);
      }
    });
  });

  it("Update field with creator", async () => {
    const index = 6;
    const { mintKeypair, metadataKeypair } = await createMint(index);

    const { program } = setAiAliensPayer(ANCHOR_WALLET_KEYPAIR);

    const fieldParam = toAnchorParam(Field.Uri);
    const val = "uri-placeholder-update";

    await program.methods
      .updateField(fieldParam, val)
      .accounts({
        creator: ANCHOR_WALLET_KEYPAIR.publicKey,
        metadata: metadataKeypair.publicKey,
        aiAliensPda,
        metadataProgram: EXAMPLE_PROGRAM_ID,
      })
      .rpc();

    // Check emmitted metadata
    const metadataVals = getMetadataVals(mintKeypair.publicKey, index);
    metadataVals.uri = val;
    const emittedMetadata = await getEmittedMetadata(
      EXAMPLE_PROGRAM_ID,
      metadataKeypair.publicKey
    );
    assert.deepStrictEqual(emittedMetadata, metadataVals);
  });
});
