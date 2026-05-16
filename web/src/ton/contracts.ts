export type NetworkKey = 'mainnet';

export type ContractKey =
  | 'governor'
  | 'jettonMaster'
  | 'governorVoteJettonWallet'
  | 'feeController'
  | 'walletFeeRegistry'
  | 'dexRegistry'
  | 'treasury'
  | 'eventController'
  | 'feeTreasury';

export interface ContractAddressBook {
  network: NetworkKey;
  label: string;
  explorerBaseUrl: string;
  addresses: Record<ContractKey, string | null>;
}

export const addressBooks: Record<NetworkKey, ContractAddressBook> = {
  mainnet: {
    network: 'mainnet',
    label: 'Mainnet',
    explorerBaseUrl: 'https://tonviewer.com',
    addresses: {
      governor: 'EQAuV-4s02xuBkSaF7rinSu8kIoNrG9MoP6NLlX4Gyp2mcYM',
      jettonMaster: 'EQAtFLwK8HZD6KD1UF4h-S6BzYyTReSUJzQBLhHIycqfDpro',
      governorVoteJettonWallet: 'EQAuBZTp6rMhCHXrC7bEc3DJYhMoaUqUDTs90Jz3VdE6Op7g',
      feeController: 'EQBAJ9rR-ZlVJZAgy7pHa3oIdORX6fzfGwdKknxFE43DLpRR',
      walletFeeRegistry: 'EQB9i0ArmUaBXhq7hVfV5Q1eANcdDchrqiCXnmlbG_Oabrmh',
      dexRegistry: 'EQBwyv1dFFRujwrgzqHN15kTMwLTjhmXmMlJ7EXtdVp71rHs',
      treasury: 'EQAyvxYqBLFBb0h--cV4393kP2SGxIxnQ4pjrT7uScvu6ROn',
      eventController: 'EQADeVMRo8jqERaYghhnZsJNeQiAXy5Zun7a23x0r8nOIIpf',
      feeTreasury: 'EQBN-pLtOoax-vA7Ga3lbb1xE1yFc5h5NkSIcrA8DaPkjlWQ',
    },
  },
};

export const contractLabels: Record<ContractKey, string> = {
  governor: 'Governor',
  jettonMaster: 'Jetton Master',
  governorVoteJettonWallet: 'Vote Jetton Wallet',
  feeController: 'Fee Controller',
  walletFeeRegistry: 'Wallet Fee Registry',
  dexRegistry: 'DEX Registry',
  treasury: 'DAO Treasury',
  eventController: 'Event Controller',
  feeTreasury: 'Fee Treasury',
};

export const contractRoles: Record<ContractKey, string> = {
  governor: 'Proposal state, irreversible token voting, execution routing',
  jettonMaster: 'Supply, metadata, wallet discovery, admin handoff',
  governorVoteJettonWallet: 'Jetton wallet receiving vote-weight tokens',
  feeController: 'Global buy/sell fee state',
  walletFeeRegistry: 'Wallet-specific fee overrides',
  dexRegistry: 'DEX wallet classification',
  treasury: 'Governed TON and jetton operations',
  eventController: 'Governed community event registry',
  feeTreasury: 'Protocol fee receiver',
};

export const socialLinks = [
  { label: 'Website', href: 'https://tgbtcat.fun' },
  { label: 'Telegram', href: 'https://t.me/tgbtcat' },
  { label: 'Chat', href: 'https://t.me/+uiEvHbrudew1YmM6' },
  { label: 'X', href: 'https://x.com/tgBTCat' },
];
