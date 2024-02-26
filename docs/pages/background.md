# Background

### Token2022

<a href="https://spl.solana.com/token-2022" target="blank">Token-2022</a> is the next generation of Solana's SPL token (similar to Ethereum's ERC-20 token). Notably, it natively supports a vast array of new functionality due to its **Extensions** framework, such as confidential transfers, soulbound tokens, and **new NFT programs** via the <a href="https://forum.solana.com/t/srfc-00017-token-metadata-interface/283" target="blank">Token Metadata Interface</a>.

### Token Metadata Interface

<img src="/freedom.gif" width="400px" style="margin: 20px auto;"/>

Previously, Solana NFTs only operated through Metaplex's on-chain programs. This allowed Solana's NFT ecosystem to blossom faster than anyone imagined. But in the long-run, the key primative of web3 cannot exist in a single program. NFTs will underpin domain names, user profiles, social graphs, digital real estate, and more. NFT projects will have different needs, and developers need to be able to **permissionlessly innovate** on features.

In CS101, you learn that when different programs need to operate together but maintain separate features and implementations, you build an _interface_. Enter the Token Metadata Interface – Solana's interface for NFTs. The interface describes a set of instructions and accounts that your metadata program needs to implement:

```
pub fn initialize(
    program_id: &Pubkey,
    metadata: &Pubkey,
    update_authority: &Pubkey,
    mint: &Pubkey,
    mint_authority: &Pubkey,
    name: String,
    symbol: String,
    uri: String,
) -> Instruction { ... }

pub fn update_field(
    program_id: &Pubkey,
    metadata: &Pubkey,
    update_authority: &Pubkey,
    field: Field,
    value: String,
) -> Instruction { ... }

pub fn remove_key(
    program_id: &Pubkey,
    metadata: &Pubkey,
    update_authority: &Pubkey,
    key: String,
    idempotent: bool,
) -> Instruction { ... }

pub fn update_authority(
    program_id: &Pubkey,
    metadata: &Pubkey,
    current_authority: &Pubkey,
    new_authority: OptionalNonZeroPubkey,
) -> Instruction { ... }

pub fn emit(
    program_id: &Pubkey,
    metadata: &Pubkey,
    start: Option<u64>,
    end: Option<u64>,
) -> Instruction { ... }
```

<div style="text-align: right">
    <a href="https://github.com/solana-labs/solana-program-library/blob/9ddfe54cc051759f1c619aecf7ba31d93f28d846/token-metadata/interface/src/instruction.rs#L229" target="blank">source code</a>
</div>

The implementation details are now up to you. As long as you support these instructions, your NFT program will interoperate with marketplaces, dapps, etc. You are free to innovate as you wish!

### Additional Interfaces

There is a slight wrinkle to this all.

Solana is built to be the most performant blockchain in the world. Every level of the stack is optimized to be as fast as possible. One major optimization that separates Solana from other blockchains is the requirement that all instructions first mark all data (ie. accounts) that they might read or write to. This allows validators to parallelize transactions that don't touch the same data. The performance boost is worth it, but it adds a slight rigidity to interfaces. Back to CS101, it's as if you're given an interface that not only specifies function names and parameters, but all internal variables as well. There is room to wiggle and do different things, but it's limited.

Luckily, there is a solution to this wrinkle, and it's the same solution as before... Now that we're no longer locked into Metaplex's program, we can add **_more interfaces_**.

<img src="/more-interfaces.png" width="400px" style="margin: 20px auto;"/>

We can write additional instructions that operate on the **_same metadata_**. Dapps can adopt whatever interfaces become popular that fit their needs. NFT marketplaces may not need to support the editing of metadata, but do need to support displaying it along with marketplace actions.

Next, we'll take you through the Field Authority Interface that we've developed to make Holder Metadata possible.
