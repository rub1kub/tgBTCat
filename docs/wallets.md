# TG BTC Cat Wallet Roles

These are public wallet addresses only. Mnemonics/private keys are stored locally and must never be committed.

## Vote Treasury

Receives irreversible governance vote tokens.

```text
testnet: kQD0f3zpk5PYtHnNxb_ek_D7uaR92lzzBm3lKs7RHs4woHHV
mainnet: EQD0f3zpk5PYtHnNxb_ek_D7uaR92lzzBm3lKs7RHs4woMpf
```

## Fee Treasury

Receives protocol buy/sell/wallet-specific fees.

```text
testnet: kQC2sHx4TKwlHSxCwH-CsZ0DFUzV9zZMdJIaWNTEvc1BLdp7
mainnet: EQC2sHx4TKwlHSxCwH-CsZ0DFUzV9zZMdJIaWNTEvc1BLWHx
```

## Ops Admin

Initial deployment/admin wallet before authority is transferred to contracts.

```text
testnet: kQB5PH2RRIcPSCOh1b8Hldtm5FPJnt88w72D7--6vWNcxPb7
mainnet: EQB5PH2RRIcPSCOh1b8Hldtm5FPJnt88w72D7--6vWNcxE1x
```

## Active Testnet Deployer

Used for the current public testnet deployment.

```text
testnet: kQC820tGBtPVavhCbFZHnFavQObnCLitBKlGaEZ6-eyQTIY6
```

## Local Secrets

Development wallet secrets are stored in local `wallets.toml`, which is ignored by git.

To export a mnemonic locally:

```bash
source "$HOME/.acton/bin/env"
acton wallet export-mnemonic tgbtcat_vote_treasury
acton wallet export-mnemonic tgbtcat_fee_treasury
acton wallet export-mnemonic tgbtcat_ops_admin
```
