# TG BTC Cat Concept

## Core Idea

TG BTC Cat is a meme-governance DAO jetton on TON using the tgBTC narrative and Acton-built smart contracts.

The project direction is a token whose holders can coordinate token economics and events through on-chain governance.

## Contract Modules

Planned production modules:

- Jetton master: minting, metadata, admin handoff, supply policy.
- Custom jetton wallet: transfer behavior and fee integration.
- Fee controller: global buy/sell fee settings voted by holders.
- Wallet tax registry: temporary wallet-specific fee rules approved by governance.
- Governor: proposals, voting, quorum, execution delay.
- Treasury: fee receiver and governed spending.
- Event campaign factory: recurring community events with on-chain state.

## Governance Parameters

Initial governance ideas:

- Buy fee vote range: `0%` to `100%`.
- Sell fee vote range: `0%` to `100%`.
- Wallet-specific fee proposals: target wallet, fee value, duration, reason hash.
- Timelock for sensitive proposals.
- Higher quorum for wallet-specific fee proposals.
- Maximum duration and cooldown for wallet-specific rules.

## Event Ideas

- Fee Wars: holders vote for the next fee epoch.
- Zero Fee Day: temporary transfer window with reduced fees.
- Liquidity Defense: treasury-funded liquidity campaign.
- Burn Auction: event where proceeds trigger token burn or treasury action.
- Satoshi Council: limited-duration governance campaign for high-conviction holders.

