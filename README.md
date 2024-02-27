# Holder Metadata

Full docs: <a href="https://www.holdermetadata.com/">holdermetadata.com</a>

### Getting Started

- Replace the `wallet` path in `Anchor.toml` with your system's wallet path
- Create `.env` file based on `.env.example`
- Run `yarn build`
- Replace `CREATOR_PUBKEY_STR` with your anchor wallet and `METADATA_PROGRAM_ID_STR` in `programs/ai-aliens/src/constant` with the generated program ID
- Test on local validator with `yarn scripts/test:localnet`
- Test on Devnet with `yarn scripts/test:devnet:redeploy`
