import type { ContractKey } from '../ton/contracts';

export type ProposalSide = 'for' | 'against' | 'abstain';
export type ProposalStatus = 'open' | 'passed' | 'queued' | 'executed';

export interface ProposalRow {
  id: number;
  title: string;
  route: string;
  status: ProposalStatus;
  target: ContractKey;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  endsIn: string;
  execution: string;
}

export const proposalRows: ProposalRow[] = [
  {
    id: 0,
    title: 'Set global launch fees',
    route: 'ACTION_SET_GLOBAL_FEES',
    status: 'open',
    target: 'feeController',
    forVotes: 18_200_000,
    againstVotes: 4_050_000,
    abstainVotes: 730_000,
    endsIn: '17h 42m',
    execution: 'Fee Controller',
  },
  {
    id: 1,
    title: 'Apply wallet-specific sell fee',
    route: 'ACTION_SET_WALLET_FEES',
    status: 'queued',
    target: 'walletFeeRegistry',
    forVotes: 9_800_000,
    againstVotes: 2_110_000,
    abstainVotes: 420_000,
    endsIn: 'closed',
    execution: 'Wallet Fee Registry',
  },
  {
    id: 2,
    title: 'Open Satoshi Council event',
    route: 'ACTION_RAW_EXECUTION',
    status: 'passed',
    target: 'eventController',
    forVotes: 31_400_000,
    againstVotes: 1_900_000,
    abstainVotes: 1_200_000,
    endsIn: 'closed',
    execution: 'Event Controller',
  },
  {
    id: 3,
    title: 'Top up DAO liquidity reserve',
    route: 'ACTION_RAW_EXECUTION',
    status: 'executed',
    target: 'treasury',
    forVotes: 44_900_000,
    againstVotes: 6_800_000,
    abstainVotes: 2_300_000,
    endsIn: 'executed',
    execution: 'DAO Treasury',
  },
];

export const statusLabel: Record<ProposalStatus, string> = {
  open: 'Open',
  passed: 'Passed',
  queued: 'Queued',
  executed: 'Executed',
};

export const voteSideLabels: Record<ProposalSide, string> = {
  for: 'FOR',
  against: 'AGAINST',
  abstain: 'ABSTAIN',
};
