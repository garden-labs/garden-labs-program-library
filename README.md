# Garden Labs Program Library

Full docs: <a href="https://developers.gardenlabs.com/">developers.gardenlabs.com</a>

### Programs

- `field-authority-interface`: Interface that works in concert with the <a href="https://forum.solana.com/t/srfc-00017-token-metadata-interface/283">Token Metadata Interface</a> which allows field-based update authority.
- `advanced-token-metadata`: Metadata program forked from the <a href="https://github.com/solana-labs/solana-program-library/tree/master/token-metadata/example">SPL example</a> with the Field Authority Interface implemented.
- `holder-metadata-plugin`: Program which acts as a field authority and checks token ownership before updating metadata.
- `ai-aliens`: Example PFP NFT collection which uses the programs above to enable token holders to give their NFTs' nicknames.

### Getting Started

- Replace the `wallet` path in `Anchor.toml` with the path to your system's wallet
- Create `.env` file based on `.env.example`
- Run `yarn build`
- Replace `METADATA_PROGRAM_ID_STR` in `programs/ai-aliens/src/constant` with the generated program ID
- Test on local validator with `yarn scripts/test:localnet`
- Test on Devnet with `yarn scripts/test:devnet:redeploy`
