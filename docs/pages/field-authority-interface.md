# Field Authority Interface

In order to implement holder-editable metadata, we've built a new interface that works in concert with the Token Metadata Interface: the <a href="" target="">Field Authority Interface</a>

The Token Metadata Interface only has a single update authority. If you want grant write access to a user for a specific field, you must grant write access to _all fields_. This limitation exists in Metaplex's program as well, and it's unworkable for NFT utility. For example, in our <a href="/pages/ai-aliens">AI Aliens</a> collection, we want users to be able to assign nicknames and special characteristics to their alien, but not change the NFT's name or image. Doing so would confuse other users and lose the asset's value.

The Field Authority Interface enables metadata programs to grant write access to public keys for specific fields only. These **field authorities** can be basic user keypairs or PDAs of programs that implement their own unique logic. Here are the new instructions:

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

<div style="text-align: right">
    <a href="https://github.com/garden-labs/holder-metadata/blob/2293bb41989b0d69e127df51ee540949b6f6d259/programs-vanilla/field-authority-interface/src/instruction.rs#L95" target="blank">source code</a>
</div>

This interface is meant to work in concert with the Token Metadata Interface. The `update_authority` is the same as the Token Metadata Interface's update authority, and it holds the ability to assign an extra `field_authority` to each field.

<img src="/field-authority-interface-diagram.png" width="100%" style="margin: 20px auto;"/>

Next, we'll show you how the Holder Metadata Program functions as a field authority allowing token holders to edit specific fields.
