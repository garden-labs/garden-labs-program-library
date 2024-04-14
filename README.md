# Holder Metadata

Full docs: <a href="https://www.holdermetadata.com/">holdermetadata.com</a>

Example collection: <a href="https://www.ai-aliens.xyz/">ai-alienx.xyz</a>

### Programs

- `programs-vanilla/field-authority-interface`: Interface that works in concert with the <a href="https://forum.solana.com/t/srfc-00017-token-metadata-interface/283">Token Metadata Interface</a> which allows field-based update authority.
- `programs-vanilla/spl-token-metadata-example`: Metadata program forked from the <a href="https://github.com/solana-labs/solana-program-library/tree/master/token-metadata/example">SPL example</a> with the Field Authority Interface implemented.
- `programs/holder-metadata`: Program which acts as a field authority and checks token ownership before updating metadata.
- `programs/ai-aliens`: Example PFP NFT collection which uses the programs above to enable token holders to give their NFTs' nicknames.

### Getting Started

- Replace the `wallet` path in `Anchor.toml` with your system's wallet path
- Create `.env` file based on `.env.example`
- Run `yarn build`
- Replace `METADATA_PROGRAM_ID_STR` in `programs/ai-aliens/src/constant` with the generated program ID
- Test on local validator with `yarn scripts/test:localnet`
- Test on Devnet with `yarn scripts/test:devnet:redeploy`
