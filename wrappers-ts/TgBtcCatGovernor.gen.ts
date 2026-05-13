// AUTO-GENERATED, do not edit
// It's a TypeScript wrapper for a TgBtcCatGovernor contract in Tolk.
/* eslint-disable */

import * as c from '@ton/core';
import { beginCell, ContractProvider, Sender, SendMode } from '@ton/core';

// ————————————————————————————————————————————
//   predefined types and functions
//

type RemainingBitsAndRefs = c.Slice

type StoreCallback<T> = (obj: T, b: c.Builder) => void
type LoadCallback<T> = (s: c.Slice) => T

export type CellRef<T> = {
    ref: T
}

function makeCellFrom<T>(self: T, storeFn_T: StoreCallback<T>): c.Cell {
    let b = beginCell();
    storeFn_T(self, b);
    return b.endCell();
}

function loadAndCheckPrefix32(s: c.Slice, expected: number, structName: string): void {
    let prefix = s.loadUint(32);
    if (prefix !== expected) {
        throw new Error(`Incorrect prefix for '${structName}': expected 0x${expected.toString(16).padStart(8, '0')}, got 0x${prefix.toString(16).padStart(8, '0')}`);
    }
}

function formatPrefix(prefixNum: number, prefixLen: number): string {
    return prefixLen % 4 ? `0b${prefixNum.toString(2).padStart(prefixLen, '0')}` : `0x${prefixNum.toString(16).padStart(prefixLen / 4, '0')}`;
}

function loadAndCheckPrefix(s: c.Slice, expected: number, prefixLen: number, structName: string): void {
    let prefix = s.loadUint(prefixLen);
    if (prefix !== expected) {
        throw new Error(`Incorrect prefix for '${structName}': expected ${formatPrefix(expected, prefixLen)}, got ${formatPrefix(prefix, prefixLen)}`);
    }
}

function lookupPrefix(s: c.Slice, expected: number, prefixLen: number): boolean {
    return s.remainingBits >= prefixLen && s.preloadUint(prefixLen) === expected;
}

function throwNonePrefixMatch(fieldPath: string): never {
    throw new Error(`Incorrect prefix for '${fieldPath}': none of variants matched`);
}

function storeCellRef<T>(cell: CellRef<T>, b: c.Builder, storeFn_T: StoreCallback<T>): void {
    let b_ref = c.beginCell();
    storeFn_T(cell.ref, b_ref);
    b.storeRef(b_ref.endCell());
}

function loadCellRef<T>(s: c.Slice, loadFn_T: LoadCallback<T>): CellRef<T> {
    let s_ref = s.loadRef().beginParse();
    return { ref: loadFn_T(s_ref) };
}

function storeTolkRemaining(v: RemainingBitsAndRefs, b: c.Builder): void {
    b.storeSlice(v);
}

function loadTolkRemaining(s: c.Slice): RemainingBitsAndRefs {
    let rest = s.clone();
    s.loadBits(s.remainingBits);
    while (s.remainingRefs) {
        s.loadRef();
    }
    return rest;
}

function storeTolkNullable<T>(v: T | null, b: c.Builder, storeFn_T: StoreCallback<T>): void {
    if (v === null) {
        b.storeUint(0, 1);
    } else {
        b.storeUint(1, 1);
        storeFn_T(v, b);
    }
}

function createDictionaryValue<V>(loadFn_V: LoadCallback<V>, storeFn_V: StoreCallback<V>): c.DictionaryValue<V> {
    return {
        serialize(self: V, b: c.Builder) {
            storeFn_V(self, b);
        },
        parse(s: c.Slice): V {
            const value = loadFn_V(s);
            s.endParse();
            return value;
        }
    }
}

// ————————————————————————————————————————————
//   parse get methods result from a TVM stack
//

class StackReader {
    constructor(private tuple: c.TupleItem[]) {
    }

    static fromGetMethod(expectedN: number, getMethodResult: { stack: c.TupleReader }): StackReader {
        let tuple = [] as c.TupleItem[];
        while (getMethodResult.stack.remaining) {
            tuple.push(getMethodResult.stack.pop());
        }
        if (tuple.length !== expectedN) {
            throw new Error(`expected ${expectedN} stack width, got ${tuple.length}`);
        }
        return new StackReader(tuple);
    }

    private popExpecting<ItemT>(itemType: string): ItemT {
        const item = this.tuple.shift();
        if (item?.type === itemType) {
            return item as ItemT;
        }
        throw new Error(`not '${itemType}' on a stack`);
    }

    private popCellLike(): c.Cell {
        const item = this.tuple.shift();
        if (item && (item.type === 'cell' || item.type === 'slice' || item.type === 'builder')) {
            return item.cell;
        }
        throw new Error(`not cell/slice on a stack`);
    }

    readBigInt(): bigint {
        return this.popExpecting<c.TupleItemInt>('int').value;
    }

    readBoolean(): boolean {
        return this.popExpecting<c.TupleItemInt>('int').value !== 0n;
    }

    readCell(): c.Cell {
        return this.popCellLike();
    }

    readSlice(): c.Slice {
        return this.popCellLike().beginParse();
    }

    readNullable<T>(readFn_T: (r: StackReader) => T): T | null {
        if (this.tuple[0].type === 'null') {
            this.tuple.shift();
            return null;
        }
        return readFn_T(this);
    }
}

// ————————————————————————————————————————————
//   auto-generated serializers to/from cells
//

type coins = bigint

type uint8 = bigint
type uint16 = bigint
type uint32 = bigint
type uint64 = bigint
type uint256 = bigint

/**
 > struct Proposal {
 >     actionType: uint8
 >     target: address?
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 >     reasonHash: uint256
 >     votingEndsAt: uint32
 >     forVotes: coins
 >     againstVotes: coins
 >     abstainVotes: coins
 >     executed: bool
 > }
 */
export interface Proposal {
    readonly $: 'Proposal'
    actionType: uint8
    target: c.Address | null
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
    votingEndsAt: uint32
    forVotes: coins
    againstVotes: coins
    abstainVotes: coins
    executed: boolean
}

export const Proposal = {
    create(args: {
        actionType: uint8
        target: c.Address | null
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
        votingEndsAt: uint32
        forVotes: coins
        againstVotes: coins
        abstainVotes: coins
        executed: boolean
    }): Proposal {
        return {
            $: 'Proposal',
            ...args
        }
    },
    fromSlice(s: c.Slice): Proposal {
        return {
            $: 'Proposal',
            actionType: s.loadUintBig(8),
            target: s.loadMaybeAddress(),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
            reasonHash: s.loadUintBig(256),
            votingEndsAt: s.loadUintBig(32),
            forVotes: s.loadCoins(),
            againstVotes: s.loadCoins(),
            abstainVotes: s.loadCoins(),
            executed: s.loadBoolean(),
        }
    },
    store(self: Proposal, b: c.Builder): void {
        b.storeUint(self.actionType, 8);
        b.storeAddress(self.target);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
        b.storeUint(self.reasonHash, 256);
        b.storeUint(self.votingEndsAt, 32);
        b.storeCoins(self.forVotes);
        b.storeCoins(self.againstVotes);
        b.storeCoins(self.abstainVotes);
        b.storeBit(self.executed);
    },
    toCell(self: Proposal): c.Cell {
        return makeCellFrom<Proposal>(self, Proposal.store);
    }
}

/**
 > struct GovernorStorage {
 >     admin: address
 >     voteJettonWallet: address
 >     minVoteAmount: coins
 >     nextProposalId: uint64
 >     proposals: map<uint64, Proposal>
 > }
 */
export interface GovernorStorage {
    readonly $: 'GovernorStorage'
    admin: c.Address
    voteJettonWallet: c.Address
    minVoteAmount: coins
    nextProposalId: uint64
    proposals: c.Dictionary<uint64, Proposal> /* = [] */
}

export const GovernorStorage = {
    create(args: {
        admin: c.Address
        voteJettonWallet: c.Address
        minVoteAmount: coins
        nextProposalId: uint64
        proposals: c.Dictionary<uint64, Proposal> /* = [] */
    }): GovernorStorage {
        return {
            $: 'GovernorStorage',
            ...args
        }
    },
    fromSlice(s: c.Slice): GovernorStorage {
        return {
            $: 'GovernorStorage',
            admin: s.loadAddress(),
            voteJettonWallet: s.loadAddress(),
            minVoteAmount: s.loadCoins(),
            nextProposalId: s.loadUintBig(64),
            proposals: c.Dictionary.load<uint64, Proposal>(c.Dictionary.Keys.BigUint(64), createDictionaryValue<Proposal>(Proposal.fromSlice, Proposal.store), s),
        }
    },
    store(self: GovernorStorage, b: c.Builder): void {
        b.storeAddress(self.admin);
        b.storeAddress(self.voteJettonWallet);
        b.storeCoins(self.minVoteAmount);
        b.storeUint(self.nextProposalId, 64);
        b.storeDict<uint64, Proposal>(self.proposals, c.Dictionary.Keys.BigUint(64), createDictionaryValue<Proposal>(Proposal.fromSlice, Proposal.store));
    },
    toCell(self: GovernorStorage): c.Cell {
        return makeCellFrom<GovernorStorage>(self, GovernorStorage.store);
    }
}

/**
 > struct ProposalReply {
 >     isSet: bool
 >     actionType: uint8
 >     target: address?
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 >     reasonHash: uint256
 >     votingEndsAt: uint32
 >     forVotes: coins
 >     againstVotes: coins
 >     abstainVotes: coins
 >     executed: bool
 > }
 */
export interface ProposalReply {
    readonly $: 'ProposalReply'
    isSet: boolean
    actionType: uint8
    target: c.Address | null
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
    votingEndsAt: uint32
    forVotes: coins
    againstVotes: coins
    abstainVotes: coins
    executed: boolean
}

export const ProposalReply = {
    create(args: {
        isSet: boolean
        actionType: uint8
        target: c.Address | null
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
        votingEndsAt: uint32
        forVotes: coins
        againstVotes: coins
        abstainVotes: coins
        executed: boolean
    }): ProposalReply {
        return {
            $: 'ProposalReply',
            ...args
        }
    },
    fromSlice(s: c.Slice): ProposalReply {
        return {
            $: 'ProposalReply',
            isSet: s.loadBoolean(),
            actionType: s.loadUintBig(8),
            target: s.loadMaybeAddress(),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
            reasonHash: s.loadUintBig(256),
            votingEndsAt: s.loadUintBig(32),
            forVotes: s.loadCoins(),
            againstVotes: s.loadCoins(),
            abstainVotes: s.loadCoins(),
            executed: s.loadBoolean(),
        }
    },
    store(self: ProposalReply, b: c.Builder): void {
        b.storeBit(self.isSet);
        b.storeUint(self.actionType, 8);
        b.storeAddress(self.target);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
        b.storeUint(self.reasonHash, 256);
        b.storeUint(self.votingEndsAt, 32);
        b.storeCoins(self.forVotes);
        b.storeCoins(self.againstVotes);
        b.storeCoins(self.abstainVotes);
        b.storeBit(self.executed);
    },
    toCell(self: ProposalReply): c.Cell {
        return makeCellFrom<ProposalReply>(self, ProposalReply.store);
    }
}

/**
 > struct (0x10040001) CreateGovernanceProposal {
 >     queryId: uint64
 >     actionType: uint8
 >     target: address?
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 >     reasonHash: uint256
 >     votingEndsAt: uint32
 > }
 */
export interface CreateGovernanceProposal {
    readonly $: 'CreateGovernanceProposal'
    queryId: uint64
    actionType: uint8
    target: c.Address | null
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
    votingEndsAt: uint32
}

export const CreateGovernanceProposal = {
    PREFIX: 0x10040001,

    create(args: {
        queryId: uint64
        actionType: uint8
        target: c.Address | null
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
        votingEndsAt: uint32
    }): CreateGovernanceProposal {
        return {
            $: 'CreateGovernanceProposal',
            ...args
        }
    },
    fromSlice(s: c.Slice): CreateGovernanceProposal {
        loadAndCheckPrefix32(s, 0x10040001, 'CreateGovernanceProposal');
        return {
            $: 'CreateGovernanceProposal',
            queryId: s.loadUintBig(64),
            actionType: s.loadUintBig(8),
            target: s.loadMaybeAddress(),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
            reasonHash: s.loadUintBig(256),
            votingEndsAt: s.loadUintBig(32),
        }
    },
    store(self: CreateGovernanceProposal, b: c.Builder): void {
        b.storeUint(0x10040001, 32);
        b.storeUint(self.queryId, 64);
        b.storeUint(self.actionType, 8);
        b.storeAddress(self.target);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
        b.storeUint(self.reasonHash, 256);
        b.storeUint(self.votingEndsAt, 32);
    },
    toCell(self: CreateGovernanceProposal): c.Cell {
        return makeCellFrom<CreateGovernanceProposal>(self, CreateGovernanceProposal.store);
    }
}

/**
 > struct (0x10040002) SetVoteJettonWallet {
 >     queryId: uint64
 >     voteJettonWallet: address
 > }
 */
export interface SetVoteJettonWallet {
    readonly $: 'SetVoteJettonWallet'
    queryId: uint64
    voteJettonWallet: c.Address
}

export const SetVoteJettonWallet = {
    PREFIX: 0x10040002,

    create(args: {
        queryId: uint64
        voteJettonWallet: c.Address
    }): SetVoteJettonWallet {
        return {
            $: 'SetVoteJettonWallet',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetVoteJettonWallet {
        loadAndCheckPrefix32(s, 0x10040002, 'SetVoteJettonWallet');
        return {
            $: 'SetVoteJettonWallet',
            queryId: s.loadUintBig(64),
            voteJettonWallet: s.loadAddress(),
        }
    },
    store(self: SetVoteJettonWallet, b: c.Builder): void {
        b.storeUint(0x10040002, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.voteJettonWallet);
    },
    toCell(self: SetVoteJettonWallet): c.Cell {
        return makeCellFrom<SetVoteJettonWallet>(self, SetVoteJettonWallet.store);
    }
}

/**
 > struct (0x10040003) SetMinimumVoteAmount {
 >     queryId: uint64
 >     minVoteAmount: coins
 > }
 */
export interface SetMinimumVoteAmount {
    readonly $: 'SetMinimumVoteAmount'
    queryId: uint64
    minVoteAmount: coins
}

export const SetMinimumVoteAmount = {
    PREFIX: 0x10040003,

    create(args: {
        queryId: uint64
        minVoteAmount: coins
    }): SetMinimumVoteAmount {
        return {
            $: 'SetMinimumVoteAmount',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetMinimumVoteAmount {
        loadAndCheckPrefix32(s, 0x10040003, 'SetMinimumVoteAmount');
        return {
            $: 'SetMinimumVoteAmount',
            queryId: s.loadUintBig(64),
            minVoteAmount: s.loadCoins(),
        }
    },
    store(self: SetMinimumVoteAmount, b: c.Builder): void {
        b.storeUint(0x10040003, 32);
        b.storeUint(self.queryId, 64);
        b.storeCoins(self.minVoteAmount);
    },
    toCell(self: SetMinimumVoteAmount): c.Cell {
        return makeCellFrom<SetMinimumVoteAmount>(self, SetMinimumVoteAmount.store);
    }
}

/**
 > struct (0xd372158c) GovernanceTopUp {
 > }
 */
export interface GovernanceTopUp {
    readonly $: 'GovernanceTopUp'
}

export const GovernanceTopUp = {
    PREFIX: 0xd372158c,

    create(): GovernanceTopUp {
        return {
            $: 'GovernanceTopUp',
        }
    },
    fromSlice(s: c.Slice): GovernanceTopUp {
        loadAndCheckPrefix32(s, 0xd372158c, 'GovernanceTopUp');
        return {
            $: 'GovernanceTopUp',
        }
    },
    store(self: GovernanceTopUp, b: c.Builder): void {
        b.storeUint(0xd372158c, 32);
    },
    toCell(self: GovernanceTopUp): c.Cell {
        return makeCellFrom<GovernanceTopUp>(self, GovernanceTopUp.store);
    }
}

/**
 > type ForwardPayloadRemainder = RemainingBitsAndRefs
 */
export type ForwardPayloadRemainder = RemainingBitsAndRefs

export const ForwardPayloadRemainder = {
    fromSlice(s: c.Slice): ForwardPayloadRemainder {
        return loadTolkRemaining(s);
    },
    store(self: ForwardPayloadRemainder, b: c.Builder): void {
        storeTolkRemaining(self, b);
    },
    toCell(self: ForwardPayloadRemainder): c.Cell {
        return makeCellFrom<ForwardPayloadRemainder>(self, ForwardPayloadRemainder.store);
    }
}

/**
 > struct (0b0) PayloadInline {
 >     value: RemainingBitsAndRefs
 > }
 */
export interface PayloadInline {
    readonly $: 'PayloadInline'
    value: RemainingBitsAndRefs
}

export const PayloadInline = {
    PREFIX: 0b0,

    create(args: {
        value: RemainingBitsAndRefs
    }): PayloadInline {
        return {
            $: 'PayloadInline',
            ...args
        }
    },
    fromSlice(s: c.Slice): PayloadInline {
        loadAndCheckPrefix(s, 0b0, 1, 'PayloadInline');
        return {
            $: 'PayloadInline',
            value: loadTolkRemaining(s),
        }
    },
    store(self: PayloadInline, b: c.Builder): void {
        b.storeUint(0b0, 1);
        storeTolkRemaining(self.value, b);
    },
    toCell(self: PayloadInline): c.Cell {
        return makeCellFrom<PayloadInline>(self, PayloadInline.store);
    }
}

/**
 > struct (0b1) PayloadInRef {
 >     value: Cell<RemainingBitsAndRefs>
 > }
 */
export interface PayloadInRef {
    readonly $: 'PayloadInRef'
    value: CellRef<RemainingBitsAndRefs>
}

export const PayloadInRef = {
    PREFIX: 0b1,

    create(args: {
        value: CellRef<RemainingBitsAndRefs>
    }): PayloadInRef {
        return {
            $: 'PayloadInRef',
            ...args
        }
    },
    fromSlice(s: c.Slice): PayloadInRef {
        loadAndCheckPrefix(s, 0b1, 1, 'PayloadInRef');
        return {
            $: 'PayloadInRef',
            value: loadCellRef<RemainingBitsAndRefs>(s, loadTolkRemaining),
        }
    },
    store(self: PayloadInRef, b: c.Builder): void {
        b.storeUint(0b1, 1);
        storeCellRef<RemainingBitsAndRefs>(self.value, b, storeTolkRemaining);
    },
    toCell(self: PayloadInRef): c.Cell {
        return makeCellFrom<PayloadInRef>(self, PayloadInRef.store);
    }
}

/**
 > struct (0x7362d09c) TransferNotificationForRecipient {
 >     queryId: uint64
 >     jettonAmount: coins
 >     transferInitiator: address?
 >     forwardPayload: ForwardPayloadRemainder
 > }
 */
export interface TransferNotificationForRecipient {
    readonly $: 'TransferNotificationForRecipient'
    queryId: uint64
    jettonAmount: coins
    transferInitiator: c.Address | null
    forwardPayload: PayloadInline | PayloadInRef
}

export const TransferNotificationForRecipient = {
    PREFIX: 0x7362d09c,

    create(args: {
        queryId: uint64
        jettonAmount: coins
        transferInitiator: c.Address | null
        forwardPayload: PayloadInline | PayloadInRef
    }): TransferNotificationForRecipient {
        return {
            $: 'TransferNotificationForRecipient',
            ...args
        }
    },
    fromSlice(s: c.Slice): TransferNotificationForRecipient {
        loadAndCheckPrefix32(s, 0x7362d09c, 'TransferNotificationForRecipient');
        return {
            $: 'TransferNotificationForRecipient',
            queryId: s.loadUintBig(64),
            jettonAmount: s.loadCoins(),
            transferInitiator: s.loadMaybeAddress(),
            forwardPayload: lookupPrefix(s, 0b0, 1) ? PayloadInline.fromSlice(s) :
                lookupPrefix(s, 0b1, 1) ? PayloadInRef.fromSlice(s) :
                throwNonePrefixMatch('TransferNotificationForRecipient.forwardPayload'),
        }
    },
    store(self: TransferNotificationForRecipient, b: c.Builder): void {
        b.storeUint(0x7362d09c, 32);
        b.storeUint(self.queryId, 64);
        b.storeCoins(self.jettonAmount);
        b.storeAddress(self.transferInitiator);
        switch (self.forwardPayload.$) {
            case 'PayloadInline':
                PayloadInline.store(self.forwardPayload, b);
                break;
            case 'PayloadInRef':
                PayloadInRef.store(self.forwardPayload, b);
                break;
        }
    },
    toCell(self: TransferNotificationForRecipient): c.Cell {
        return makeCellFrom<TransferNotificationForRecipient>(self, TransferNotificationForRecipient.store);
    }
}

// ————————————————————————————————————————————
//    class TgBtcCatGovernor
//

interface ExtraSendOptions {
    bounce?: boolean                    // default: false
    sendMode?: SendMode                 // default: SendMode.PAY_GAS_SEPARATELY
    extraCurrencies?: c.ExtraCurrency   // default: empty dict
}

interface DeployedAddrOptions {
    workchain?: number                  // default: 0 (basechain)
    toShard?: { fixedPrefixLength: number; closeTo: c.Address }
    overrideContractCode?: c.Cell
}

function calculateDeployedAddress(code: c.Cell, data: c.Cell, options: DeployedAddrOptions): c.Address {
    const stateInitCell = beginCell().store(c.storeStateInit({
        code,
        data,
        splitDepth: options.toShard?.fixedPrefixLength,
        special: null,
        libraries: null,
    })).endCell();

    let addrHash = stateInitCell.hash();
    if (options.toShard) {
        const shardDepth = options.toShard.fixedPrefixLength;
        addrHash = beginCell()
            .storeBits(new c.BitString(options.toShard.closeTo.hash, 0, shardDepth))
            .storeBits(new c.BitString(stateInitCell.hash(), shardDepth, 256 - shardDepth))
            .endCell()
            .beginParse().loadBuffer(32);
    }

    return new c.Address(options.workchain ?? 0, addrHash);
}

export class TgBtcCatGovernor implements c.Contract {
    static CodeCell = c.Cell.fromBase64('te6ccgECDQEAAm8AART/APSkE/S88sgLAQIBYgIDAgLPBAUCAUgJCgH3PiRkTDgINcsIIAgAAyObDHtRND6SPpI+gDTP/QF+JIlxwXy4ZEF0z8x0wf6UNMP0w/T/9cLHyOBJxC78uGSIoEnELvy4ZIg+CO88uGXJqQGyMsHFfpUE8sPyw/L/8sfz4gAEEAGgED0QwPI+lIS+lIB+gISyz/0AMntVIAYAaTXLAKOEdcsI7N7oyzy4ZTTP9MH0//R4NcsBo4U10zQ1ywjs3ujLPLhlNM/0wfT/9Hg8sGUgAfLg1ywjmxaE5OMC1ywggCAAFI4iMe1E0PpI+kgx+JIixwXy4ZEC0z8x+kgwAcj6UvpSzsntVODXLCCAIAAcjicx7UTQ+kj6SPoAMfiSI8cF8uGRA9M/MfoAMALI+lL6UgH6As7J7VTg1ywmm5CsZDGRMOCEDwHHAPL0BwH8Me1E0PpI+kj6ANY/9AX4kiTHBfLhmQXTPzH6APpQMVMTvvLhmPABMCDAAZF/lSDAAsMA4pF/lSDAA8MA4vLhlVMXgED0DvLhltMH+lDTD9MP0//TH/oA+gD6ANIA0fgjJbvy4ZcqwAGUOlAroJ0KwAKSC6CUUAugCuIB4gfICABmywcW+lQUyw8Syw/L/8sfWPoCAfoCUAP6AhLKAEAWgED0QwPI+lIS+lIB+gISzvQAye1UABu7WN7UTQ+kj6SPoAMFiAIBIAsMACO0xz2omh9JBj9JBj9ABjrhZ/AAf7YRfaiaH0kGP0kGP0AGOmfmPoCwCB6BzfQzhg4ODaqOIiqOAAQOHDpg/0oaYfph+n/6Y/9AH0AfQBpAGi/qshA=');

    static Errors = {
        'GovErrors.NotGovernor': 401,
        'GovErrors.InvalidFee': 402,
        'GovErrors.InvalidVotePayload': 404,
        'GovErrors.InvalidVoteSide': 405,
        'GovErrors.UnknownProposal': 406,
        'GovErrors.VotingClosed': 407,
        'GovErrors.VoteTooSmall': 408,
        'GovErrors.NotVoteJettonWallet': 409,
        'GovErrors.InvalidMessage': 65535,
    }

    readonly address: c.Address
    readonly init: { code: c.Cell, data: c.Cell } | undefined

    protected constructor(address: c.Address, init?: { code: c.Cell, data: c.Cell }) {
        this.address = address;
        this.init = init;
    }

    static fromAddress(address: c.Address) {
        return new TgBtcCatGovernor(address);
    }

    static fromStorage(emptyStorage: {
        admin: c.Address
        voteJettonWallet: c.Address
        minVoteAmount: coins
        nextProposalId: uint64
        proposals: c.Dictionary<uint64, Proposal> /* = [] */
    }, deployedOptions?: DeployedAddrOptions) {
        const initialState = {
            code: deployedOptions?.overrideContractCode ?? TgBtcCatGovernor.CodeCell,
            data: GovernorStorage.toCell(GovernorStorage.create(emptyStorage)),
        };
        const address = calculateDeployedAddress(initialState.code, initialState.data, deployedOptions ?? {});
        return new TgBtcCatGovernor(address, initialState);
    }

    static createCellOfCreateGovernanceProposal(body: {
        queryId: uint64
        actionType: uint8
        target: c.Address | null
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
        votingEndsAt: uint32
    }) {
        return CreateGovernanceProposal.toCell(CreateGovernanceProposal.create(body));
    }

    static createCellOfSetVoteJettonWallet(body: {
        queryId: uint64
        voteJettonWallet: c.Address
    }) {
        return SetVoteJettonWallet.toCell(SetVoteJettonWallet.create(body));
    }

    static createCellOfSetMinimumVoteAmount(body: {
        queryId: uint64
        minVoteAmount: coins
    }) {
        return SetMinimumVoteAmount.toCell(SetMinimumVoteAmount.create(body));
    }

    static createCellOfTransferNotificationForRecipient(body: {
        queryId: uint64
        jettonAmount: coins
        transferInitiator: c.Address | null
        forwardPayload: PayloadInline | PayloadInRef
    }) {
        return TransferNotificationForRecipient.toCell(TransferNotificationForRecipient.create(body));
    }

    static createCellOfGovernanceTopUp(body: {
    }) {
        return GovernanceTopUp.toCell(GovernanceTopUp.create());
    }

    async sendDeploy(provider: ContractProvider, via: Sender, msgValue: coins, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: c.Cell.EMPTY,
            ...extraOptions
        });
    }

    async sendCreateGovernanceProposal(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        actionType: uint8
        target: c.Address | null
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
        votingEndsAt: uint32
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: CreateGovernanceProposal.toCell(CreateGovernanceProposal.create(body)),
            ...extraOptions
        });
    }

    async sendSetVoteJettonWallet(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        voteJettonWallet: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetVoteJettonWallet.toCell(SetVoteJettonWallet.create(body)),
            ...extraOptions
        });
    }

    async sendSetMinimumVoteAmount(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        minVoteAmount: coins
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetMinimumVoteAmount.toCell(SetMinimumVoteAmount.create(body)),
            ...extraOptions
        });
    }

    async sendTransferNotificationForRecipient(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        jettonAmount: coins
        transferInitiator: c.Address | null
        forwardPayload: PayloadInline | PayloadInRef
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: TransferNotificationForRecipient.toCell(TransferNotificationForRecipient.create(body)),
            ...extraOptions
        });
    }

    async sendGovernanceTopUp(provider: ContractProvider, via: Sender, msgValue: coins, body: {
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: GovernanceTopUp.toCell(GovernanceTopUp.create()),
            ...extraOptions
        });
    }

    async getProposal(provider: ContractProvider, proposalId: uint64): Promise<ProposalReply> {
        const r = StackReader.fromGetMethod(11, await provider.get('get_proposal', [
            { type: 'int', value: proposalId },
        ]));
        return ({
            $: 'ProposalReply',
            isSet: r.readBoolean(),
            actionType: r.readBigInt(),
            target: r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            buyFeeBps: r.readBigInt(),
            sellFeeBps: r.readBigInt(),
            reasonHash: r.readBigInt(),
            votingEndsAt: r.readBigInt(),
            forVotes: r.readBigInt(),
            againstVotes: r.readBigInt(),
            abstainVotes: r.readBigInt(),
            executed: r.readBoolean(),
        });
    }

    async getNextProposalId(provider: ContractProvider): Promise<uint64> {
        const r = StackReader.fromGetMethod(1, await provider.get('get_next_proposal_id', []));
        return r.readBigInt();
    }

    async getVoteConfig(provider: ContractProvider): Promise<[
        c.Address,
        coins,
        c.Address,
    ]> {
        const r = StackReader.fromGetMethod(3, await provider.get('get_vote_config', []));
        return [
            r.readSlice().loadAddress(),
            r.readBigInt(),
            r.readSlice().loadAddress(),
        ];
    }
}
