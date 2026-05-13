# TG BTC Cat Concept

## Core Idea

TG BTC Cat is a meme-governance DAO jetton on TON using the tgBTC narrative and Acton-built smart contracts.

The project direction is a token whose holders coordinate token economics through irreversible on-chain voting. Voting is not free and not reclaimable: a holder sends `tgBTCat` into the DAO treasury, and the sent amount becomes vote power.

```text
1 tgBTCat sent to governance = 1 vote
```

The tokens used for voting are not returned. They become DAO treasury assets.

## Contract Modules

Planned production modules:

- Jetton master: minting, metadata, admin handoff, supply policy.
- Custom jetton wallet: transfer behavior and fee integration.
- Fee controller: global buy/sell fee settings voted by holders.
- Wallet tax registry: wallet-specific buy/sell fee rules approved by governance.
- Governor: proposals, vote accounting, quorum, execution delay.
- Treasury: receives all irreversible voting tokens and protocol fees.
- Event campaign factory: recurring community events with on-chain state.

## Voting Flow

Users vote by sending jettons to the governance contract with a `forward_payload`.

```text
User wallet
  -> user's tgBTCat jetton wallet
  -> governance/treasury tgBTCat jetton wallet
  -> Governor receives transfer_notification
  -> Governor counts amount as vote power
  -> tokens stay in DAO treasury
```

The vote payload contains:

- proposal id
- vote side: `FOR`, `AGAINST`, or `ABSTAIN`
- optional comment hash

The public interface shows every vote transaction, voter address, amount, side, and proposal totals.

## Proposal Types

Production proposal types:

- `SetGlobalBuyFee`: set global buy fee from `0%` to `100%`.
- `SetGlobalSellFee`: set global sell fee from `0%` to `100%`.
- `SetWalletBuyFee`: set buy fee for a specific wallet from `0%` to `100%`.
- `SetWalletSellFee`: set sell fee for a specific wallet from `0%` to `100%`.
- `ClearWalletFee`: remove wallet-specific fee overrides.
- `AddDexPool`: add a DEX pool/router wallet used to classify buy/sell transfers.
- `RemoveDexPool`: remove a DEX pool/router wallet.
- `StartEvent`: start a community event governed by token votes.

## Governance Parameters

Initial governance ideas:

- Vote weight: `1 tgBTCat = 1 vote`.
- Minimum vote amount: configurable.
- Proposal creation cost: paid in `tgBTCat` and sent to treasury.
- Buy fee vote range: `0%` to `100%`.
- Sell fee vote range: `0%` to `100%`.
- Wallet-specific fee proposals: target wallet, buy fee, sell fee, reason hash.
- Timelock for sensitive proposals.
- Higher quorum for wallet-specific fee proposals.
- No max duration by default: wallet-specific fee rules remain until changed or cleared by governance.

## Fee Model

Global fees apply when a transfer is classified as buy or sell by the DEX registry.

Wallet-specific fees override global fees for the target wallet and can be configured independently:

```text
global_buy_fee
global_sell_fee
wallet_buy_fee[target_wallet]
wallet_sell_fee[target_wallet]
```

Buy/sell classification is not native to Jettons. It must be derived from known DEX pool/router wallet addresses maintained by governance.

## Web Interface

The public app should include:

- Minimal landing/site with token identity and docs.
- TON Connect wallet connection.
- Proposal list and detail pages.
- Proposal creation forms.
- Vote forms that build jetton transfer transactions with encoded `forward_payload`.
- Public vote table: voter, side, amount, transaction hash, timestamp.
- Live totals: `FOR`, `AGAINST`, `ABSTAIN`, quorum, execution status.
- Fee dashboard: current global fees and wallet-specific overrides.
- Treasury dashboard: vote treasury and fee treasury balances.

## Event Ideas

- Fee Wars: holders vote for the next fee epoch.
- Zero Fee Day: temporary transfer window with reduced fees.
- Liquidity Defense: treasury-funded liquidity campaign.
- Burn Auction: event where proceeds trigger token burn or treasury action.
- Satoshi Council: limited-duration governance campaign for high-conviction holders.

## Wallet Roles

Development wallets created locally through Acton:

- `tgbtcat_vote_treasury`: receives irreversible governance vote tokens.
- `tgbtcat_fee_treasury`: receives protocol buy/sell/wallet-specific fees.
- `tgbtcat_ops_admin`: initial deploy/admin wallet before authority is transferred to contracts.

The local wallet file is `wallets.toml`; it is intentionally ignored by git.
