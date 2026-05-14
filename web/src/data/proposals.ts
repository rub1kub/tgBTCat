import type { ContractKey } from '../ton/contracts';

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
  buyFeePercent?: number;
  sellFeePercent?: number;
  walletRule?: string;
}

export const proposalRows: ProposalRow[] = [];
