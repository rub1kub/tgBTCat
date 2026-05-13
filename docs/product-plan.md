# TG BTC Cat Production Plan

This document defines the full product target. It is not an MVP plan.

## Product Definition

TG BTC Cat is a TON jetton with irreversible on-chain treasury voting.

Users vote by sending `tgBTCat` to governance. The sent amount becomes vote weight and is not returned. Governance controls global buy/sell fees, wallet-specific buy/sell fees, DEX classification, treasury actions, and community events.

## Production Smart Contracts

### 1. Jetton Master

Responsibilities:

- TEP-0074-compatible jetton data and wallet address discovery.
- Metadata cell.
- Initial mint and mint close/freeze policy.
- Admin transfer to governance.
- Wallet code getter.

Required getters:

- `get_jetton_data`
- `get_wallet_address`

### 2. Custom Jetton Wallet

Responsibilities:

- TEP-0074 transfer, notification, excess, and burn behavior.
- Fee-aware transfer path.
- Buy/sell classification through a local DEX snapshot.
- Wallet-specific buy/sell fee override through local wallet runtime rules.
- Fee forwarding to fee treasury.
- Bounce handling for failed outbound fee/transfer flows.

Required getter:

- `get_wallet_data`

### 3. Governor

Responsibilities:

- Proposal creation.
- Proposal state machine.
- Vote accounting from `transfer_notification`.
- Irreversible treasury-to-vote accounting.
- Quorum and majority checks.
- Execution routing to controllers.
- Execution routing to the Jetton Master for wallet runtime updates.
- Claiming Jetton Master admin authority after bootstrap handoff.
- Public getters for proposals and vote totals.

Vote payload fields:

- proposal id
- vote side
- optional comment hash

### 4. Treasury

Responsibilities:

- Holds irreversible vote tokens.
- Holds DAO-managed jetton assets.
- Executes governed treasury operations.
- Rejects unauthorized withdrawals.

### 5. Fee Controller

Responsibilities:

- Stores global buy fee and sell fee.
- Validates `0%` to `100%`.
- Accepts updates only from Governor.
- Exposes public getters for current fee config.

### 6. Wallet Fee Registry

Responsibilities:

- Stores wallet-specific buy and sell fee overrides.
- No max duration by default.
- Fee rules remain until changed or cleared by governance.
- Protects core contracts, treasury addresses, and DEX registry addresses from accidental hostile overrides when configured as protected.

### 7. DEX Registry

Responsibilities:

- Stores known DEX pool/router wallet addresses.
- Enables buy/sell classification.
- Accepts add/remove only from Governor.
- Exposes public getters for classification.

### 8. Fee Runtime Propagation

TON contracts cannot synchronously call external getters during a jetton transfer.
The executable fee state is therefore stored as a local snapshot inside each custom jetton wallet.

Governor-approved proposals can route updates through the Jetton Master to a specific wallet runtime:

- set wallet runtime global buy/sell fee snapshot;
- mark a wallet runtime as DEX or non-DEX;
- add/remove DEX addresses known by that wallet runtime;
- set/clear wallet-specific fee overrides inside that wallet runtime.

The public app/indexer must show both governance registry state and the applied wallet runtime state, because a voted rule only affects transfers after the relevant wallet snapshot has been updated on-chain.

### 9. Event Controller

Responsibilities:

- Creates community event proposals.
- Tracks active events.
- Stores event metadata hash/URI.
- Allows governance-controlled start/stop/update.

## Web Product

Required web app features:

- Minimalist landing and app shell.
- TON Connect integration.
- Wallet state and jetton balance.
- Proposal list.
- Proposal detail page.
- Proposal creation forms.
- Vote transaction builder using jetton transfer with encoded `forward_payload`.
- Public vote table.
- Fee dashboard.
- Wallet-specific fee dashboard.
- Treasury dashboard.
- Contract addresses and metadata page.
- Testnet/mainnet environment switch.

## Indexing/API

The UI should not depend only on direct contract getters for historical tables.

Required indexer layer:

- Proposal events.
- Vote transfer notifications.
- Voter address.
- Vote amount.
- Vote side.
- Transaction hash.
- Logical time / timestamp.
- Proposal totals.

Acceptable first production approach:

- TonAPI/Toncenter reads for transaction history.
- Small backend/indexer database for normalized proposal/vote views.
- On-chain getters remain the source of truth for execution-critical state.

## Security Gates

Production release requires:

- Unit tests for every message type.
- Integration tests for jetton transfer and vote flow.
- Bounce tests.
- Fee edge cases: `0%`, `100%`, small amount, insufficient TON, treasury/protected address.
- Governance edge cases: double vote, late vote, invalid payload, unknown proposal, execution before/after deadlines.
- Fork-net test on testnet.
- Contract verification where supported.
- Independent review before mainnet launch.

## Launch Stages

1. Implement production contracts.
2. Generate wrappers.
3. Contract test suite.
4. Deploy to testnet.
5. Build web app.
6. Connect web app to testnet contracts.
7. Run public testnet voting rounds.
8. Security review.
9. Freeze metadata and upload assets to Arweave/IPFS.
10. Mainnet deployment.
11. Transfer admin authority to governance.
12. Publish verified contract addresses.
