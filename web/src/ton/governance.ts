import { Address, beginCell, Cell } from '@ton/core';
import type { ProposalRow, ProposalStatus } from '../data/proposals';
import { getToncenterRunGetMethodEndpoint } from './rpc';
import { shortAddress, type ResolveJettonWalletInput } from './transactions';

type NetworkKey = ResolveJettonWalletInput['network'];

interface ToncenterStackItem {
  type: string;
  value?: unknown;
}

interface RunGetMethodResponse {
  exit_code?: number;
  stack?: ToncenterStackItem[];
  error?: string;
}

interface ProposalGetterResult {
  isSet: boolean;
  actionType: bigint;
  target: string | null;
  buyFeeBps: bigint;
  sellFeeBps: bigint;
  votingEndsAt: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  executed: boolean;
}

export interface FetchGovernanceProposalsInput {
  network: NetworkKey;
  governorAddress: string;
  maxProposals?: number;
}

export interface GlobalFeeState {
  buyFeePercent: number;
  sellFeePercent: number;
  feeTreasury: string;
  governor: string;
}

export interface WalletFeeRuleState {
  isSet: boolean;
  buyFeePercent: number;
  sellFeePercent: number;
  reasonHash: string;
}

const ACTION_SET_GLOBAL_FEES = 1n;
const ACTION_SET_WALLET_FEES = 2n;
const JETTON_SCALE = 1_000_000_000;
const MAX_PROPOSALS = 20;
const PUBLIC_RATE_LIMIT_DELAY_MS = 1100;
const MAX_READ_ATTEMPTS = 4;

export async function fetchGovernanceProposals(
  input: FetchGovernanceProposalsInput,
): Promise<ProposalRow[]> {
  const nextProposalId = await getNextProposalId(input.network, input.governorAddress);
  const proposalCount = Math.min(Number(nextProposalId), input.maxProposals ?? MAX_PROPOSALS);
  const proposals: ProposalRow[] = [];

  for (let proposalId = 0; proposalId < proposalCount; proposalId += 1) {
    await waitForPublicRateLimit();
    const proposal = await getProposal(input.network, input.governorAddress, BigInt(proposalId));
    if (proposal.isSet) {
      proposals.push(toProposalRow(proposalId, proposal));
    }
  }

  return proposals;
}

export async function fetchGlobalFees(
  network: NetworkKey,
  feeControllerAddress: string,
): Promise<GlobalFeeState> {
  const result = await runGetMethod(network, feeControllerAddress, 'get_global_fees', []);
  const stack = result.stack ?? [];
  return {
    buyFeePercent: bpsToPercent(readStackInt(stack[0])),
    sellFeePercent: bpsToPercent(readStackInt(stack[1])),
    feeTreasury: requireStackAddress(stack[2]),
    governor: requireStackAddress(stack[3]),
  };
}

export async function fetchWalletFeeRule(
  network: NetworkKey,
  walletFeeRegistryAddress: string,
  targetWalletAddress: string,
): Promise<WalletFeeRuleState> {
  const target = beginCell().storeAddress(Address.parse(targetWalletAddress)).endCell();
  const result = await runGetMethod(network, walletFeeRegistryAddress, 'get_wallet_fees', [
    {
      type: 'slice',
      value: cellToBase64(target, { idx: false }),
    },
  ]);
  const stack = result.stack ?? [];
  return {
    isSet: readStackBool(stack[0]),
    buyFeePercent: bpsToPercent(readStackInt(stack[1])),
    sellFeePercent: bpsToPercent(readStackInt(stack[2])),
    reasonHash: readStackInt(stack[3]).toString(),
  };
}

async function getNextProposalId(network: NetworkKey, governorAddress: string): Promise<bigint> {
  const result = await runGetMethod(network, governorAddress, 'get_next_proposal_id', []);
  return readStackInt(result.stack?.[0]);
}

async function getProposal(
  network: NetworkKey,
  governorAddress: string,
  proposalId: bigint,
): Promise<ProposalGetterResult> {
  const result = await runGetMethod(network, governorAddress, 'get_proposal', [
    {
      type: 'num',
      value: `0x${proposalId.toString(16)}`,
    },
  ]);
  const stack = result.stack ?? [];

  return {
    isSet: readStackBool(stack[0]),
    actionType: readStackInt(stack[1]),
    target: readStackAddress(stack[2]),
    buyFeeBps: readStackInt(stack[5]),
    sellFeeBps: readStackInt(stack[6]),
    votingEndsAt: readStackInt(stack[8]),
    forVotes: readStackInt(stack[9]),
    againstVotes: readStackInt(stack[10]),
    abstainVotes: readStackInt(stack[11]),
    executed: readStackBool(stack[12]),
  };
}

async function runGetMethod(
  network: NetworkKey,
  address: string,
  method: string,
  stack: ToncenterStackItem[],
  attempt = 1,
): Promise<RunGetMethodResponse> {
  const response = await fetch(getToncenterRunGetMethodEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, method, stack }),
  });

  if ((response.status === 429 || response.status >= 500) && attempt < MAX_READ_ATTEMPTS) {
    await waitForPublicRateLimit();
    return runGetMethod(network, address, method, stack, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`on-chain read failed: ${response.status}`);
  }

  const result = (await response.json()) as RunGetMethodResponse;
  if (result.exit_code !== 0) {
    throw new Error(result.error || `on-chain read exited with code ${result.exit_code ?? 'unknown'}`);
  }
  return result;
}

function toProposalRow(id: number, proposal: ProposalGetterResult): ProposalRow {
  const status = getProposalStatus(proposal);
  const target = proposal.actionType === ACTION_SET_WALLET_FEES ? 'walletFeeRegistry' : 'feeController';
  const targetWallet = proposal.target ? shortAddress(proposal.target) : undefined;

  return {
    id,
    title: getProposalTitle(proposal.actionType),
    route: getProposalRoute(proposal.actionType, targetWallet),
    status,
    target,
    forVotes: fromJettonUnits(proposal.forVotes),
    againstVotes: fromJettonUnits(proposal.againstVotes),
    abstainVotes: fromJettonUnits(proposal.abstainVotes),
    endsIn: getFallbackTiming(Number(proposal.votingEndsAt), status),
    execution: getProposalExecution(proposal.actionType),
    votingEndsAt: Number(proposal.votingEndsAt),
    buyFeePercent: Number(proposal.buyFeeBps) / 100,
    sellFeePercent: Number(proposal.sellFeeBps) / 100,
    walletRule: targetWallet ? `wallet ${targetWallet}` : undefined,
  };
}

function getProposalStatus(proposal: ProposalGetterResult): ProposalStatus {
  if (proposal.executed) {
    return 'executed';
  }
  if (Number(proposal.votingEndsAt) > Math.floor(Date.now() / 1000)) {
    return 'open';
  }
  if (proposal.forVotes > proposal.againstVotes) {
    return 'passed';
  }
  return 'queued';
}

function getProposalTitle(actionType: bigint): string {
  if (actionType === ACTION_SET_GLOBAL_FEES) {
    return 'Fees for all buys and sells';
  }
  if (actionType === ACTION_SET_WALLET_FEES) {
    return 'Fee for a specific wallet';
  }
  return 'Governance action';
}

function getProposalRoute(actionType: bigint, targetWallet?: string): string {
  if (actionType === ACTION_SET_GLOBAL_FEES) {
    return 'General token fees';
  }
  if (actionType === ACTION_SET_WALLET_FEES) {
    return targetWallet ? `Specific wallet ${targetWallet}` : 'Specific wallet rule';
  }
  return 'On-chain action';
}

function getProposalExecution(actionType: bigint): string {
  if (actionType === ACTION_SET_GLOBAL_FEES) {
    return 'Fee decision';
  }
  if (actionType === ACTION_SET_WALLET_FEES) {
    return 'Wallet fee decision';
  }
  return 'Governance execution';
}

function getFallbackTiming(votingEndsAt: number, status: ProposalStatus): string {
  if (status === 'executed') {
    return 'executed';
  }
  if (status !== 'open') {
    return 'closed';
  }

  const seconds = Math.max(0, votingEndsAt - Math.floor(Date.now() / 1000));
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  return `${Math.ceil(minutes / 60)}h`;
}

function readStackBool(item: ToncenterStackItem | undefined): boolean {
  return readStackInt(item) !== 0n;
}

function readStackInt(item: ToncenterStackItem | undefined): bigint {
  if (!item) {
    throw new Error('on-chain read returned a short stack');
  }

  if (item.type === 'num' || item.type === 'int') {
    return parseStackNumber(item.value);
  }

  throw new Error(`unsupported integer stack type: ${item.type}`);
}

function readStackAddress(item: ToncenterStackItem | undefined): string | null {
  if (!item || item.type === 'null') {
    return null;
  }
  if (item.type === 'list' && Array.isArray(item.value) && item.value.length === 0) {
    return null;
  }
  if ((item.type === 'cell' || item.type === 'slice') && typeof item.value === 'string') {
    return Cell.fromBase64(item.value).beginParse().loadAddress().toString({
      testOnly: false,
    });
  }

  throw new Error(`unsupported address stack type: ${item.type}`);
}

function requireStackAddress(item: ToncenterStackItem | undefined): string {
  const address = readStackAddress(item);
  if (!address) {
    throw new Error('on-chain read returned an empty address');
  }
  return address;
}

function parseStackNumber(value: unknown): bigint {
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return BigInt(value);
  }
  if (typeof value !== 'string') {
    throw new Error('unsupported stack number value');
  }
  if (value.startsWith('-0x')) {
    return -BigInt(`0x${value.slice(3)}`);
  }
  return BigInt(value);
}

function fromJettonUnits(value: bigint): number {
  return Number(value) / JETTON_SCALE;
}

function bpsToPercent(value: bigint): number {
  return Number(value) / 100;
}

function waitForPublicRateLimit(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, PUBLIC_RATE_LIMIT_DELAY_MS));
}

function cellToBase64(cell: { toBoc(options?: { idx?: boolean }): Uint8Array }, options?: { idx?: boolean }): string {
  const bytes = cell.toBoc(options);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
