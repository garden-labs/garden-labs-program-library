# Example: AI Aliens

<div style="margin-top: 20px; margin-bottom: 20px;">
    <div style="display: flex;">
        <img src="/13.png" width="50%" />
        <img src="/76.png" width="50%" />
    </div>
</div>

We'll now show how all these pieces work together with our PFP collection, **AI Aliens**. On <a href="https://www.ai-aliens.xyz/" target="blank">www.ai-alienx.xyz</a>, users can mint aliens and update their metadata giving them nicknames. Go ahead and give it a try if you'd like to reward Garden Labs for this content and be whitelisted for our upcoming projects!

AI Aliens does three things: it 1) forks the <a href="https://github.com/solana-labs/solana-program-library/tree/master/token-metadata/example" target="blank">example metadata program</a> from Solana's Program Library, 2) implements the Field Authority Interface, and 3) assigns the Holder Metadata Program as a field authority for `nickname`.

Here's the client code example for updating an alien's nickname:

```
async function updateNickname(): Promise<void> {
    // Grab accounts ...

    await program.methods
        .updateHolderField(param, val)
        .accounts({
            mint,
            metadata,
            holderTokenAccount,
            holderMetadataPda,
            fieldPda,
            fieldAuthorityProgram: EXAMPLE_PROGRAM_ID,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

    // Check new emmitted metadata ...
}
```

<div style="text-align: right">
    <a href="https://github.com/garden-labs/holder-metadata/blob/main/tests/ai-aliens.ts" target="blank">source code</a>
</div>

As you can see, we're actually just making a call to the Holder Metadata Program – no code was needed from the AI Aliens collection. If you're developing an NFT project, you can use these same programs and add holder-editable fields with very little work!
