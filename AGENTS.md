# tgBTC Agent Instructions

Use these rules for TON/Acton work in this repository.

## Required Skills

- Use `$acton` for Acton CLI, project layout, `Acton.toml`, builds, wrappers, scripts, wallets, deployment, verification, linting, formatting, and troubleshooting.
- Use `$tolk` for writing, reviewing, debugging, and testing Tolk smart contracts.
- Use `$ton-blockchain` for TON standards and ecosystem context: TL-B, TVM, cells, BoC, wallets, jettons, NFTs, TON Connect, liteservers, and APIs.
- Use `$func2tolk` only when migrating existing `.fc` or `.func` code to Tolk.

## Baseline Workflow

1. Check current project state before editing:
   ```bash
   source "$HOME/.acton/bin/env"
   acton doctor
   ```
2. For contract changes, run:
   ```bash
   acton build
   acton test
   acton check
   acton fmt --check
   ```
3. Regenerate wrappers after ABI changes:
   ```bash
   acton wrapper --all
   acton wrapper --all --ts
   ```
4. For dApp work, prefer generated TypeScript wrappers over hand-written cell serialization.
5. For deployment, use Tolk scripts and test with `--fork-net` before `--net`.

## TON Defaults

- Use Tolk for new contracts.
- Treat FunC/Tact as legacy unless a dependency or migration explicitly requires them.
- Use testnet first; never use mainnet wallets or secrets in committed files.
- Store mnemonics in Acton secure storage or environment variables, never in git.
- Use TON Connect/AppKit for wallet UX in frontend code.

## Security Checks

- Validate sender, value, replay/seqno, expiration, and message body before state changes.
- Do not call `accept_message` before authentication and replay checks.
- Do not store private data or secrets on-chain.
- Model TON message flows as asynchronous; do not assume a multi-hop flow remains atomic.
- Keep opcodes, TL-B layout, getter shapes, send modes, and bounce behavior explicit in tests.
