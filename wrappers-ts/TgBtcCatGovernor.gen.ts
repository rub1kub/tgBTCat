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
 >     auxTarget: Cell<address>?
 >     flags: uint8
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 >     reasonHash: uint256
 >     votingEndsAt: uint32
 >     forVotes: coins
 >     againstVotes: coins
 >     abstainVotes: coins
 >     executed: bool
 >     rawExecution: Cell<RawExecution>?
 > }
 */
export interface Proposal {
    readonly $: 'Proposal'
    actionType: uint8
    target: c.Address | null
    auxTarget: CellRef<c.Address> | null /* = null */
    flags: uint8 /* = 0 */
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
    votingEndsAt: uint32
    forVotes: coins
    againstVotes: coins
    abstainVotes: coins
    executed: boolean
    rawExecution: CellRef<RawExecution> | null /* = null */
}

export const Proposal = {
    create(args: {
        actionType: uint8
        target: c.Address | null
        auxTarget?: CellRef<c.Address> | null /* = null */
        flags?: uint8 /* = 0 */
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
        votingEndsAt: uint32
        forVotes: coins
        againstVotes: coins
        abstainVotes: coins
        executed: boolean
        rawExecution?: CellRef<RawExecution> | null /* = null */
    }): Proposal {
        return {
            $: 'Proposal',
            auxTarget: null,
            flags: 0n,
            rawExecution: null,
            ...args
        }
    },
    fromSlice(s: c.Slice): Proposal {
        return {
            $: 'Proposal',
            actionType: s.loadUintBig(8),
            target: s.loadMaybeAddress(),
            auxTarget: s.loadBoolean() ? loadCellRef<c.Address>(s,
                (s) => s.loadAddress()
            ) : null,
            flags: s.loadUintBig(8),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
            reasonHash: s.loadUintBig(256),
            votingEndsAt: s.loadUintBig(32),
            forVotes: s.loadCoins(),
            againstVotes: s.loadCoins(),
            abstainVotes: s.loadCoins(),
            executed: s.loadBoolean(),
            rawExecution: s.loadBoolean() ? loadCellRef<RawExecution>(s, RawExecution.fromSlice) : null,
        }
    },
    store(self: Proposal, b: c.Builder): void {
        b.storeUint(self.actionType, 8);
        b.storeAddress(self.target);
        storeTolkNullable<CellRef<c.Address>>(self.auxTarget, b,
            (v,b) => { storeCellRef<c.Address>(v, b,
                (v,b) => b.storeAddress(v)
            ); }
        );
        b.storeUint(self.flags, 8);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
        b.storeUint(self.reasonHash, 256);
        b.storeUint(self.votingEndsAt, 32);
        b.storeCoins(self.forVotes);
        b.storeCoins(self.againstVotes);
        b.storeCoins(self.abstainVotes);
        b.storeBit(self.executed);
        storeTolkNullable<CellRef<RawExecution>>(self.rawExecution, b,
            (v,b) => storeCellRef<RawExecution>(v, b, RawExecution.store)
        );
    },
    toCell(self: Proposal): c.Cell {
        return makeCellFrom<Proposal>(self, Proposal.store);
    }
}

/**
 > struct RawExecution {
 >     dest: address
 >     value: coins
 >     body: cell
 > }
 */
export interface RawExecution {
    readonly $: 'RawExecution'
    dest: c.Address
    value: coins
    body: c.Cell
}

export const RawExecution = {
    create(args: {
        dest: c.Address
        value: coins
        body: c.Cell
    }): RawExecution {
        return {
            $: 'RawExecution',
            ...args
        }
    },
    fromSlice(s: c.Slice): RawExecution {
        return {
            $: 'RawExecution',
            dest: s.loadAddress(),
            value: s.loadCoins(),
            body: s.loadRef(),
        }
    },
    store(self: RawExecution, b: c.Builder): void {
        b.storeAddress(self.dest);
        b.storeCoins(self.value);
        b.storeRef(self.body);
    },
    toCell(self: RawExecution): c.Cell {
        return makeCellFrom<RawExecution>(self, RawExecution.store);
    }
}

/**
 > struct GovernorExecutionTargets {
 >     feeController: address?
 >     walletFeeRegistry: address?
 >     dexRegistry: address?
 > }
 */
export interface GovernorExecutionTargets {
    readonly $: 'GovernorExecutionTargets'
    feeController: c.Address | null
    walletFeeRegistry: c.Address | null
    dexRegistry: c.Address | null
}

export const GovernorExecutionTargets = {
    create(args: {
        feeController: c.Address | null
        walletFeeRegistry: c.Address | null
        dexRegistry: c.Address | null
    }): GovernorExecutionTargets {
        return {
            $: 'GovernorExecutionTargets',
            ...args
        }
    },
    fromSlice(s: c.Slice): GovernorExecutionTargets {
        return {
            $: 'GovernorExecutionTargets',
            feeController: s.loadMaybeAddress(),
            walletFeeRegistry: s.loadMaybeAddress(),
            dexRegistry: s.loadMaybeAddress(),
        }
    },
    store(self: GovernorExecutionTargets, b: c.Builder): void {
        b.storeAddress(self.feeController);
        b.storeAddress(self.walletFeeRegistry);
        b.storeAddress(self.dexRegistry);
    },
    toCell(self: GovernorExecutionTargets): c.Cell {
        return makeCellFrom<GovernorExecutionTargets>(self, GovernorExecutionTargets.store);
    }
}

/**
 > struct GovernorExecutionConfig {
 >     targets: Cell<GovernorExecutionTargets>?
 >     minQuorumVotes: coins
 >     executionValue: coins
 >     runtime: Cell<GovernorRuntimeExecutionConfig>?
 > }
 */
export interface GovernorExecutionConfig {
    readonly $: 'GovernorExecutionConfig'
    targets: CellRef<GovernorExecutionTargets> | null /* = null */
    minQuorumVotes: coins
    executionValue: coins
    runtime: CellRef<GovernorRuntimeExecutionConfig> | null /* = null */
}

export const GovernorExecutionConfig = {
    create(args: {
        targets?: CellRef<GovernorExecutionTargets> | null /* = null */
        minQuorumVotes: coins
        executionValue: coins
        runtime?: CellRef<GovernorRuntimeExecutionConfig> | null /* = null */
    }): GovernorExecutionConfig {
        return {
            $: 'GovernorExecutionConfig',
            targets: null,
            runtime: null,
            ...args
        }
    },
    fromSlice(s: c.Slice): GovernorExecutionConfig {
        return {
            $: 'GovernorExecutionConfig',
            targets: s.loadBoolean() ? loadCellRef<GovernorExecutionTargets>(s, GovernorExecutionTargets.fromSlice) : null,
            minQuorumVotes: s.loadCoins(),
            executionValue: s.loadCoins(),
            runtime: s.loadBoolean() ? loadCellRef<GovernorRuntimeExecutionConfig>(s, GovernorRuntimeExecutionConfig.fromSlice) : null,
        }
    },
    store(self: GovernorExecutionConfig, b: c.Builder): void {
        storeTolkNullable<CellRef<GovernorExecutionTargets>>(self.targets, b,
            (v,b) => storeCellRef<GovernorExecutionTargets>(v, b, GovernorExecutionTargets.store)
        );
        b.storeCoins(self.minQuorumVotes);
        b.storeCoins(self.executionValue);
        storeTolkNullable<CellRef<GovernorRuntimeExecutionConfig>>(self.runtime, b,
            (v,b) => storeCellRef<GovernorRuntimeExecutionConfig>(v, b, GovernorRuntimeExecutionConfig.store)
        );
    },
    toCell(self: GovernorExecutionConfig): c.Cell {
        return makeCellFrom<GovernorExecutionConfig>(self, GovernorExecutionConfig.store);
    }
}

/**
 > struct GovernorRuntimeExecutionConfig {
 >     jettonMaster: address?
 >     feeTreasury: address?
 >     walletRouteValue: coins
 > }
 */
export interface GovernorRuntimeExecutionConfig {
    readonly $: 'GovernorRuntimeExecutionConfig'
    jettonMaster: c.Address | null
    feeTreasury: c.Address | null
    walletRouteValue: coins
}

export const GovernorRuntimeExecutionConfig = {
    create(args: {
        jettonMaster: c.Address | null
        feeTreasury: c.Address | null
        walletRouteValue: coins
    }): GovernorRuntimeExecutionConfig {
        return {
            $: 'GovernorRuntimeExecutionConfig',
            ...args
        }
    },
    fromSlice(s: c.Slice): GovernorRuntimeExecutionConfig {
        return {
            $: 'GovernorRuntimeExecutionConfig',
            jettonMaster: s.loadMaybeAddress(),
            feeTreasury: s.loadMaybeAddress(),
            walletRouteValue: s.loadCoins(),
        }
    },
    store(self: GovernorRuntimeExecutionConfig, b: c.Builder): void {
        b.storeAddress(self.jettonMaster);
        b.storeAddress(self.feeTreasury);
        b.storeCoins(self.walletRouteValue);
    },
    toCell(self: GovernorRuntimeExecutionConfig): c.Cell {
        return makeCellFrom<GovernorRuntimeExecutionConfig>(self, GovernorRuntimeExecutionConfig.store);
    }
}

/**
 > struct GovernorStorage {
 >     admin: address
 >     voteJettonWallet: address
 >     minVoteAmount: coins
 >     nextProposalId: uint64
 >     proposals: map<uint64, Proposal>
 >     executionConfig: Cell<GovernorExecutionConfig>?
 > }
 */
export interface GovernorStorage {
    readonly $: 'GovernorStorage'
    admin: c.Address
    voteJettonWallet: c.Address
    minVoteAmount: coins
    nextProposalId: uint64
    proposals: c.Dictionary<uint64, Proposal> /* = [] */
    executionConfig: CellRef<GovernorExecutionConfig> | null /* = null */
}

export const GovernorStorage = {
    create(args: {
        admin: c.Address
        voteJettonWallet: c.Address
        minVoteAmount: coins
        nextProposalId: uint64
        proposals: c.Dictionary<uint64, Proposal> /* = [] */
        executionConfig?: CellRef<GovernorExecutionConfig> | null /* = null */
    }): GovernorStorage {
        return {
            $: 'GovernorStorage',
            executionConfig: null,
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
            executionConfig: s.loadBoolean() ? loadCellRef<GovernorExecutionConfig>(s, GovernorExecutionConfig.fromSlice) : null,
        }
    },
    store(self: GovernorStorage, b: c.Builder): void {
        b.storeAddress(self.admin);
        b.storeAddress(self.voteJettonWallet);
        b.storeCoins(self.minVoteAmount);
        b.storeUint(self.nextProposalId, 64);
        b.storeDict<uint64, Proposal>(self.proposals, c.Dictionary.Keys.BigUint(64), createDictionaryValue<Proposal>(Proposal.fromSlice, Proposal.store));
        storeTolkNullable<CellRef<GovernorExecutionConfig>>(self.executionConfig, b,
            (v,b) => storeCellRef<GovernorExecutionConfig>(v, b, GovernorExecutionConfig.store)
        );
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
 >     auxTarget: address?
 >     flags: uint8
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 >     reasonHash: uint256
 >     votingEndsAt: uint32
 >     forVotes: coins
 >     againstVotes: coins
 >     abstainVotes: coins
 >     executed: bool
 >     hasRawExecution: bool
 > }
 */
export interface ProposalReply {
    readonly $: 'ProposalReply'
    isSet: boolean
    actionType: uint8
    target: c.Address | null
    auxTarget: c.Address | null
    flags: uint8
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
    votingEndsAt: uint32
    forVotes: coins
    againstVotes: coins
    abstainVotes: coins
    executed: boolean
    hasRawExecution: boolean
}

export const ProposalReply = {
    create(args: {
        isSet: boolean
        actionType: uint8
        target: c.Address | null
        auxTarget: c.Address | null
        flags: uint8
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
        votingEndsAt: uint32
        forVotes: coins
        againstVotes: coins
        abstainVotes: coins
        executed: boolean
        hasRawExecution: boolean
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
            auxTarget: s.loadMaybeAddress(),
            flags: s.loadUintBig(8),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
            reasonHash: s.loadUintBig(256),
            votingEndsAt: s.loadUintBig(32),
            forVotes: s.loadCoins(),
            againstVotes: s.loadCoins(),
            abstainVotes: s.loadCoins(),
            executed: s.loadBoolean(),
            hasRawExecution: s.loadBoolean(),
        }
    },
    store(self: ProposalReply, b: c.Builder): void {
        b.storeBit(self.isSet);
        b.storeUint(self.actionType, 8);
        b.storeAddress(self.target);
        b.storeAddress(self.auxTarget);
        b.storeUint(self.flags, 8);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
        b.storeUint(self.reasonHash, 256);
        b.storeUint(self.votingEndsAt, 32);
        b.storeCoins(self.forVotes);
        b.storeCoins(self.againstVotes);
        b.storeCoins(self.abstainVotes);
        b.storeBit(self.executed);
        b.storeBit(self.hasRawExecution);
    },
    toCell(self: ProposalReply): c.Cell {
        return makeCellFrom<ProposalReply>(self, ProposalReply.store);
    }
}

/**
 > struct RawExecutionReply {
 >     isSet: bool
 >     dest: address?
 >     value: coins
 >     body: cell?
 > }
 */
export interface RawExecutionReply {
    readonly $: 'RawExecutionReply'
    isSet: boolean
    dest: c.Address | null
    value: coins
    body: c.Cell | null
}

export const RawExecutionReply = {
    create(args: {
        isSet: boolean
        dest: c.Address | null
        value: coins
        body: c.Cell | null
    }): RawExecutionReply {
        return {
            $: 'RawExecutionReply',
            ...args
        }
    },
    fromSlice(s: c.Slice): RawExecutionReply {
        return {
            $: 'RawExecutionReply',
            isSet: s.loadBoolean(),
            dest: s.loadMaybeAddress(),
            value: s.loadCoins(),
            body: s.loadBoolean() ? s.loadRef() : null,
        }
    },
    store(self: RawExecutionReply, b: c.Builder): void {
        b.storeBit(self.isSet);
        b.storeAddress(self.dest);
        b.storeCoins(self.value);
        storeTolkNullable<c.Cell>(self.body, b,
            (v,b) => b.storeRef(v)
        );
    },
    toCell(self: RawExecutionReply): c.Cell {
        return makeCellFrom<RawExecutionReply>(self, RawExecutionReply.store);
    }
}

/**
 > struct (0x10010001) SetGlobalFees {
 >     queryId: uint64
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 > }
 */
export interface SetGlobalFees {
    readonly $: 'SetGlobalFees'
    queryId: uint64
    buyFeeBps: uint16
    sellFeeBps: uint16
}

export const SetGlobalFees = {
    PREFIX: 0x10010001,

    create(args: {
        queryId: uint64
        buyFeeBps: uint16
        sellFeeBps: uint16
    }): SetGlobalFees {
        return {
            $: 'SetGlobalFees',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetGlobalFees {
        loadAndCheckPrefix32(s, 0x10010001, 'SetGlobalFees');
        return {
            $: 'SetGlobalFees',
            queryId: s.loadUintBig(64),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
        }
    },
    store(self: SetGlobalFees, b: c.Builder): void {
        b.storeUint(0x10010001, 32);
        b.storeUint(self.queryId, 64);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
    },
    toCell(self: SetGlobalFees): c.Cell {
        return makeCellFrom<SetGlobalFees>(self, SetGlobalFees.store);
    }
}

/**
 > struct (0x10020001) SetWalletFees {
 >     queryId: uint64
 >     target: address
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 >     reasonHash: uint256
 > }
 */
export interface SetWalletFees {
    readonly $: 'SetWalletFees'
    queryId: uint64
    target: c.Address
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
}

export const SetWalletFees = {
    PREFIX: 0x10020001,

    create(args: {
        queryId: uint64
        target: c.Address
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
    }): SetWalletFees {
        return {
            $: 'SetWalletFees',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetWalletFees {
        loadAndCheckPrefix32(s, 0x10020001, 'SetWalletFees');
        return {
            $: 'SetWalletFees',
            queryId: s.loadUintBig(64),
            target: s.loadAddress(),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
            reasonHash: s.loadUintBig(256),
        }
    },
    store(self: SetWalletFees, b: c.Builder): void {
        b.storeUint(0x10020001, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.target);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
        b.storeUint(self.reasonHash, 256);
    },
    toCell(self: SetWalletFees): c.Cell {
        return makeCellFrom<SetWalletFees>(self, SetWalletFees.store);
    }
}

/**
 > struct (0x10020002) ClearWalletFees {
 >     queryId: uint64
 >     target: address
 > }
 */
export interface ClearWalletFees {
    readonly $: 'ClearWalletFees'
    queryId: uint64
    target: c.Address
}

export const ClearWalletFees = {
    PREFIX: 0x10020002,

    create(args: {
        queryId: uint64
        target: c.Address
    }): ClearWalletFees {
        return {
            $: 'ClearWalletFees',
            ...args
        }
    },
    fromSlice(s: c.Slice): ClearWalletFees {
        loadAndCheckPrefix32(s, 0x10020002, 'ClearWalletFees');
        return {
            $: 'ClearWalletFees',
            queryId: s.loadUintBig(64),
            target: s.loadAddress(),
        }
    },
    store(self: ClearWalletFees, b: c.Builder): void {
        b.storeUint(0x10020002, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.target);
    },
    toCell(self: ClearWalletFees): c.Cell {
        return makeCellFrom<ClearWalletFees>(self, ClearWalletFees.store);
    }
}

/**
 > struct (0x10030001) AddDexWallet {
 >     queryId: uint64
 >     wallet: address
 > }
 */
export interface AddDexWallet {
    readonly $: 'AddDexWallet'
    queryId: uint64
    wallet: c.Address
}

export const AddDexWallet = {
    PREFIX: 0x10030001,

    create(args: {
        queryId: uint64
        wallet: c.Address
    }): AddDexWallet {
        return {
            $: 'AddDexWallet',
            ...args
        }
    },
    fromSlice(s: c.Slice): AddDexWallet {
        loadAndCheckPrefix32(s, 0x10030001, 'AddDexWallet');
        return {
            $: 'AddDexWallet',
            queryId: s.loadUintBig(64),
            wallet: s.loadAddress(),
        }
    },
    store(self: AddDexWallet, b: c.Builder): void {
        b.storeUint(0x10030001, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.wallet);
    },
    toCell(self: AddDexWallet): c.Cell {
        return makeCellFrom<AddDexWallet>(self, AddDexWallet.store);
    }
}

/**
 > struct (0x10030002) RemoveDexWallet {
 >     queryId: uint64
 >     wallet: address
 > }
 */
export interface RemoveDexWallet {
    readonly $: 'RemoveDexWallet'
    queryId: uint64
    wallet: c.Address
}

export const RemoveDexWallet = {
    PREFIX: 0x10030002,

    create(args: {
        queryId: uint64
        wallet: c.Address
    }): RemoveDexWallet {
        return {
            $: 'RemoveDexWallet',
            ...args
        }
    },
    fromSlice(s: c.Slice): RemoveDexWallet {
        loadAndCheckPrefix32(s, 0x10030002, 'RemoveDexWallet');
        return {
            $: 'RemoveDexWallet',
            queryId: s.loadUintBig(64),
            wallet: s.loadAddress(),
        }
    },
    store(self: RemoveDexWallet, b: c.Builder): void {
        b.storeUint(0x10030002, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.wallet);
    },
    toCell(self: RemoveDexWallet): c.Cell {
        return makeCellFrom<RemoveDexWallet>(self, RemoveDexWallet.store);
    }
}

/**
 > struct (0x10040001) CreateGovernanceProposal {
 >     queryId: uint64
 >     actionType: uint8
 >     target: address?
 >     auxTarget: address?
 >     flags: uint8
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
    auxTarget: c.Address | null
    flags: uint8
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
        auxTarget: c.Address | null
        flags: uint8
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
            auxTarget: s.loadMaybeAddress(),
            flags: s.loadUintBig(8),
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
        b.storeAddress(self.auxTarget);
        b.storeUint(self.flags, 8);
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
 > struct (0x10040004) SetExecutionTargets {
 >     queryId: uint64
 >     feeController: address?
 >     walletFeeRegistry: address?
 >     dexRegistry: address?
 > }
 */
export interface SetExecutionTargets {
    readonly $: 'SetExecutionTargets'
    queryId: uint64
    feeController: c.Address | null
    walletFeeRegistry: c.Address | null
    dexRegistry: c.Address | null
}

export const SetExecutionTargets = {
    PREFIX: 0x10040004,

    create(args: {
        queryId: uint64
        feeController: c.Address | null
        walletFeeRegistry: c.Address | null
        dexRegistry: c.Address | null
    }): SetExecutionTargets {
        return {
            $: 'SetExecutionTargets',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetExecutionTargets {
        loadAndCheckPrefix32(s, 0x10040004, 'SetExecutionTargets');
        return {
            $: 'SetExecutionTargets',
            queryId: s.loadUintBig(64),
            feeController: s.loadMaybeAddress(),
            walletFeeRegistry: s.loadMaybeAddress(),
            dexRegistry: s.loadMaybeAddress(),
        }
    },
    store(self: SetExecutionTargets, b: c.Builder): void {
        b.storeUint(0x10040004, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.feeController);
        b.storeAddress(self.walletFeeRegistry);
        b.storeAddress(self.dexRegistry);
    },
    toCell(self: SetExecutionTargets): c.Cell {
        return makeCellFrom<SetExecutionTargets>(self, SetExecutionTargets.store);
    }
}

/**
 > struct (0x10040005) SetGovernanceQuorum {
 >     queryId: uint64
 >     minQuorumVotes: coins
 > }
 */
export interface SetGovernanceQuorum {
    readonly $: 'SetGovernanceQuorum'
    queryId: uint64
    minQuorumVotes: coins
}

export const SetGovernanceQuorum = {
    PREFIX: 0x10040005,

    create(args: {
        queryId: uint64
        minQuorumVotes: coins
    }): SetGovernanceQuorum {
        return {
            $: 'SetGovernanceQuorum',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetGovernanceQuorum {
        loadAndCheckPrefix32(s, 0x10040005, 'SetGovernanceQuorum');
        return {
            $: 'SetGovernanceQuorum',
            queryId: s.loadUintBig(64),
            minQuorumVotes: s.loadCoins(),
        }
    },
    store(self: SetGovernanceQuorum, b: c.Builder): void {
        b.storeUint(0x10040005, 32);
        b.storeUint(self.queryId, 64);
        b.storeCoins(self.minQuorumVotes);
    },
    toCell(self: SetGovernanceQuorum): c.Cell {
        return makeCellFrom<SetGovernanceQuorum>(self, SetGovernanceQuorum.store);
    }
}

/**
 > struct (0x10040006) SetExecutionValue {
 >     queryId: uint64
 >     executionValue: coins
 > }
 */
export interface SetExecutionValue {
    readonly $: 'SetExecutionValue'
    queryId: uint64
    executionValue: coins
}

export const SetExecutionValue = {
    PREFIX: 0x10040006,

    create(args: {
        queryId: uint64
        executionValue: coins
    }): SetExecutionValue {
        return {
            $: 'SetExecutionValue',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetExecutionValue {
        loadAndCheckPrefix32(s, 0x10040006, 'SetExecutionValue');
        return {
            $: 'SetExecutionValue',
            queryId: s.loadUintBig(64),
            executionValue: s.loadCoins(),
        }
    },
    store(self: SetExecutionValue, b: c.Builder): void {
        b.storeUint(0x10040006, 32);
        b.storeUint(self.queryId, 64);
        b.storeCoins(self.executionValue);
    },
    toCell(self: SetExecutionValue): c.Cell {
        return makeCellFrom<SetExecutionValue>(self, SetExecutionValue.store);
    }
}

/**
 > struct (0x10040007) ExecuteProposal {
 >     queryId: uint64
 >     proposalId: uint64
 > }
 */
export interface ExecuteProposal {
    readonly $: 'ExecuteProposal'
    queryId: uint64
    proposalId: uint64
}

export const ExecuteProposal = {
    PREFIX: 0x10040007,

    create(args: {
        queryId: uint64
        proposalId: uint64
    }): ExecuteProposal {
        return {
            $: 'ExecuteProposal',
            ...args
        }
    },
    fromSlice(s: c.Slice): ExecuteProposal {
        loadAndCheckPrefix32(s, 0x10040007, 'ExecuteProposal');
        return {
            $: 'ExecuteProposal',
            queryId: s.loadUintBig(64),
            proposalId: s.loadUintBig(64),
        }
    },
    store(self: ExecuteProposal, b: c.Builder): void {
        b.storeUint(0x10040007, 32);
        b.storeUint(self.queryId, 64);
        b.storeUint(self.proposalId, 64);
    },
    toCell(self: ExecuteProposal): c.Cell {
        return makeCellFrom<ExecuteProposal>(self, ExecuteProposal.store);
    }
}

/**
 > struct (0x10040008) SetWalletRuntimeExecution {
 >     queryId: uint64
 >     jettonMaster: address?
 >     feeTreasury: address?
 >     walletRouteValue: coins
 > }
 */
export interface SetWalletRuntimeExecution {
    readonly $: 'SetWalletRuntimeExecution'
    queryId: uint64
    jettonMaster: c.Address | null
    feeTreasury: c.Address | null
    walletRouteValue: coins
}

export const SetWalletRuntimeExecution = {
    PREFIX: 0x10040008,

    create(args: {
        queryId: uint64
        jettonMaster: c.Address | null
        feeTreasury: c.Address | null
        walletRouteValue: coins
    }): SetWalletRuntimeExecution {
        return {
            $: 'SetWalletRuntimeExecution',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetWalletRuntimeExecution {
        loadAndCheckPrefix32(s, 0x10040008, 'SetWalletRuntimeExecution');
        return {
            $: 'SetWalletRuntimeExecution',
            queryId: s.loadUintBig(64),
            jettonMaster: s.loadMaybeAddress(),
            feeTreasury: s.loadMaybeAddress(),
            walletRouteValue: s.loadCoins(),
        }
    },
    store(self: SetWalletRuntimeExecution, b: c.Builder): void {
        b.storeUint(0x10040008, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.jettonMaster);
        b.storeAddress(self.feeTreasury);
        b.storeCoins(self.walletRouteValue);
    },
    toCell(self: SetWalletRuntimeExecution): c.Cell {
        return makeCellFrom<SetWalletRuntimeExecution>(self, SetWalletRuntimeExecution.store);
    }
}

/**
 > struct (0x10040009) ClaimJettonMasterAdmin {
 >     queryId: uint64
 >     jettonMaster: address
 >     claimValue: coins
 > }
 */
export interface ClaimJettonMasterAdmin {
    readonly $: 'ClaimJettonMasterAdmin'
    queryId: uint64
    jettonMaster: c.Address
    claimValue: coins
}

export const ClaimJettonMasterAdmin = {
    PREFIX: 0x10040009,

    create(args: {
        queryId: uint64
        jettonMaster: c.Address
        claimValue: coins
    }): ClaimJettonMasterAdmin {
        return {
            $: 'ClaimJettonMasterAdmin',
            ...args
        }
    },
    fromSlice(s: c.Slice): ClaimJettonMasterAdmin {
        loadAndCheckPrefix32(s, 0x10040009, 'ClaimJettonMasterAdmin');
        return {
            $: 'ClaimJettonMasterAdmin',
            queryId: s.loadUintBig(64),
            jettonMaster: s.loadAddress(),
            claimValue: s.loadCoins(),
        }
    },
    store(self: ClaimJettonMasterAdmin, b: c.Builder): void {
        b.storeUint(0x10040009, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.jettonMaster);
        b.storeCoins(self.claimValue);
    },
    toCell(self: ClaimJettonMasterAdmin): c.Cell {
        return makeCellFrom<ClaimJettonMasterAdmin>(self, ClaimJettonMasterAdmin.store);
    }
}

/**
 > struct (0x1004000a) CreateRawExecutionProposal {
 >     queryId: uint64
 >     dest: address
 >     value: coins
 >     body: cell
 >     reasonHash: uint256
 >     votingEndsAt: uint32
 > }
 */
export interface CreateRawExecutionProposal {
    readonly $: 'CreateRawExecutionProposal'
    queryId: uint64
    dest: c.Address
    value: coins
    body: c.Cell
    reasonHash: uint256
    votingEndsAt: uint32
}

export const CreateRawExecutionProposal = {
    PREFIX: 0x1004000a,

    create(args: {
        queryId: uint64
        dest: c.Address
        value: coins
        body: c.Cell
        reasonHash: uint256
        votingEndsAt: uint32
    }): CreateRawExecutionProposal {
        return {
            $: 'CreateRawExecutionProposal',
            ...args
        }
    },
    fromSlice(s: c.Slice): CreateRawExecutionProposal {
        loadAndCheckPrefix32(s, 0x1004000a, 'CreateRawExecutionProposal');
        return {
            $: 'CreateRawExecutionProposal',
            queryId: s.loadUintBig(64),
            dest: s.loadAddress(),
            value: s.loadCoins(),
            body: s.loadRef(),
            reasonHash: s.loadUintBig(256),
            votingEndsAt: s.loadUintBig(32),
        }
    },
    store(self: CreateRawExecutionProposal, b: c.Builder): void {
        b.storeUint(0x1004000a, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.dest);
        b.storeCoins(self.value);
        b.storeRef(self.body);
        b.storeUint(self.reasonHash, 256);
        b.storeUint(self.votingEndsAt, 32);
    },
    toCell(self: CreateRawExecutionProposal): c.Cell {
        return makeCellFrom<CreateRawExecutionProposal>(self, CreateRawExecutionProposal.store);
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

/**
 > struct (0xfb88e119) ClaimMinterAdmin {
 >     queryId: uint64
 > }
 */
export interface ClaimMinterAdmin {
    readonly $: 'ClaimMinterAdmin'
    queryId: uint64
}

export const ClaimMinterAdmin = {
    PREFIX: 0xfb88e119,

    create(args: {
        queryId: uint64
    }): ClaimMinterAdmin {
        return {
            $: 'ClaimMinterAdmin',
            ...args
        }
    },
    fromSlice(s: c.Slice): ClaimMinterAdmin {
        loadAndCheckPrefix32(s, 0xfb88e119, 'ClaimMinterAdmin');
        return {
            $: 'ClaimMinterAdmin',
            queryId: s.loadUintBig(64),
        }
    },
    store(self: ClaimMinterAdmin, b: c.Builder): void {
        b.storeUint(0xfb88e119, 32);
        b.storeUint(self.queryId, 64);
    },
    toCell(self: ClaimMinterAdmin): c.Cell {
        return makeCellFrom<ClaimMinterAdmin>(self, ClaimMinterAdmin.store);
    }
}

/**
 > struct (0x20020001) RouteSetWalletFeeRuntime {
 >     queryId: uint64
 >     walletOwner: address
 >     walletTonAmount: coins
 >     feeTreasury: address?
 >     globalBuyFeeBps: uint16
 >     globalSellFeeBps: uint16
 >     isDexWallet: bool
 > }
 */
export interface RouteSetWalletFeeRuntime {
    readonly $: 'RouteSetWalletFeeRuntime'
    queryId: uint64
    walletOwner: c.Address
    walletTonAmount: coins
    feeTreasury: c.Address | null
    globalBuyFeeBps: uint16
    globalSellFeeBps: uint16
    isDexWallet: boolean
}

export const RouteSetWalletFeeRuntime = {
    PREFIX: 0x20020001,

    create(args: {
        queryId: uint64
        walletOwner: c.Address
        walletTonAmount: coins
        feeTreasury: c.Address | null
        globalBuyFeeBps: uint16
        globalSellFeeBps: uint16
        isDexWallet: boolean
    }): RouteSetWalletFeeRuntime {
        return {
            $: 'RouteSetWalletFeeRuntime',
            ...args
        }
    },
    fromSlice(s: c.Slice): RouteSetWalletFeeRuntime {
        loadAndCheckPrefix32(s, 0x20020001, 'RouteSetWalletFeeRuntime');
        return {
            $: 'RouteSetWalletFeeRuntime',
            queryId: s.loadUintBig(64),
            walletOwner: s.loadAddress(),
            walletTonAmount: s.loadCoins(),
            feeTreasury: s.loadMaybeAddress(),
            globalBuyFeeBps: s.loadUintBig(16),
            globalSellFeeBps: s.loadUintBig(16),
            isDexWallet: s.loadBoolean(),
        }
    },
    store(self: RouteSetWalletFeeRuntime, b: c.Builder): void {
        b.storeUint(0x20020001, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.walletOwner);
        b.storeCoins(self.walletTonAmount);
        b.storeAddress(self.feeTreasury);
        b.storeUint(self.globalBuyFeeBps, 16);
        b.storeUint(self.globalSellFeeBps, 16);
        b.storeBit(self.isDexWallet);
    },
    toCell(self: RouteSetWalletFeeRuntime): c.Cell {
        return makeCellFrom<RouteSetWalletFeeRuntime>(self, RouteSetWalletFeeRuntime.store);
    }
}

/**
 > struct (0x20020002) RouteAddWalletDexAddress {
 >     queryId: uint64
 >     walletOwner: address
 >     walletTonAmount: coins
 >     wallet: address
 > }
 */
export interface RouteAddWalletDexAddress {
    readonly $: 'RouteAddWalletDexAddress'
    queryId: uint64
    walletOwner: c.Address
    walletTonAmount: coins
    wallet: c.Address
}

export const RouteAddWalletDexAddress = {
    PREFIX: 0x20020002,

    create(args: {
        queryId: uint64
        walletOwner: c.Address
        walletTonAmount: coins
        wallet: c.Address
    }): RouteAddWalletDexAddress {
        return {
            $: 'RouteAddWalletDexAddress',
            ...args
        }
    },
    fromSlice(s: c.Slice): RouteAddWalletDexAddress {
        loadAndCheckPrefix32(s, 0x20020002, 'RouteAddWalletDexAddress');
        return {
            $: 'RouteAddWalletDexAddress',
            queryId: s.loadUintBig(64),
            walletOwner: s.loadAddress(),
            walletTonAmount: s.loadCoins(),
            wallet: s.loadAddress(),
        }
    },
    store(self: RouteAddWalletDexAddress, b: c.Builder): void {
        b.storeUint(0x20020002, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.walletOwner);
        b.storeCoins(self.walletTonAmount);
        b.storeAddress(self.wallet);
    },
    toCell(self: RouteAddWalletDexAddress): c.Cell {
        return makeCellFrom<RouteAddWalletDexAddress>(self, RouteAddWalletDexAddress.store);
    }
}

/**
 > struct (0x20020003) RouteRemoveWalletDexAddress {
 >     queryId: uint64
 >     walletOwner: address
 >     walletTonAmount: coins
 >     wallet: address
 > }
 */
export interface RouteRemoveWalletDexAddress {
    readonly $: 'RouteRemoveWalletDexAddress'
    queryId: uint64
    walletOwner: c.Address
    walletTonAmount: coins
    wallet: c.Address
}

export const RouteRemoveWalletDexAddress = {
    PREFIX: 0x20020003,

    create(args: {
        queryId: uint64
        walletOwner: c.Address
        walletTonAmount: coins
        wallet: c.Address
    }): RouteRemoveWalletDexAddress {
        return {
            $: 'RouteRemoveWalletDexAddress',
            ...args
        }
    },
    fromSlice(s: c.Slice): RouteRemoveWalletDexAddress {
        loadAndCheckPrefix32(s, 0x20020003, 'RouteRemoveWalletDexAddress');
        return {
            $: 'RouteRemoveWalletDexAddress',
            queryId: s.loadUintBig(64),
            walletOwner: s.loadAddress(),
            walletTonAmount: s.loadCoins(),
            wallet: s.loadAddress(),
        }
    },
    store(self: RouteRemoveWalletDexAddress, b: c.Builder): void {
        b.storeUint(0x20020003, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.walletOwner);
        b.storeCoins(self.walletTonAmount);
        b.storeAddress(self.wallet);
    },
    toCell(self: RouteRemoveWalletDexAddress): c.Cell {
        return makeCellFrom<RouteRemoveWalletDexAddress>(self, RouteRemoveWalletDexAddress.store);
    }
}

/**
 > struct (0x20020004) RouteSetWalletSpecificFee {
 >     queryId: uint64
 >     walletOwner: address
 >     walletTonAmount: coins
 >     target: address
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 > }
 */
export interface RouteSetWalletSpecificFee {
    readonly $: 'RouteSetWalletSpecificFee'
    queryId: uint64
    walletOwner: c.Address
    walletTonAmount: coins
    target: c.Address
    buyFeeBps: uint16
    sellFeeBps: uint16
}

export const RouteSetWalletSpecificFee = {
    PREFIX: 0x20020004,

    create(args: {
        queryId: uint64
        walletOwner: c.Address
        walletTonAmount: coins
        target: c.Address
        buyFeeBps: uint16
        sellFeeBps: uint16
    }): RouteSetWalletSpecificFee {
        return {
            $: 'RouteSetWalletSpecificFee',
            ...args
        }
    },
    fromSlice(s: c.Slice): RouteSetWalletSpecificFee {
        loadAndCheckPrefix32(s, 0x20020004, 'RouteSetWalletSpecificFee');
        return {
            $: 'RouteSetWalletSpecificFee',
            queryId: s.loadUintBig(64),
            walletOwner: s.loadAddress(),
            walletTonAmount: s.loadCoins(),
            target: s.loadAddress(),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
        }
    },
    store(self: RouteSetWalletSpecificFee, b: c.Builder): void {
        b.storeUint(0x20020004, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.walletOwner);
        b.storeCoins(self.walletTonAmount);
        b.storeAddress(self.target);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
    },
    toCell(self: RouteSetWalletSpecificFee): c.Cell {
        return makeCellFrom<RouteSetWalletSpecificFee>(self, RouteSetWalletSpecificFee.store);
    }
}

/**
 > struct (0x20020005) RouteClearWalletSpecificFee {
 >     queryId: uint64
 >     walletOwner: address
 >     walletTonAmount: coins
 >     target: address
 > }
 */
export interface RouteClearWalletSpecificFee {
    readonly $: 'RouteClearWalletSpecificFee'
    queryId: uint64
    walletOwner: c.Address
    walletTonAmount: coins
    target: c.Address
}

export const RouteClearWalletSpecificFee = {
    PREFIX: 0x20020005,

    create(args: {
        queryId: uint64
        walletOwner: c.Address
        walletTonAmount: coins
        target: c.Address
    }): RouteClearWalletSpecificFee {
        return {
            $: 'RouteClearWalletSpecificFee',
            ...args
        }
    },
    fromSlice(s: c.Slice): RouteClearWalletSpecificFee {
        loadAndCheckPrefix32(s, 0x20020005, 'RouteClearWalletSpecificFee');
        return {
            $: 'RouteClearWalletSpecificFee',
            queryId: s.loadUintBig(64),
            walletOwner: s.loadAddress(),
            walletTonAmount: s.loadCoins(),
            target: s.loadAddress(),
        }
    },
    store(self: RouteClearWalletSpecificFee, b: c.Builder): void {
        b.storeUint(0x20020005, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.walletOwner);
        b.storeCoins(self.walletTonAmount);
        b.storeAddress(self.target);
    },
    toCell(self: RouteClearWalletSpecificFee): c.Cell {
        return makeCellFrom<RouteClearWalletSpecificFee>(self, RouteClearWalletSpecificFee.store);
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
    static CodeCell = c.Cell.fromBase64('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');

    static Errors = {
        'GovErrors.NotGovernor': 401,
        'GovErrors.InvalidFee': 402,
        'GovErrors.InvalidVotePayload': 404,
        'GovErrors.InvalidVoteSide': 405,
        'GovErrors.UnknownProposal': 406,
        'GovErrors.VotingClosed': 407,
        'GovErrors.VoteTooSmall': 408,
        'GovErrors.NotVoteJettonWallet': 409,
        'GovErrors.ProposalAlreadyExecuted': 410,
        'GovErrors.ProposalRejected': 411,
        'GovErrors.ExecutionTargetMissing': 412,
        'GovErrors.VotingOpen': 413,
        'GovErrors.InvalidActionType': 414,
        'GovErrors.ProposalFeeTooSmall': 419,
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
        executionConfig?: CellRef<GovernorExecutionConfig> | null /* = null */
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
        auxTarget: c.Address | null
        flags: uint8
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
        votingEndsAt: uint32
    }) {
        return CreateGovernanceProposal.toCell(CreateGovernanceProposal.create(body));
    }

    static createCellOfCreateRawExecutionProposal(body: {
        queryId: uint64
        dest: c.Address
        value: coins
        body: c.Cell
        reasonHash: uint256
        votingEndsAt: uint32
    }) {
        return CreateRawExecutionProposal.toCell(CreateRawExecutionProposal.create(body));
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

    static createCellOfSetExecutionTargets(body: {
        queryId: uint64
        feeController: c.Address | null
        walletFeeRegistry: c.Address | null
        dexRegistry: c.Address | null
    }) {
        return SetExecutionTargets.toCell(SetExecutionTargets.create(body));
    }

    static createCellOfSetGovernanceQuorum(body: {
        queryId: uint64
        minQuorumVotes: coins
    }) {
        return SetGovernanceQuorum.toCell(SetGovernanceQuorum.create(body));
    }

    static createCellOfSetExecutionValue(body: {
        queryId: uint64
        executionValue: coins
    }) {
        return SetExecutionValue.toCell(SetExecutionValue.create(body));
    }

    static createCellOfSetWalletRuntimeExecution(body: {
        queryId: uint64
        jettonMaster: c.Address | null
        feeTreasury: c.Address | null
        walletRouteValue: coins
    }) {
        return SetWalletRuntimeExecution.toCell(SetWalletRuntimeExecution.create(body));
    }

    static createCellOfClaimJettonMasterAdmin(body: {
        queryId: uint64
        jettonMaster: c.Address
        claimValue: coins
    }) {
        return ClaimJettonMasterAdmin.toCell(ClaimJettonMasterAdmin.create(body));
    }

    static createCellOfExecuteProposal(body: {
        queryId: uint64
        proposalId: uint64
    }) {
        return ExecuteProposal.toCell(ExecuteProposal.create(body));
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
        auxTarget: c.Address | null
        flags: uint8
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

    async sendCreateRawExecutionProposal(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        dest: c.Address
        value: coins
        body: c.Cell
        reasonHash: uint256
        votingEndsAt: uint32
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: CreateRawExecutionProposal.toCell(CreateRawExecutionProposal.create(body)),
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

    async sendSetExecutionTargets(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        feeController: c.Address | null
        walletFeeRegistry: c.Address | null
        dexRegistry: c.Address | null
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetExecutionTargets.toCell(SetExecutionTargets.create(body)),
            ...extraOptions
        });
    }

    async sendSetGovernanceQuorum(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        minQuorumVotes: coins
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetGovernanceQuorum.toCell(SetGovernanceQuorum.create(body)),
            ...extraOptions
        });
    }

    async sendSetExecutionValue(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        executionValue: coins
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetExecutionValue.toCell(SetExecutionValue.create(body)),
            ...extraOptions
        });
    }

    async sendSetWalletRuntimeExecution(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        jettonMaster: c.Address | null
        feeTreasury: c.Address | null
        walletRouteValue: coins
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetWalletRuntimeExecution.toCell(SetWalletRuntimeExecution.create(body)),
            ...extraOptions
        });
    }

    async sendClaimJettonMasterAdmin(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        jettonMaster: c.Address
        claimValue: coins
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: ClaimJettonMasterAdmin.toCell(ClaimJettonMasterAdmin.create(body)),
            ...extraOptions
        });
    }

    async sendExecuteProposal(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        proposalId: uint64
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: ExecuteProposal.toCell(ExecuteProposal.create(body)),
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
        const r = StackReader.fromGetMethod(14, await provider.get('get_proposal', [
            { type: 'int', value: proposalId },
        ]));
        return ({
            $: 'ProposalReply',
            isSet: r.readBoolean(),
            actionType: r.readBigInt(),
            target: r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            auxTarget: r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            flags: r.readBigInt(),
            buyFeeBps: r.readBigInt(),
            sellFeeBps: r.readBigInt(),
            reasonHash: r.readBigInt(),
            votingEndsAt: r.readBigInt(),
            forVotes: r.readBigInt(),
            againstVotes: r.readBigInt(),
            abstainVotes: r.readBigInt(),
            executed: r.readBoolean(),
            hasRawExecution: r.readBoolean(),
        });
    }

    async getRawExecution(provider: ContractProvider, proposalId: uint64): Promise<RawExecutionReply> {
        const r = StackReader.fromGetMethod(4, await provider.get('get_raw_execution', [
            { type: 'int', value: proposalId },
        ]));
        return ({
            $: 'RawExecutionReply',
            isSet: r.readBoolean(),
            dest: r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            value: r.readBigInt(),
            body: r.readNullable<c.Cell>(
                (r) => r.readCell()
            ),
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

    async getExecutionConfig(provider: ContractProvider): Promise<[
        c.Address | null,
        c.Address | null,
        c.Address | null,
        coins,
        coins,
    ]> {
        const r = StackReader.fromGetMethod(5, await provider.get('get_execution_config', []));
        return [
            r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            r.readBigInt(),
            r.readBigInt(),
        ];
    }

    async getWalletRuntimeExecutionConfig(provider: ContractProvider): Promise<[
        c.Address | null,
        c.Address | null,
        coins,
    ]> {
        const r = StackReader.fromGetMethod(3, await provider.get('get_wallet_runtime_execution_config', []));
        return [
            r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            r.readBigInt(),
        ];
    }
}
