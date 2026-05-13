# Asset Persistence

Use three layers for token assets.

## Primary: Arweave

Upload `assets/logo.png` and `metadata/jetton.json` to Arweave for permanent storage. Use the final Arweave URL in on-chain metadata if wallets/indexers support it well enough for the target launch flow.

## Secondary: IPFS

Upload the same files to IPFS and pin the resulting CID through at least two providers. IPFS is content-addressed, but availability depends on pinning.

Recommended shape:

```text
ipfs://<metadata-cid>
ipfs://<image-cid>
https://ipfs.io/ipfs/<cid>
https://cloudflare-ipfs.com/ipfs/<cid>
```

## Backup: GitHub

Keep source assets in this repository and optionally attach final launch assets to a GitHub Release. GitHub is useful for transparency and backup, but it should not be the only URL used in on-chain metadata.

