import { Address, beginCell, Cell, toNano } from '@ton/core';
import { TgBtcCatGovernor } from '../../../wrappers-ts/TgBtcCatGovernor.gen';
import { TgBtcCatJettonWallet } from '../../../wrappers-ts/TgBtcCatJettonWallet.gen';

export type VoteSide = 1 | 2;

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
  voterJettonWallet: string;
  governorAddress: string;
  responseAddress: string;
  queryId: string;
  buyFeePercent: string;
  sellFeePercent: string;
  votingEndsAt: string;
  reasonHash?: string;
  proposalJettonAmount: string;
  gasTon: string;
  forwardTon: string;
}

export interface WalletFeeProposalInput extends GlobalFeeProposalInput {
  targetWallet: string;
}

export interface ResolveJettonWalletInput {
  network: 'mainnet' | 'testnet';
  jettonMaster: string;
  ownerAddress: string;
}

export interface JettonWalletInfo {
  address: string;
  balance: string;
  formattedBalance: string;
}

const CAST_VOTE_OPCODE = 0x766f7465;
const ACTION_SET_GLOBAL_FEES = 1;
const ACTION_SET_WALLET_FEES = 2;
const JETTON_DECIMALS = 9;
const MAX_RPC_ATTEMPTS = 4;
const RPC_RETRY_DELAY_MS = 900;
const TONCENTER_V3_ENDPOINTS: Record<ResolveJettonWalletInput['network'], string> = {
  mainnet: 'https://toncenter.com/api/v3/runGetMethod',
  testnet: 'https://testnet.toncenter.com/api/v3/runGetMethod',
};

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
  const proposalPayload = TgBtcCatGovernor.createCellOfCreateGovernanceProposal({
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

  return buildProposalTransferTransaction(input, proposalPayload);
}

export function buildWalletFeeProposalTransaction(input: WalletFeeProposalInput): TonConnectTransaction {
  const proposalPayload = TgBtcCatGovernor.createCellOfCreateGovernanceProposal({
    queryId: parseUint(input.queryId, 'query id'),
    actionType: BigInt(ACTION_SET_WALLET_FEES),
    target: Address.parse(input.targetWallet),
    auxTarget: null,
    flags: 0n,
    buyFeeBps: BigInt(percentToBps(input.buyFeePercent)),
    sellFeeBps: BigInt(percentToBps(input.sellFeePercent)),
    reasonHash: parseUint(input.reasonHash || '0', 'reason hash'),
    votingEndsAt: parseUint(input.votingEndsAt, 'voting end'),
  });

  return buildProposalTransferTransaction(input, proposalPayload);
}

function buildProposalTransferTransaction(
  input: GlobalFeeProposalInput,
  proposalPayload: Cell,
): TonConnectTransaction {
  const transferBody = TgBtcCatJettonWallet.createCellOfAskToTransfer({
    queryId: BigInt(Date.now()),
    jettonAmount: parseJettonAmount(input.proposalJettonAmount),
    transferRecipient: Address.parse(input.governorAddress),
    sendExcessesTo: Address.parse(input.responseAddress),
    customPayload: null,
    forwardTonAmount: toNano(input.forwardTon),
    forwardPayload: {
      $: 'PayloadInRef',
      value: {
        ref: proposalPayload.beginParse(),
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

export async function resolveJettonWalletAddress(input: ResolveJettonWalletInput): Promise<string> {
  const testOnly = input.network === 'testnet';
  const ownerSlice = beginCell().storeAddress(Address.parse(input.ownerAddress)).endCell();
  const result = await runToncenterGetMethod({
    network: input.network,
    address: Address.parse(input.jettonMaster).toString({ testOnly }),
    method: 'get_wallet_address',
    stack: [
      {
        type: 'slice',
        value: cellToBase64(ownerSlice, { idx: false }),
      },
    ],
  });

  if (result.exit_code !== 0) {
    throw new Error(result.error || `Jetton wallet lookup exited with code ${result.exit_code ?? 'unknown'}`);
  }

  const walletCell = Cell.fromBase64(readStackCell(result.stack?.[0]));
  return walletCell.beginParse().loadAddress().toString({ testOnly });
}

export async function resolveJettonWalletInfo(input: ResolveJettonWalletInput): Promise<JettonWalletInfo> {
  const address = await resolveJettonWalletAddress(input);
  const balance = await resolveJettonWalletBalance(input.network, address).catch(() => '');
  return {
    address,
    balance,
    formattedBalance: balance ? formatJettonAmount(balance) : '',
  };
}

export function unixMinutesFromNow(minutes: number): string {
  return String(Math.floor(Date.now() / 1000) + minutes * 60);
}

export function createQueryId(): string {
  return String(Date.now());
}

export function shortAddress(address: string | null): string {
  if (!address) {
    return 'Not deployed';
  }
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export function formatVotes(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function isValidTonAddress(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }

  try {
    Address.parse(normalized);
    return true;
  } catch {
    return false;
  }
}

export function signedBocHashHex(boc: string): string {
  const hash = Cell.fromBase64(boc).hash() as Uint8Array;
  return Array.from(hash)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
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

function readStackCell(stackItem: unknown): string {
  if (Array.isArray(stackItem)) {
    const value = stackItem[1];
    if (typeof value === 'string') {
      return value;
    }
    if (isRecord(value) && typeof value.bytes === 'string') {
      return value.bytes;
    }
  }

  if (isRecord(stackItem)) {
    const value = stackItem.value;
    if (typeof value === 'string') {
      return value;
    }
    if (isRecord(value) && typeof value.bytes === 'string') {
      return value.bytes;
    }
  }

  throw new Error('Jetton wallet lookup returned an unsupported stack value');
}

async function resolveJettonWalletBalance(network: ResolveJettonWalletInput['network'], walletAddress: string): Promise<string> {
  const testOnly = network === 'testnet';
  const result = await runToncenterGetMethod({
    network,
    address: Address.parse(walletAddress).toString({ testOnly }),
    method: 'get_wallet_data',
    stack: [],
  });

  if (result.exit_code !== 0) {
    return '0';
  }

  return readStackInt(result.stack?.[0]).toString();
}

async function runToncenterGetMethod({
  network,
  address,
  method,
  stack,
  attempt = 1,
}: {
  network: ResolveJettonWalletInput['network'];
  address: string;
  method: string;
  stack: Array<Record<string, unknown>>;
  attempt?: number;
}): Promise<{
  exit_code?: number;
  stack?: unknown[];
  error?: string;
}> {
  const response = await fetch(TONCENTER_V3_ENDPOINTS[network], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, method, stack }),
  });

  if ((response.status === 429 || response.status >= 500) && attempt < MAX_RPC_ATTEMPTS) {
    await delay(RPC_RETRY_DELAY_MS * attempt);
    return runToncenterGetMethod({ network, address, method, stack, attempt: attempt + 1 });
  }

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status}`);
  }

  return response.json();
}

function readStackInt(stackItem: unknown): bigint {
  if (Array.isArray(stackItem)) {
    return parseStackNumber(stackItem[1]);
  }

  if (isRecord(stackItem)) {
    if ('value' in stackItem) {
      return parseStackNumber(stackItem.value);
    }
    if ('num' in stackItem) {
      return parseStackNumber(stackItem.num);
    }
  }

  throw new Error('Token balance lookup returned an unsupported stack value');
}

function parseStackNumber(value: unknown): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return BigInt(value);
  }
  if (typeof value === 'string') {
    return BigInt(value);
  }
  if (isRecord(value)) {
    if ('value' in value) {
      return parseStackNumber(value.value);
    }
    if ('bytes' in value) {
      return parseStackNumber(value.bytes);
    }
  }

  throw new Error('Token balance lookup returned an unsupported integer');
}

function formatJettonAmount(value: string): string {
  const amount = BigInt(value);
  const scale = 10n ** BigInt(JETTON_DECIMALS);
  const whole = amount / scale;
  const fraction = amount % scale;
  const fractionText = fraction.toString().padStart(JETTON_DECIMALS, '0').replace(/0+$/, '');
  return `${whole.toString()}${fractionText ? `.${fractionText}` : ''}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function cellToBase64(cell: { toBoc(options?: { idx?: boolean }): Uint8Array }, options?: { idx?: boolean }): string {
  const bytes = cell.toBoc(options);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
