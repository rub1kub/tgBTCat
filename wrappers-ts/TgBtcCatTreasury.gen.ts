// AUTO-GENERATED, do not edit
// It's a TypeScript wrapper for a TgBtcCatTreasury contract in Tolk.
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

type uint64 = bigint

/**
 > struct TreasuryStorage {
 >     governor: address
 >     primaryJettonWallet: address?
 > }
 */
export interface TreasuryStorage {
    readonly $: 'TreasuryStorage'
    governor: c.Address
    primaryJettonWallet: c.Address | null
}

export const TreasuryStorage = {
    create(args: {
        governor: c.Address
        primaryJettonWallet: c.Address | null
    }): TreasuryStorage {
        return {
            $: 'TreasuryStorage',
            ...args
        }
    },
    fromSlice(s: c.Slice): TreasuryStorage {
        return {
            $: 'TreasuryStorage',
            governor: s.loadAddress(),
            primaryJettonWallet: s.loadMaybeAddress(),
        }
    },
    store(self: TreasuryStorage, b: c.Builder): void {
        b.storeAddress(self.governor);
        b.storeAddress(self.primaryJettonWallet);
    },
    toCell(self: TreasuryStorage): c.Cell {
        return makeCellFrom<TreasuryStorage>(self, TreasuryStorage.store);
    }
}

/**
 > struct TreasuryConfigReply {
 >     governor: address
 >     primaryJettonWallet: address?
 > }
 */
export interface TreasuryConfigReply {
    readonly $: 'TreasuryConfigReply'
    governor: c.Address
    primaryJettonWallet: c.Address | null
}

export const TreasuryConfigReply = {
    create(args: {
        governor: c.Address
        primaryJettonWallet: c.Address | null
    }): TreasuryConfigReply {
        return {
            $: 'TreasuryConfigReply',
            ...args
        }
    },
    fromSlice(s: c.Slice): TreasuryConfigReply {
        return {
            $: 'TreasuryConfigReply',
            governor: s.loadAddress(),
            primaryJettonWallet: s.loadMaybeAddress(),
        }
    },
    store(self: TreasuryConfigReply, b: c.Builder): void {
        b.storeAddress(self.governor);
        b.storeAddress(self.primaryJettonWallet);
    },
    toCell(self: TreasuryConfigReply): c.Cell {
        return makeCellFrom<TreasuryConfigReply>(self, TreasuryConfigReply.store);
    }
}

/**
 > struct (0x10050001) SendTreasuryTon {
 >     queryId: uint64
 >     recipient: address
 >     amount: coins
 >     bounce: bool
 > }
 */
export interface SendTreasuryTon {
    readonly $: 'SendTreasuryTon'
    queryId: uint64
    recipient: c.Address
    amount: coins
    bounce: boolean
}

export const SendTreasuryTon = {
    PREFIX: 0x10050001,

    create(args: {
        queryId: uint64
        recipient: c.Address
        amount: coins
        bounce: boolean
    }): SendTreasuryTon {
        return {
            $: 'SendTreasuryTon',
            ...args
        }
    },
    fromSlice(s: c.Slice): SendTreasuryTon {
        loadAndCheckPrefix32(s, 0x10050001, 'SendTreasuryTon');
        return {
            $: 'SendTreasuryTon',
            queryId: s.loadUintBig(64),
            recipient: s.loadAddress(),
            amount: s.loadCoins(),
            bounce: s.loadBoolean(),
        }
    },
    store(self: SendTreasuryTon, b: c.Builder): void {
        b.storeUint(0x10050001, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.recipient);
        b.storeCoins(self.amount);
        b.storeBit(self.bounce);
    },
    toCell(self: SendTreasuryTon): c.Cell {
        return makeCellFrom<SendTreasuryTon>(self, SendTreasuryTon.store);
    }
}

/**
 > struct (0x10050003) SetTreasuryGovernor {
 >     queryId: uint64
 >     governor: address
 > }
 */
export interface SetTreasuryGovernor {
    readonly $: 'SetTreasuryGovernor'
    queryId: uint64
    governor: c.Address
}

export const SetTreasuryGovernor = {
    PREFIX: 0x10050003,

    create(args: {
        queryId: uint64
        governor: c.Address
    }): SetTreasuryGovernor {
        return {
            $: 'SetTreasuryGovernor',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetTreasuryGovernor {
        loadAndCheckPrefix32(s, 0x10050003, 'SetTreasuryGovernor');
        return {
            $: 'SetTreasuryGovernor',
            queryId: s.loadUintBig(64),
            governor: s.loadAddress(),
        }
    },
    store(self: SetTreasuryGovernor, b: c.Builder): void {
        b.storeUint(0x10050003, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.governor);
    },
    toCell(self: SetTreasuryGovernor): c.Cell {
        return makeCellFrom<SetTreasuryGovernor>(self, SetTreasuryGovernor.store);
    }
}

/**
 > struct (0x10050004) SetTreasuryPrimaryJettonWallet {
 >     queryId: uint64
 >     primaryJettonWallet: address?
 > }
 */
export interface SetTreasuryPrimaryJettonWallet {
    readonly $: 'SetTreasuryPrimaryJettonWallet'
    queryId: uint64
    primaryJettonWallet: c.Address | null
}

export const SetTreasuryPrimaryJettonWallet = {
    PREFIX: 0x10050004,

    create(args: {
        queryId: uint64
        primaryJettonWallet: c.Address | null
    }): SetTreasuryPrimaryJettonWallet {
        return {
            $: 'SetTreasuryPrimaryJettonWallet',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetTreasuryPrimaryJettonWallet {
        loadAndCheckPrefix32(s, 0x10050004, 'SetTreasuryPrimaryJettonWallet');
        return {
            $: 'SetTreasuryPrimaryJettonWallet',
            queryId: s.loadUintBig(64),
            primaryJettonWallet: s.loadMaybeAddress(),
        }
    },
    store(self: SetTreasuryPrimaryJettonWallet, b: c.Builder): void {
        b.storeUint(0x10050004, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.primaryJettonWallet);
    },
    toCell(self: SetTreasuryPrimaryJettonWallet): c.Cell {
        return makeCellFrom<SetTreasuryPrimaryJettonWallet>(self, SetTreasuryPrimaryJettonWallet.store);
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
 > struct (0x0f8a7ea5) AskToTransfer {
 >     queryId: uint64
 >     jettonAmount: coins
 >     transferRecipient: address
 >     sendExcessesTo: address?
 >     customPayload: cell?
 >     forwardTonAmount: coins
 >     forwardPayload: ForwardPayloadRemainder
 > }
 */
export interface AskToTransfer {
    readonly $: 'AskToTransfer'
    queryId: uint64
    jettonAmount: coins
    transferRecipient: c.Address
    sendExcessesTo: c.Address | null
    customPayload: c.Cell | null
    forwardTonAmount: coins
    forwardPayload: PayloadInline | PayloadInRef
}

export const AskToTransfer = {
    PREFIX: 0x0f8a7ea5,

    create(args: {
        queryId: uint64
        jettonAmount: coins
        transferRecipient: c.Address
        sendExcessesTo: c.Address | null
        customPayload: c.Cell | null
        forwardTonAmount: coins
        forwardPayload: PayloadInline | PayloadInRef
    }): AskToTransfer {
        return {
            $: 'AskToTransfer',
            ...args
        }
    },
    fromSlice(s: c.Slice): AskToTransfer {
        loadAndCheckPrefix32(s, 0x0f8a7ea5, 'AskToTransfer');
        return {
            $: 'AskToTransfer',
            queryId: s.loadUintBig(64),
            jettonAmount: s.loadCoins(),
            transferRecipient: s.loadAddress(),
            sendExcessesTo: s.loadMaybeAddress(),
            customPayload: s.loadBoolean() ? s.loadRef() : null,
            forwardTonAmount: s.loadCoins(),
            forwardPayload: lookupPrefix(s, 0b0, 1) ? PayloadInline.fromSlice(s) :
                lookupPrefix(s, 0b1, 1) ? PayloadInRef.fromSlice(s) :
                throwNonePrefixMatch('AskToTransfer.forwardPayload'),
        }
    },
    store(self: AskToTransfer, b: c.Builder): void {
        b.storeUint(0x0f8a7ea5, 32);
        b.storeUint(self.queryId, 64);
        b.storeCoins(self.jettonAmount);
        b.storeAddress(self.transferRecipient);
        b.storeAddress(self.sendExcessesTo);
        storeTolkNullable<c.Cell>(self.customPayload, b,
            (v,b) => b.storeRef(v)
        );
        b.storeCoins(self.forwardTonAmount);
        switch (self.forwardPayload.$) {
            case 'PayloadInline':
                PayloadInline.store(self.forwardPayload, b);
                break;
            case 'PayloadInRef':
                PayloadInRef.store(self.forwardPayload, b);
                break;
        }
    },
    toCell(self: AskToTransfer): c.Cell {
        return makeCellFrom<AskToTransfer>(self, AskToTransfer.store);
    }
}

/**
 > struct (0x10050002) SendTreasuryJettons {
 >     queryId: uint64
 >     jettonWallet: address
 >     jettonAmount: coins
 >     transferRecipient: address
 >     sendExcessesTo: address?
 >     walletTonAmount: coins
 >     forwardTonAmount: coins
 >     forwardPayload: ForwardPayloadRemainder
 > }
 */
export interface SendTreasuryJettons {
    readonly $: 'SendTreasuryJettons'
    queryId: uint64
    jettonWallet: c.Address
    jettonAmount: coins
    transferRecipient: c.Address
    sendExcessesTo: c.Address | null
    walletTonAmount: coins
    forwardTonAmount: coins
    forwardPayload: PayloadInline | PayloadInRef
}

export const SendTreasuryJettons = {
    PREFIX: 0x10050002,

    create(args: {
        queryId: uint64
        jettonWallet: c.Address
        jettonAmount: coins
        transferRecipient: c.Address
        sendExcessesTo: c.Address | null
        walletTonAmount: coins
        forwardTonAmount: coins
        forwardPayload: PayloadInline | PayloadInRef
    }): SendTreasuryJettons {
        return {
            $: 'SendTreasuryJettons',
            ...args
        }
    },
    fromSlice(s: c.Slice): SendTreasuryJettons {
        loadAndCheckPrefix32(s, 0x10050002, 'SendTreasuryJettons');
        return {
            $: 'SendTreasuryJettons',
            queryId: s.loadUintBig(64),
            jettonWallet: s.loadAddress(),
            jettonAmount: s.loadCoins(),
            transferRecipient: s.loadAddress(),
            sendExcessesTo: s.loadMaybeAddress(),
            walletTonAmount: s.loadCoins(),
            forwardTonAmount: s.loadCoins(),
            forwardPayload: lookupPrefix(s, 0b0, 1) ? PayloadInline.fromSlice(s) :
                lookupPrefix(s, 0b1, 1) ? PayloadInRef.fromSlice(s) :
                throwNonePrefixMatch('SendTreasuryJettons.forwardPayload'),
        }
    },
    store(self: SendTreasuryJettons, b: c.Builder): void {
        b.storeUint(0x10050002, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.jettonWallet);
        b.storeCoins(self.jettonAmount);
        b.storeAddress(self.transferRecipient);
        b.storeAddress(self.sendExcessesTo);
        b.storeCoins(self.walletTonAmount);
        b.storeCoins(self.forwardTonAmount);
        switch (self.forwardPayload.$) {
            case 'PayloadInline':
                PayloadInline.store(self.forwardPayload, b);
                break;
            case 'PayloadInRef':
                PayloadInRef.store(self.forwardPayload, b);
                break;
        }
    },
    toCell(self: SendTreasuryJettons): c.Cell {
        return makeCellFrom<SendTreasuryJettons>(self, SendTreasuryJettons.store);
    }
}

/**
 > struct (0xd372158c) TopUpTons {
 > }
 */
export interface TopUpTons {
    readonly $: 'TopUpTons'
}

export const TopUpTons = {
    PREFIX: 0xd372158c,

    create(): TopUpTons {
        return {
            $: 'TopUpTons',
        }
    },
    fromSlice(s: c.Slice): TopUpTons {
        loadAndCheckPrefix32(s, 0xd372158c, 'TopUpTons');
        return {
            $: 'TopUpTons',
        }
    },
    store(self: TopUpTons, b: c.Builder): void {
        b.storeUint(0xd372158c, 32);
    },
    toCell(self: TopUpTons): c.Cell {
        return makeCellFrom<TopUpTons>(self, TopUpTons.store);
    }
}

// ————————————————————————————————————————————
//    class TgBtcCatTreasury
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

export class TgBtcCatTreasury implements c.Contract {
    static CodeCell = c.Cell.fromBase64('te6ccgECCAEAAVQAART/APSkE/S88sgLAQIBYgIDBPjQ+JGRMOAg1ywggCgADI5WMe1E0PpIMPiSxwXy4ZHTPzH6SPoA1woAkXGRcOLIz4WAIcMAzwoAz4RAE/pSAfoCz4EhwAKUMXP6ApwBwAOTcfoCk8+EIOLighDTchWMzwuFyYAR+wDg1ywggCgAFOMC1ywggCgAHOMCidcnBAUGBwAVoSIB2omh9JH0oGEArjHTP/pI+gD6SPpQ+gD6ACD0BAFukTCR0eLtRND6SDD4kscF8uGRbcjPkD4p+pYZyz9QBvoCFPpSEvpUFfQAAfoCzsnIz4WIEvpSWPoCcc8LaszJgBH7AAA4Me1E0PpI+JJYxwXy4ZEB0z8x+kgwyPpSzsntVAAIEAUABABojh8x7UTQ+kgw+JIhxwXy4ZEB0z8x+lAwAcj6UvpUye1U4NcsJpuQrGQxkTDghA8BxwDy9A==');

    static Errors = {
        'GovErrors.NotGovernor': 401,
        'GovErrors.InvalidMessage': 65535,
    }

    readonly address: c.Address
    readonly init: { code: c.Cell, data: c.Cell } | undefined

    protected constructor(address: c.Address, init?: { code: c.Cell, data: c.Cell }) {
        this.address = address;
        this.init = init;
    }

    static fromAddress(address: c.Address) {
        return new TgBtcCatTreasury(address);
    }

    static fromStorage(emptyStorage: {
        governor: c.Address
        primaryJettonWallet: c.Address | null
    }, deployedOptions?: DeployedAddrOptions) {
        const initialState = {
            code: deployedOptions?.overrideContractCode ?? TgBtcCatTreasury.CodeCell,
            data: TreasuryStorage.toCell(TreasuryStorage.create(emptyStorage)),
        };
        const address = calculateDeployedAddress(initialState.code, initialState.data, deployedOptions ?? {});
        return new TgBtcCatTreasury(address, initialState);
    }

    static createCellOfSendTreasuryTon(body: {
        queryId: uint64
        recipient: c.Address
        amount: coins
        bounce: boolean
    }) {
        return SendTreasuryTon.toCell(SendTreasuryTon.create(body));
    }

    static createCellOfSendTreasuryJettons(body: {
        queryId: uint64
        jettonWallet: c.Address
        jettonAmount: coins
        transferRecipient: c.Address
        sendExcessesTo: c.Address | null
        walletTonAmount: coins
        forwardTonAmount: coins
        forwardPayload: PayloadInline | PayloadInRef
    }) {
        return SendTreasuryJettons.toCell(SendTreasuryJettons.create(body));
    }

    static createCellOfSetTreasuryGovernor(body: {
        queryId: uint64
        governor: c.Address
    }) {
        return SetTreasuryGovernor.toCell(SetTreasuryGovernor.create(body));
    }

    static createCellOfSetTreasuryPrimaryJettonWallet(body: {
        queryId: uint64
        primaryJettonWallet: c.Address | null
    }) {
        return SetTreasuryPrimaryJettonWallet.toCell(SetTreasuryPrimaryJettonWallet.create(body));
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

    async sendSendTreasuryTon(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        recipient: c.Address
        amount: coins
        bounce: boolean
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SendTreasuryTon.toCell(SendTreasuryTon.create(body)),
            ...extraOptions
        });
    }

    async sendSendTreasuryJettons(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        jettonWallet: c.Address
        jettonAmount: coins
        transferRecipient: c.Address
        sendExcessesTo: c.Address | null
        walletTonAmount: coins
        forwardTonAmount: coins
        forwardPayload: PayloadInline | PayloadInRef
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SendTreasuryJettons.toCell(SendTreasuryJettons.create(body)),
            ...extraOptions
        });
    }

    async sendSetTreasuryGovernor(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        governor: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetTreasuryGovernor.toCell(SetTreasuryGovernor.create(body)),
            ...extraOptions
        });
    }

    async sendSetTreasuryPrimaryJettonWallet(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        primaryJettonWallet: c.Address | null
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetTreasuryPrimaryJettonWallet.toCell(SetTreasuryPrimaryJettonWallet.create(body)),
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

    async getTreasuryConfig(provider: ContractProvider): Promise<TreasuryConfigReply> {
        const r = StackReader.fromGetMethod(2, await provider.get('get_treasury_config', []));
        return ({
            $: 'TreasuryConfigReply',
            governor: r.readSlice().loadAddress(),
            primaryJettonWallet: r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
        });
    }
}
