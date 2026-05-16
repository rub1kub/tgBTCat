<p align="center">
  <img src="assets/logo-transparent.png" alt="TG BTC Cat" width="160" />
</p>

<h1 align="center">TG BTC Cat</h1>

<p align="center">
  A governance-first TON jetton protocol for the tgBTC narrative.
</p>

<p align="center">
  <img alt="TON" src="https://img.shields.io/badge/TON-0098EA?style=for-the-badge&logo=ton&logoColor=white" />
  <img alt="Acton" src="https://img.shields.io/badge/Acton-1.0.0-111827?style=for-the-badge" />
  <img alt="Tolk" src="https://img.shields.io/badge/Tolk-smart%20contracts-0B1020?style=for-the-badge" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-101%20passing-16A34A?style=for-the-badge" />
</p>

## Protocol

TG BTC Cat is a DAO-governed jetton system built on TON with Acton and Tolk. The core idea is simple: holders can commit `tgBTCat` on-chain to shape protocol behavior, fee policy, treasury movement, wallet-specific rules, and community events.

Voting is intentionally irreversible. A vote is cast by sending `tgBTCat` to governance; the amount sent becomes vote weight and remains in the governance treasury. This creates a direct cost for influence and makes governance activity visible on-chain.

## What It Controls

- Global buy and sell fees from `0%` to `100%`.
- Wallet-specific buy and sell fee rules from `0%` to `100%`.
- DEX wallet classification for transfer-side fee logic.
- DAO treasury TON and jetton operations.
- Community event creation, updates, scheduling, and status changes.
- Jetton wallet runtime propagation through governed execution.

## Contract Stack

| Contract | Role |
| --- | --- |
| `TgBtcCatJettonMaster` | Jetton master, metadata, mint/admin flow, wallet discovery |
| `TgBtcCatJettonWallet` | Custom fee-aware jetton wallet with bounce restoration |
| `TgBtcCatGovernor` | Irreversible token voting, proposal execution, raw governed calls |
| `TgBtcCatFeeController` | Global buy/sell fee state |
| `TgBtcCatWalletFeeRegistry` | Wallet-specific fee governance |
| `TgBtcCatDexRegistry` | DEX wallet classification |
| `TgBtcCatTreasury` | DAO-controlled TON and jetton treasury operations |
| `TgBtcCatEventController` | On-chain community event registry |

## Current Build

- Production Tolk contracts for the current protocol surface.
- Generated Tolk and TypeScript wrappers.
- Acton deployment script for local emulation, testnet, and mainnet execution.
- Contract tests for governance, fees, wallet runtime, bounce handling, gas edges, protocol validation, treasury, and events.
- Critical mutation checks for the active governance and controller paths.
- TON Connect governance console with vote payloads, fee proposal builder, transaction previews, and contract registry.

Latest local gate:

```bash
acton wrapper --all
acton wrapper --all --ts
acton build
acton test        # 101 passed
acton check
acton fmt --check
acton script scripts/deploy.tolk
```

## Mainnet Deployment

The mainnet stack is live and wired into [tgbtcat.fun](https://tgbtcat.fun).

| Contract | Address |
| --- | --- |
| Governor | `EQAuV-4s02xuBkSaF7rinSu8kIoNrG9MoP6NLlX4Gyp2mcYM` |
| Jetton Master | `EQAtFLwK8HZD6KD1UF4h-S6BzYyTReSUJzQBLhHIycqfDpro` |
| Vote Jetton Wallet | `EQAuBZTp6rMhCHXrC7bEc3DJYhMoaUqUDTs90Jz3VdE6Op7g` |
| Fee Controller | `EQBAJ9rR-ZlVJZAgy7pHa3oIdORX6fzfGwdKknxFE43DLpRR` |
| Wallet Fee Registry | `EQB9i0ArmUaBXhq7hVfV5Q1eANcdDchrqiCXnmlbG_Oabrmh` |
| DEX Registry | `EQBwyv1dFFRujwrgzqHN15kTMwLTjhmXmMlJ7EXtdVp71rHs` |
| DAO Treasury | `EQAyvxYqBLFBb0h--cV4393kP2SGxIxnQ4pjrT7uScvu6ROn` |
| Event Controller | `EQADeVMRo8jqERaYghhnZsJNeQiAXy5Zun7a23x0r8nOIIpf` |
| Fee Treasury | `EQBN-pLtOoax-vA7Ga3lbb1xE1yFc5h5NkSIcrA8DaPkjlWQ` |

Mainnet state after deployment:

| Check | Result |
| --- | --- |
| Jetton metadata | `https://tgbtcat.fun/metadata/jetton.json` |
| Total supply | `1,010,000 tgBTCat` |
| Minter admin | Governor |
| Deployer balance | `1,007,800 tgBTCat` |
| Next proposal id | `2` |
| Global buy fee | `1.11%` |
| Global sell fee | `2.22%` |

Mainnet smoke:

| Scenario | Result | Transaction |
| --- | --- | --- |
| Create global fee proposal | proposal `#1` created through irreversible jetton transfer | [`4c81890c237f79df36b3456a366b301a3207783be1c05a2719ef0fd3100e82c7`](https://tonviewer.com/transaction/4c81890c237f79df36b3456a366b301a3207783be1c05a2719ef0fd3100e82c7) |
| Vote on proposal | `100 tgBTCat` counted for | [`bbba1e5f45acc1de6029f11438fb0ce125143dc1c39548e2eaa730c134731fbc`](https://tonviewer.com/transaction/bbba1e5f45acc1de6029f11438fb0ce125143dc1c39548e2eaa730c134731fbc) |
| Execute proposal | buy `111` bps, sell `222` bps | [`1b6811049ce274d0b39a550d014e6a34530a8ce246fb0fbfde3b69fabb405155`](https://tonviewer.com/transaction/1b6811049ce274d0b39a550d014e6a34530a8ce246fb0fbfde3b69fabb405155) |

## Testnet Deployment

The current testnet deployment is live and wired into the web console.

| Contract | Address |
| --- | --- |
| Governor | `kQA1GaTDOvM36bPDcBl8j1t1XAwzxTaAuNqrr0K2fRYMm5Vc` |
| Jetton Master | `kQBmTqJHA8NBgpBu4tNXHwcOSEQKSTiPsDKZoZ0HVOR0xZlo` |
| Vote Jetton Wallet | `kQA1i5KmymwMKEx2ET_XSQlkYFCKSKB03-mVbrZABWSyJaQ7` |
| Fee Controller | `kQAe6eyIysCucV94ZOE4n62Cn8_NRqRT0FwnmITXxi4_g1vu` |
| Wallet Fee Registry | `kQANR_V5_bi1zKutTcCRSakJ8lcNaRLULy6beEGDIffYVilw` |
| DEX Registry | `kQBY1IAJoAihGBN3zhPqSt8QzaY6GZKjB5xrnMV5-I8VlzRt` |
| DAO Treasury | `kQD4NsPFs18yjR_eqyhIItwr-xNQ4h4gR45-X2ZsaiK3HRMa` |
| Event Controller | `kQAsrtKveDh-cgmqf1EYSjy_knLxKqI8GUZZwwKXGfDtNKxI` |
| Fee Treasury | `kQC2sHx4TKwlHSxCwH-CsZ0DFUzV9zZMdJIaWNTEvc1BLdp7` |

## Governance Model

1. A proposal is created on-chain.
2. A holder sends `tgBTCat` to the governor with an encoded vote payload.
3. The received token amount becomes vote weight.
4. Votes are counted as `FOR`, `AGAINST`, or `ABSTAIN`.
5. Passed proposals execute governed actions through typed controller routes or whitelisted raw execution.
6. Failed outbound execution can bounce and restore proposal execution state.

## Repository Layout

```text
contracts/      Tolk smart contracts and shared message/storage schemas
wrappers/       Generated Tolk wrappers
wrappers-ts/    Generated TypeScript wrappers for app integration
tests/          Acton contract tests
scripts/        Deployment and configuration scripts
metadata/       Jetton metadata draft
assets/         Brand assets
docs/           Product, persistence, and wallet notes
web/            TON Connect governance console
```

## Development

```bash
source "$HOME/.acton/bin/env"
acton doctor
acton build
acton test
acton check
acton fmt --check
```

Regenerate wrappers after ABI or message changes:

```bash
acton wrapper --all
acton wrapper --all --ts
```

Run deployment emulation:

```bash
acton script scripts/deploy.tolk
```

Broadcast only after testnet validation:

```bash
acton script scripts/deploy.tolk --net testnet
```

Run the web console:

```bash
cd web
npm install
npm run dev
```

Production web checks:

```bash
cd web
npm run build
npm run lint
```

## Product Direction

The target is a launch-ready TON DAO product: audited contracts, verified deployments, a public TON Connect interface, proposal and vote explorer, treasury visibility, permanent metadata, and a clean brand surface around the tgBTC narrative.
