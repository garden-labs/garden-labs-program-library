# Field Authority Interface

In order to implement holder-editable metadata, we've built a new interface that works in concert with the Token Metadata Interface: the <a href="" target="">Field Authority Interface</a>

The Token Metadata Interface has a single update authority. If you want grant write access to another user for a specific field, you must grant write access to _all fields_. This limitation exists in Metaplex's program as well. This state of affairs is unworkable for NFT utility. For example, in our <a href="/pages/ai-aliens">AI Aliens</a> collection, we want users to be able to assign nicknames and special characteristics to their aliens, but not change the NFT name or image. Doing so would confuse other users and lose the assets' value.

We've implemented two new instructions that allow metadata programs to assign specific public keys as **field authorities**. These accounts can be basic user keypairs or PDAs of programs that implement their own unique logic for field updating.

```
pub fn add_field_authority(
    program_id: &Pubkey,
    payer: &Pubkey,
    metadata: &Pubkey,
    update_authority: &Pubkey,
    field: Field,
    field_authority: &Pubkey,
) -> Instruction { ... }

pub fn update_field_with_field_authority(
    program_id: &Pubkey,
    metadata: &Pubkey,
    field_authority: &Pubkey,
    field: Field,
    value: String,
) -> Instruction { ... }
```

This interface is meant to work in concert with the Token Metadata Interface. The `update_authority` is the same as the Token Metadata Interface update authority, and it holds the ability to assign an extra `field_authority` to each field.

Next, we'll show you how the Holder Metadata Program functions as a field authority to allow token holders to edit metadata.
