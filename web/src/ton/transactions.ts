import { Address, beginCell, toNano } from '@ton/core';
import { TgBtcCatGovernor } from '../../../wrappers-ts/TgBtcCatGovernor.gen';
import { TgBtcCatJettonWallet } from '../../../wrappers-ts/TgBtcCatJettonWallet.gen';

export type VoteSide = 1 | 2 | 3;

export interface TonConnectTransaction {
  validUntil: number;
  messages: Array<{
    address: string;
    amount: string;
    payload?: string;
  }>;
}

export interface VoteTransactionInput {
  voterJettonWallet: string;
  governorAddress: string;
  responseAddress: string;
  proposalId: string;
  side: VoteSide;
  jettonAmount: string;
  commentHash?: string;
  gasTon: string;
  forwardTon: string;
}

export interface GlobalFeeProposalInput {
  governorAddress: string;
  queryId: string;
  buyFeePercent: string;
  sellFeePercent: string;
  votingEndsAt: string;
  reasonHash?: string;
  gasTon: string;
}

const CAST_VOTE_OPCODE = 0x766f7465;
const ACTION_SET_GLOBAL_FEES = 1;
const JETTON_DECIMALS = 9;

export function buildVoteTransaction(input: VoteTransactionInput): TonConnectTransaction {
  const votePayload = beginCell()
    .storeUint(CAST_VOTE_OPCODE, 32)
    .storeUint(parseUint(input.proposalId, 'proposal id'), 64)
    .storeUint(input.side, 8)
    .storeUint(parseUint(input.commentHash || '0', 'comment hash'), 256)
    .endCell();

  const transferBody = TgBtcCatJettonWallet.createCellOfAskToTransfer({
    queryId: BigInt(Date.now()),
    jettonAmount: parseJettonAmount(input.jettonAmount),
    transferRecipient: Address.parse(input.governorAddress),
    sendExcessesTo: Address.parse(input.responseAddress),
    customPayload: null,
    forwardTonAmount: toNano(input.forwardTon),
    forwardPayload: {
      $: 'PayloadInRef',
      value: {
        ref: votePayload.beginParse(),
      },
    },
  });

  return {
    validUntil: validUntil(),
    messages: [
      {
        address: Address.parse(input.voterJettonWallet).toString(),
        amount: toNano(input.gasTon).toString(),
        payload: cellToBase64(transferBody),
      },
    ],
  };
}

export function buildGlobalFeeProposalTransaction(
  input: GlobalFeeProposalInput,
): TonConnectTransaction {
  const body = TgBtcCatGovernor.createCellOfCreateGovernanceProposal({
    queryId: parseUint(input.queryId, 'query id'),
    actionType: BigInt(ACTION_SET_GLOBAL_FEES),
    target: null,
    auxTarget: null,
    flags: 0n,
    buyFeeBps: BigInt(percentToBps(input.buyFeePercent)),
    sellFeeBps: BigInt(percentToBps(input.sellFeePercent)),
    reasonHash: parseUint(input.reasonHash || '0', 'reason hash'),
    votingEndsAt: parseUint(input.votingEndsAt, 'voting end'),
  });

  return {
    validUntil: validUntil(),
    messages: [
      {
        address: Address.parse(input.governorAddress).toString(),
        amount: toNano(input.gasTon).toString(),
        payload: cellToBase64(body),
      },
    ],
  };
}

export function unixHoursFromNow(hours: number): string {
  return String(Math.floor(Date.now() / 1000) + hours * 60 * 60);
}

export function shortAddress(address: string | null): string {
  if (!address) {
    return 'Not deployed';
  }
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export function formatVotes(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function parseJettonAmount(value: string): bigint {
  const normalized = value.trim();
  if (!/^\d+(\.\d{0,9})?$/.test(normalized)) {
    throw new Error('Token amount must be a positive number with up to 9 decimals');
  }
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole + fraction.padEnd(JETTON_DECIMALS, '0'));
}

function percentToBps(value: string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
    throw new Error('Fee percent must be between 0 and 100');
  }
  return Math.round(numeric * 100);
}

function parseUint(value: string, label: string): bigint {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${label} must be an unsigned integer`);
  }
  return BigInt(normalized);
}

function validUntil(): number {
  return Math.floor(Date.now() / 1000) + 5 * 60;
}

function cellToBase64(cell: { toBoc(): Uint8Array }): string {
  const bytes = cell.toBoc();
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
