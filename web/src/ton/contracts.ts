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
      governor: null,
      jettonMaster: null,
      governorVoteJettonWallet: null,
      feeController: null,
      walletFeeRegistry: null,
      dexRegistry: null,
      treasury: null,
      eventController: null,
      feeTreasury: 'EQC2sHx4TKwlHSxCwH-CsZ0DFUzV9zZMdJIaWNTEvc1BLWHx',
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
