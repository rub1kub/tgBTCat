import type { ContractKey } from '../ton/contracts';

export type ProposalStatus = 'open' | 'passed' | 'queued' | 'executed' | 'rejected';

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
  votingEndsAt?: number;
  buyFeePercent?: number;
  sellFeePercent?: number;
  walletRule?: string;
}

export const proposalRows: ProposalRow[] = [];
