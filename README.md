# TG BTC Cat

TG BTC Cat is a community DAO jetton project on TON built with Acton/Tolk around the tgBTC narrative.

Holders are intended to govern protocol parameters on-chain, including buy/sell fees, temporary wallet-specific fee proposals, and community event campaigns.

## Status

This repository currently contains:

- Acton `1.0.0` project setup for TON smart contract development.
- `TgBtcCatDao` governance controller scaffold.
- Token avatar asset and jetton metadata draft.
- Tests and deployment script for the current scaffold.

The production jetton, fee controller, wallet fee registry, and event campaign contracts are planned next. Do not treat the current scaffold as a production token contract.

## Metadata

Draft jetton metadata lives in [`metadata/jetton.json`](metadata/jetton.json).

Current asset:

![TG BTC Cat logo](assets/logo.png)

## Development

```bash
source "$HOME/.acton/bin/env"
acton doctor
acton build
acton test
acton check
acton fmt --check
```

Regenerate wrappers after ABI changes:

```bash
acton wrapper --all
acton wrapper --all --ts
```

## Storage Plan

GitHub is used for public source control and asset backup. For token metadata and image URLs, prefer permanent or content-addressed storage:

- Primary: Arweave permanent upload.
- Secondary: IPFS CID pinned by multiple pinning providers.
- Backup: GitHub release/source asset.

