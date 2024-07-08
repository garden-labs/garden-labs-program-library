# Garden Labs Program Library

Open source Solana smart contracts developed and maintained by Garden Labs.

Full docs: <a href="https://developers.gardenlabs.com/">developers.gardenlabs.com</a>

### Crates

- `field-authority-interface`
  - _Description_: Interface that works in concert with the <a href="https://forum.solana.com/t/srfc-00017-token-metadata-interface/283">Token Metadata Interface</a> which allows field-based update authority.
- `advanced-token-metadata`
  - _Description_: Metadata program forked from the <a href="https://github.com/solana-labs/solana-program-library/tree/master/token-metadata/example">SPL example</a> with the Field Authority Interface implemented.
  - _Program ID_: `2GkHVZ2y5wP4nw4uA2GWFnc7jphfjKbbcEKwqMCV42a6`
  - _Solana Verify Hash_: `3ab29b35f23e9e14135753715953c2f2a1ee5df065ffc177c39d2589fb71e49e`
- `holder-metadata-plugin`
  - _Description_: Program which acts as a field authority and checks token ownership before updating metadata.
  - _Program ID_: `3DkEmKWuBJbza9ur1BnVVhXrzkuiMCqBuKHdoDBdLpxZ`
  - _Solana Verify Hash_: `a11a4b4090d11a1b50a2005b048ecbe37b84bf4c808198700babd0ca3a722341`
- `ai-aliens`
  - _Description_: Example PFP NFT collection which uses the programs above to enable token holders to give their NFTs' nicknames.
  - _Program ID_: `48MKwUN9uxxGrFCzXAV4kF5RPMVUyruLyYnapNynNtd4`
  - _Solana Verify Hash_: `81294793bddaeafbff5dd22af361eeb6ece5870caedd32877e82c0c8f2657ead`
- `vending-machine`
  - In development.

### Getting Started

- Replace the `wallet` path in `Anchor.toml` with the path to your system's wallet
- Create `.env` file based on `.env.example`
- Run `yarn build`
- Replace `METADATA_PROGRAM_ID_STR` in `ai-aliens/program/src/constant` with the generated program ID
- Test on local validator with `yarn scripts/test:localnet`
- Test on Devnet with `yarn scripts/test:devnet:redeploy`

### Roadmap

- Release `vending-machine` with example collection
- Migrate `field-authority-interface` from PDAs to single TLV account model

### Licensing

This project contains multiple licenses. Refer to the innermost LICENSE document for each file. The top-level license is an open source Apache License.
