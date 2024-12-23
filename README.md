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
  - _Description_: Example PFP <a href="https://www.ai-aliens.xyz/">NFT collection</a> which uses the programs above to enable token holders to give their NFTs' nicknames.
  - _Program ID_: `48MKwUN9uxxGrFCzXAV4kF5RPMVUyruLyYnapNynNtd4`
  - _Solana Verify Hash_: `81294793bddaeafbff5dd22af361eeb6ece5870caedd32877e82c0c8f2657ead`
- `toolkit`
  - _Description_: Helpful generic instructions to add to Solana transactions for atomicity purposes.
  - _Program ID_: `5HgftVXMq36xbvsuAd1wANdQnVTm9Zw7EQuXmke5Uqqw`
  - _Solana Verify Hash_: `512107c6322a30cd6588be6218649adf73d4e1eba5a8c2f87a075326219d6700`

### Getting Started

- Replace the `wallet` path in `Anchor.toml` with the path to your system's wallet
- Create `.env` file based on `.env.example`
- Run `npm run build`
- Replace `METADATA_PROGRAM_ID_STR` in `ai-aliens/program/src/constant` with the generated program ID
- Test on local validator with `npm run test`

### Roadmap

- Migrate `field-authority-interface` from PDAs to single TLV account model

### Licensing

This project contains multiple licenses. Refer to the innermost LICENSE document for each file. The top-level license is an open source Apache License.
