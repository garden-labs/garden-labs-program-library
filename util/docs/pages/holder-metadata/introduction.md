# What is Holder Metadata?

Holder Metadata is an <a href="https://github.com/garden-labs/garden-labs-program-library" target="_blank">open source</a> Solana program enabled by <a href="https://solana.com/solutions/token-extensions" target="_blank">Token Extensions</a> and the <a href="/pages/holder-metadata/token-metadata-interface">Token Metadata Interface</a> that allows NFT creators to designate metadata fields that **only token holders can edit**. Holder-editable fields enable endless opportunities for **NFT utility**. Here are a few examples:

1. <a href="https://www.ai-aliens.xyz/" target="blank">AI Aliens</a> is an AI-generated PFP collection where holders can give their little friends nicknames. _We'll take you through the code for this project!_

<img src="/1.png" width="400px" style="margin: 20px auto;"/>

```
{
  "name": "AI Alien #1254",
  "symbol": "AI-ALIENS",
  "uri": "https://nftstorage...",
  "nickname": "Johnny" // <-- Holder field
}
```

<div style="margin-top: 20px;"></div>

2. <a href="https://www.farcaster.xyz/" target="blank">Farcaster</a> is a decentralized Twitter alternative built on top of Ethereum. Each user has a URL field they can set which points to a server that implements an off-chain protocol called a "hub."

3. <a href="https://the100.tv/beta" target="blank">the100</a> (_in development_) is an internet-native TV built on Solana that aggregates videos from across the web. The owner of each channel NFT can set the video stream's URL.

4. <a href="https://www.gardenbrowser.com/" target="blank">Garden</a> (_in development_) is an AR metaverse. The owner of each land NFT can change its name, description, and iFrame URL, which can serve 3D content.

Next, we'll take you through Token Extensions and the new Token Metadata Interface, the cutting-edge of Solana infrastructure which makes this all possible.
