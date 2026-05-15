// AUTO-GENERATED, do not edit
// It's a TypeScript wrapper for a TgBtcCatJettonWallet contract in Tolk.
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
type uint64 = bigint

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
 > struct (0x178d4519) InternalTransferStep {
 >     queryId: uint64
 >     jettonAmount: coins
 >     transferInitiator: address?
 >     sendExcessesTo: address?
 >     forwardTonAmount: coins
 >     feeRuntime: Cell<WalletFeeRuntime>?
 >     forwardPayload: ForwardPayloadRemainder
 > }
 */
export interface InternalTransferStep {
    readonly $: 'InternalTransferStep'
    queryId: uint64
    jettonAmount: coins
    transferInitiator: c.Address | null
    sendExcessesTo: c.Address | null
    forwardTonAmount: coins
    feeRuntime: CellRef<WalletFeeRuntime> | null /* = null */
    forwardPayload: PayloadInline | PayloadInRef
}

export const InternalTransferStep = {
    PREFIX: 0x178d4519,

    create(args: {
        queryId: uint64
        jettonAmount: coins
        transferInitiator: c.Address | null
        sendExcessesTo: c.Address | null
        forwardTonAmount: coins
        feeRuntime?: CellRef<WalletFeeRuntime> | null /* = null */
        forwardPayload: PayloadInline | PayloadInRef
    }): InternalTransferStep {
        return {
            $: 'InternalTransferStep',
            feeRuntime: null,
            ...args
        }
    },
    fromSlice(s: c.Slice): InternalTransferStep {
        loadAndCheckPrefix32(s, 0x178d4519, 'InternalTransferStep');
        return {
            $: 'InternalTransferStep',
            queryId: s.loadUintBig(64),
            jettonAmount: s.loadCoins(),
            transferInitiator: s.loadMaybeAddress(),
            sendExcessesTo: s.loadMaybeAddress(),
            forwardTonAmount: s.loadCoins(),
            feeRuntime: s.loadBoolean() ? loadCellRef<WalletFeeRuntime>(s, WalletFeeRuntime.fromSlice) : null,
            forwardPayload: lookupPrefix(s, 0b0, 1) ? PayloadInline.fromSlice(s) :
                lookupPrefix(s, 0b1, 1) ? PayloadInRef.fromSlice(s) :
                throwNonePrefixMatch('InternalTransferStep.forwardPayload'),
        }
    },
    store(self: InternalTransferStep, b: c.Builder): void {
        b.storeUint(0x178d4519, 32);
        b.storeUint(self.queryId, 64);
        b.storeCoins(self.jettonAmount);
        b.storeAddress(self.transferInitiator);
        b.storeAddress(self.sendExcessesTo);
        b.storeCoins(self.forwardTonAmount);
        storeTolkNullable<CellRef<WalletFeeRuntime>>(self.feeRuntime, b,
            (v,b) => storeCellRef<WalletFeeRuntime>(v, b, WalletFeeRuntime.store)
        );
        switch (self.forwardPayload.$) {
            case 'PayloadInline':
                PayloadInline.store(self.forwardPayload, b);
                break;
            case 'PayloadInRef':
                PayloadInRef.store(self.forwardPayload, b);
                break;
        }
    },
    toCell(self: InternalTransferStep): c.Cell {
        return makeCellFrom<InternalTransferStep>(self, InternalTransferStep.store);
    }
}

/**
 > struct (0xd53276db) ReturnExcessesBack {
 >     queryId: uint64
 > }
 */
export interface ReturnExcessesBack {
    readonly $: 'ReturnExcessesBack'
    queryId: uint64
}

export const ReturnExcessesBack = {
    PREFIX: 0xd53276db,

    create(args: {
        queryId: uint64
    }): ReturnExcessesBack {
        return {
            $: 'ReturnExcessesBack',
            ...args
        }
    },
    fromSlice(s: c.Slice): ReturnExcessesBack {
        loadAndCheckPrefix32(s, 0xd53276db, 'ReturnExcessesBack');
        return {
            $: 'ReturnExcessesBack',
            queryId: s.loadUintBig(64),
        }
    },
    store(self: ReturnExcessesBack, b: c.Builder): void {
        b.storeUint(0xd53276db, 32);
        b.storeUint(self.queryId, 64);
    },
    toCell(self: ReturnExcessesBack): c.Cell {
        return makeCellFrom<ReturnExcessesBack>(self, ReturnExcessesBack.store);
    }
}

/**
 > struct (0x595f07bc) AskToBurn {
 >     queryId: uint64
 >     jettonAmount: coins
 >     sendExcessesTo: address?
 >     customPayload: cell?
 > }
 */
export interface AskToBurn {
    readonly $: 'AskToBurn'
    queryId: uint64
    jettonAmount: coins
    sendExcessesTo: c.Address | null
    customPayload: c.Cell | null
}

export const AskToBurn = {
    PREFIX: 0x595f07bc,

    create(args: {
        queryId: uint64
        jettonAmount: coins
        sendExcessesTo: c.Address | null
        customPayload: c.Cell | null
    }): AskToBurn {
        return {
            $: 'AskToBurn',
            ...args
        }
    },
    fromSlice(s: c.Slice): AskToBurn {
        loadAndCheckPrefix32(s, 0x595f07bc, 'AskToBurn');
        return {
            $: 'AskToBurn',
            queryId: s.loadUintBig(64),
            jettonAmount: s.loadCoins(),
            sendExcessesTo: s.loadMaybeAddress(),
            customPayload: s.loadBoolean() ? s.loadRef() : null,
        }
    },
    store(self: AskToBurn, b: c.Builder): void {
        b.storeUint(0x595f07bc, 32);
        b.storeUint(self.queryId, 64);
        b.storeCoins(self.jettonAmount);
        b.storeAddress(self.sendExcessesTo);
        storeTolkNullable<c.Cell>(self.customPayload, b,
            (v,b) => b.storeRef(v)
        );
    },
    toCell(self: AskToBurn): c.Cell {
        return makeCellFrom<AskToBurn>(self, AskToBurn.store);
    }
}

/**
 > struct (0x7bdd97de) BurnNotificationForMinter {
 >     queryId: uint64
 >     jettonAmount: coins
 >     burnInitiator: address
 >     sendExcessesTo: address?
 > }
 */
export interface BurnNotificationForMinter {
    readonly $: 'BurnNotificationForMinter'
    queryId: uint64
    jettonAmount: coins
    burnInitiator: c.Address
    sendExcessesTo: c.Address | null
}

export const BurnNotificationForMinter = {
    PREFIX: 0x7bdd97de,

    create(args: {
        queryId: uint64
        jettonAmount: coins
        burnInitiator: c.Address
        sendExcessesTo: c.Address | null
    }): BurnNotificationForMinter {
        return {
            $: 'BurnNotificationForMinter',
            ...args
        }
    },
    fromSlice(s: c.Slice): BurnNotificationForMinter {
        loadAndCheckPrefix32(s, 0x7bdd97de, 'BurnNotificationForMinter');
        return {
            $: 'BurnNotificationForMinter',
            queryId: s.loadUintBig(64),
            jettonAmount: s.loadCoins(),
            burnInitiator: s.loadAddress(),
            sendExcessesTo: s.loadMaybeAddress(),
        }
    },
    store(self: BurnNotificationForMinter, b: c.Builder): void {
        b.storeUint(0x7bdd97de, 32);
        b.storeUint(self.queryId, 64);
        b.storeCoins(self.jettonAmount);
        b.storeAddress(self.burnInitiator);
        b.storeAddress(self.sendExcessesTo);
    },
    toCell(self: BurnNotificationForMinter): c.Cell {
        return makeCellFrom<BurnNotificationForMinter>(self, BurnNotificationForMinter.store);
    }
}

/**
 > struct (0x20010001) SetWalletFeeRuntime {
 >     queryId: uint64
 >     feeTreasury: address?
 >     globalBuyFeeBps: uint16
 >     globalSellFeeBps: uint16
 >     isDexWallet: bool
 > }
 */
export interface SetWalletFeeRuntime {
    readonly $: 'SetWalletFeeRuntime'
    queryId: uint64
    feeTreasury: c.Address | null
    globalBuyFeeBps: uint16
    globalSellFeeBps: uint16
    isDexWallet: boolean
}

export const SetWalletFeeRuntime = {
    PREFIX: 0x20010001,

    create(args: {
        queryId: uint64
        feeTreasury: c.Address | null
        globalBuyFeeBps: uint16
        globalSellFeeBps: uint16
        isDexWallet: boolean
    }): SetWalletFeeRuntime {
        return {
            $: 'SetWalletFeeRuntime',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetWalletFeeRuntime {
        loadAndCheckPrefix32(s, 0x20010001, 'SetWalletFeeRuntime');
        return {
            $: 'SetWalletFeeRuntime',
            queryId: s.loadUintBig(64),
            feeTreasury: s.loadMaybeAddress(),
            globalBuyFeeBps: s.loadUintBig(16),
            globalSellFeeBps: s.loadUintBig(16),
            isDexWallet: s.loadBoolean(),
        }
    },
    store(self: SetWalletFeeRuntime, b: c.Builder): void {
        b.storeUint(0x20010001, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.feeTreasury);
        b.storeUint(self.globalBuyFeeBps, 16);
        b.storeUint(self.globalSellFeeBps, 16);
        b.storeBit(self.isDexWallet);
    },
    toCell(self: SetWalletFeeRuntime): c.Cell {
        return makeCellFrom<SetWalletFeeRuntime>(self, SetWalletFeeRuntime.store);
    }
}

/**
 > struct (0x20010002) AddWalletDexAddress {
 >     queryId: uint64
 >     wallet: address
 > }
 */
export interface AddWalletDexAddress {
    readonly $: 'AddWalletDexAddress'
    queryId: uint64
    wallet: c.Address
}

export const AddWalletDexAddress = {
    PREFIX: 0x20010002,

    create(args: {
        queryId: uint64
        wallet: c.Address
    }): AddWalletDexAddress {
        return {
            $: 'AddWalletDexAddress',
            ...args
        }
    },
    fromSlice(s: c.Slice): AddWalletDexAddress {
        loadAndCheckPrefix32(s, 0x20010002, 'AddWalletDexAddress');
        return {
            $: 'AddWalletDexAddress',
            queryId: s.loadUintBig(64),
            wallet: s.loadAddress(),
        }
    },
    store(self: AddWalletDexAddress, b: c.Builder): void {
        b.storeUint(0x20010002, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.wallet);
    },
    toCell(self: AddWalletDexAddress): c.Cell {
        return makeCellFrom<AddWalletDexAddress>(self, AddWalletDexAddress.store);
    }
}

/**
 > struct (0x20010003) RemoveWalletDexAddress {
 >     queryId: uint64
 >     wallet: address
 > }
 */
export interface RemoveWalletDexAddress {
    readonly $: 'RemoveWalletDexAddress'
    queryId: uint64
    wallet: c.Address
}

export const RemoveWalletDexAddress = {
    PREFIX: 0x20010003,

    create(args: {
        queryId: uint64
        wallet: c.Address
    }): RemoveWalletDexAddress {
        return {
            $: 'RemoveWalletDexAddress',
            ...args
        }
    },
    fromSlice(s: c.Slice): RemoveWalletDexAddress {
        loadAndCheckPrefix32(s, 0x20010003, 'RemoveWalletDexAddress');
        return {
            $: 'RemoveWalletDexAddress',
            queryId: s.loadUintBig(64),
            wallet: s.loadAddress(),
        }
    },
    store(self: RemoveWalletDexAddress, b: c.Builder): void {
        b.storeUint(0x20010003, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.wallet);
    },
    toCell(self: RemoveWalletDexAddress): c.Cell {
        return makeCellFrom<RemoveWalletDexAddress>(self, RemoveWalletDexAddress.store);
    }
}

/**
 > struct (0x20010004) SetWalletSpecificFee {
 >     queryId: uint64
 >     target: address
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 > }
 */
export interface SetWalletSpecificFee {
    readonly $: 'SetWalletSpecificFee'
    queryId: uint64
    target: c.Address
    buyFeeBps: uint16
    sellFeeBps: uint16
}

export const SetWalletSpecificFee = {
    PREFIX: 0x20010004,

    create(args: {
        queryId: uint64
        target: c.Address
        buyFeeBps: uint16
        sellFeeBps: uint16
    }): SetWalletSpecificFee {
        return {
            $: 'SetWalletSpecificFee',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetWalletSpecificFee {
        loadAndCheckPrefix32(s, 0x20010004, 'SetWalletSpecificFee');
        return {
            $: 'SetWalletSpecificFee',
            queryId: s.loadUintBig(64),
            target: s.loadAddress(),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
        }
    },
    store(self: SetWalletSpecificFee, b: c.Builder): void {
        b.storeUint(0x20010004, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.target);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
    },
    toCell(self: SetWalletSpecificFee): c.Cell {
        return makeCellFrom<SetWalletSpecificFee>(self, SetWalletSpecificFee.store);
    }
}

/**
 > struct (0x20010005) ClearWalletSpecificFee {
 >     queryId: uint64
 >     target: address
 > }
 */
export interface ClearWalletSpecificFee {
    readonly $: 'ClearWalletSpecificFee'
    queryId: uint64
    target: c.Address
}

export const ClearWalletSpecificFee = {
    PREFIX: 0x20010005,

    create(args: {
        queryId: uint64
        target: c.Address
    }): ClearWalletSpecificFee {
        return {
            $: 'ClearWalletSpecificFee',
            ...args
        }
    },
    fromSlice(s: c.Slice): ClearWalletSpecificFee {
        loadAndCheckPrefix32(s, 0x20010005, 'ClearWalletSpecificFee');
        return {
            $: 'ClearWalletSpecificFee',
            queryId: s.loadUintBig(64),
            target: s.loadAddress(),
        }
    },
    store(self: ClearWalletSpecificFee, b: c.Builder): void {
        b.storeUint(0x20010005, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.target);
    },
    toCell(self: ClearWalletSpecificFee): c.Cell {
        return makeCellFrom<ClearWalletSpecificFee>(self, ClearWalletSpecificFee.store);
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

/**
 > struct WalletTransferFeeRule {
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 > }
 */
export interface WalletTransferFeeRule {
    readonly $: 'WalletTransferFeeRule'
    buyFeeBps: uint16
    sellFeeBps: uint16
}

export const WalletTransferFeeRule = {
    create(args: {
        buyFeeBps: uint16
        sellFeeBps: uint16
    }): WalletTransferFeeRule {
        return {
            $: 'WalletTransferFeeRule',
            ...args
        }
    },
    fromSlice(s: c.Slice): WalletTransferFeeRule {
        return {
            $: 'WalletTransferFeeRule',
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
        }
    },
    store(self: WalletTransferFeeRule, b: c.Builder): void {
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
    },
    toCell(self: WalletTransferFeeRule): c.Cell {
        return makeCellFrom<WalletTransferFeeRule>(self, WalletTransferFeeRule.store);
    }
}

/**
 > struct WalletFeeRuntime {
 >     feeTreasury: address?
 >     globalBuyFeeBps: uint16
 >     globalSellFeeBps: uint16
 >     isDexWallet: bool
 >     dexWallets: map<address, bool>
 >     walletFeeRules: map<address, WalletTransferFeeRule>
 > }
 */
export interface WalletFeeRuntime {
    readonly $: 'WalletFeeRuntime'
    feeTreasury: c.Address | null
    globalBuyFeeBps: uint16
    globalSellFeeBps: uint16
    isDexWallet: boolean
    dexWallets: c.Dictionary<c.Address, boolean> /* = [] */
    walletFeeRules: c.Dictionary<c.Address, WalletTransferFeeRule> /* = [] */
}

export const WalletFeeRuntime = {
    create(args: {
        feeTreasury: c.Address | null
        globalBuyFeeBps: uint16
        globalSellFeeBps: uint16
        isDexWallet: boolean
        dexWallets: c.Dictionary<c.Address, boolean> /* = [] */
        walletFeeRules: c.Dictionary<c.Address, WalletTransferFeeRule> /* = [] */
    }): WalletFeeRuntime {
        return {
            $: 'WalletFeeRuntime',
            ...args
        }
    },
    fromSlice(s: c.Slice): WalletFeeRuntime {
        return {
            $: 'WalletFeeRuntime',
            feeTreasury: s.loadMaybeAddress(),
            globalBuyFeeBps: s.loadUintBig(16),
            globalSellFeeBps: s.loadUintBig(16),
            isDexWallet: s.loadBoolean(),
            dexWallets: c.Dictionary.load<c.Address, boolean>(c.Dictionary.Keys.Address(), c.Dictionary.Values.Bool(), s),
            walletFeeRules: c.Dictionary.load<c.Address, WalletTransferFeeRule>(c.Dictionary.Keys.Address(), createDictionaryValue<WalletTransferFeeRule>(WalletTransferFeeRule.fromSlice, WalletTransferFeeRule.store), s),
        }
    },
    store(self: WalletFeeRuntime, b: c.Builder): void {
        b.storeAddress(self.feeTreasury);
        b.storeUint(self.globalBuyFeeBps, 16);
        b.storeUint(self.globalSellFeeBps, 16);
        b.storeBit(self.isDexWallet);
        b.storeDict<c.Address, boolean>(self.dexWallets, c.Dictionary.Keys.Address(), c.Dictionary.Values.Bool());
        b.storeDict<c.Address, WalletTransferFeeRule>(self.walletFeeRules, c.Dictionary.Keys.Address(), createDictionaryValue<WalletTransferFeeRule>(WalletTransferFeeRule.fromSlice, WalletTransferFeeRule.store));
    },
    toCell(self: WalletFeeRuntime): c.Cell {
        return makeCellFrom<WalletFeeRuntime>(self, WalletFeeRuntime.store);
    }
}

/**
 > struct WalletStorage {
 >     jettonBalance: coins
 >     ownerAddress: address
 >     minterAddress: address
 >     feeRuntime: Cell<WalletFeeRuntime>?
 > }
 */
export interface WalletStorage {
    readonly $: 'WalletStorage'
    jettonBalance: coins
    ownerAddress: c.Address
    minterAddress: c.Address
    feeRuntime: CellRef<WalletFeeRuntime> | null /* = null */
}

export const WalletStorage = {
    create(args: {
        jettonBalance: coins
        ownerAddress: c.Address
        minterAddress: c.Address
        feeRuntime?: CellRef<WalletFeeRuntime> | null /* = null */
    }): WalletStorage {
        return {
            $: 'WalletStorage',
            feeRuntime: null,
            ...args
        }
    },
    fromSlice(s: c.Slice): WalletStorage {
        return {
            $: 'WalletStorage',
            jettonBalance: s.loadCoins(),
            ownerAddress: s.loadAddress(),
            minterAddress: s.loadAddress(),
            feeRuntime: s.loadBoolean() ? loadCellRef<WalletFeeRuntime>(s, WalletFeeRuntime.fromSlice) : null,
        }
    },
    store(self: WalletStorage, b: c.Builder): void {
        b.storeCoins(self.jettonBalance);
        b.storeAddress(self.ownerAddress);
        b.storeAddress(self.minterAddress);
        storeTolkNullable<CellRef<WalletFeeRuntime>>(self.feeRuntime, b,
            (v,b) => storeCellRef<WalletFeeRuntime>(v, b, WalletFeeRuntime.store)
        );
    },
    toCell(self: WalletStorage): c.Cell {
        return makeCellFrom<WalletStorage>(self, WalletStorage.store);
    }
}

/**
 > struct JettonWalletDataReply {
 >     jettonBalance: coins
 >     ownerAddress: address
 >     minterAddress: address
 >     jettonWalletCode: cell
 > }
 */
export interface JettonWalletDataReply {
    readonly $: 'JettonWalletDataReply'
    jettonBalance: coins
    ownerAddress: c.Address
    minterAddress: c.Address
    jettonWalletCode: c.Cell
}

export const JettonWalletDataReply = {
    create(args: {
        jettonBalance: coins
        ownerAddress: c.Address
        minterAddress: c.Address
        jettonWalletCode: c.Cell
    }): JettonWalletDataReply {
        return {
            $: 'JettonWalletDataReply',
            ...args
        }
    },
    fromSlice(s: c.Slice): JettonWalletDataReply {
        return {
            $: 'JettonWalletDataReply',
            jettonBalance: s.loadCoins(),
            ownerAddress: s.loadAddress(),
            minterAddress: s.loadAddress(),
            jettonWalletCode: s.loadRef(),
        }
    },
    store(self: JettonWalletDataReply, b: c.Builder): void {
        b.storeCoins(self.jettonBalance);
        b.storeAddress(self.ownerAddress);
        b.storeAddress(self.minterAddress);
        b.storeRef(self.jettonWalletCode);
    },
    toCell(self: JettonWalletDataReply): c.Cell {
        return makeCellFrom<JettonWalletDataReply>(self, JettonWalletDataReply.store);
    }
}

/**
 > struct WalletFeeRuntimeReply {
 >     feeTreasury: address?
 >     globalBuyFeeBps: uint16
 >     globalSellFeeBps: uint16
 >     isDexWallet: bool
 > }
 */
export interface WalletFeeRuntimeReply {
    readonly $: 'WalletFeeRuntimeReply'
    feeTreasury: c.Address | null
    globalBuyFeeBps: uint16
    globalSellFeeBps: uint16
    isDexWallet: boolean
}

export const WalletFeeRuntimeReply = {
    create(args: {
        feeTreasury: c.Address | null
        globalBuyFeeBps: uint16
        globalSellFeeBps: uint16
        isDexWallet: boolean
    }): WalletFeeRuntimeReply {
        return {
            $: 'WalletFeeRuntimeReply',
            ...args
        }
    },
    fromSlice(s: c.Slice): WalletFeeRuntimeReply {
        return {
            $: 'WalletFeeRuntimeReply',
            feeTreasury: s.loadMaybeAddress(),
            globalBuyFeeBps: s.loadUintBig(16),
            globalSellFeeBps: s.loadUintBig(16),
            isDexWallet: s.loadBoolean(),
        }
    },
    store(self: WalletFeeRuntimeReply, b: c.Builder): void {
        b.storeAddress(self.feeTreasury);
        b.storeUint(self.globalBuyFeeBps, 16);
        b.storeUint(self.globalSellFeeBps, 16);
        b.storeBit(self.isDexWallet);
    },
    toCell(self: WalletFeeRuntimeReply): c.Cell {
        return makeCellFrom<WalletFeeRuntimeReply>(self, WalletFeeRuntimeReply.store);
    }
}

/**
 > struct WalletTransferFeeRuleReply {
 >     isSet: bool
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 > }
 */
export interface WalletTransferFeeRuleReply {
    readonly $: 'WalletTransferFeeRuleReply'
    isSet: boolean
    buyFeeBps: uint16
    sellFeeBps: uint16
}

export const WalletTransferFeeRuleReply = {
    create(args: {
        isSet: boolean
        buyFeeBps: uint16
        sellFeeBps: uint16
    }): WalletTransferFeeRuleReply {
        return {
            $: 'WalletTransferFeeRuleReply',
            ...args
        }
    },
    fromSlice(s: c.Slice): WalletTransferFeeRuleReply {
        return {
            $: 'WalletTransferFeeRuleReply',
            isSet: s.loadBoolean(),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
        }
    },
    store(self: WalletTransferFeeRuleReply, b: c.Builder): void {
        b.storeBit(self.isSet);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
    },
    toCell(self: WalletTransferFeeRuleReply): c.Cell {
        return makeCellFrom<WalletTransferFeeRuleReply>(self, WalletTransferFeeRuleReply.store);
    }
}

/**
 > struct TransferFeeQuoteReply {
 >     side: uint8
 >     feeBps: uint16
 >     feeAmount: coins
 >     recipientAmount: coins
 >     feeTreasury: address?
 >     feeSubject: address?
 >     senderIsDexWallet: bool
 >     recipientIsDexWallet: bool
 > }
 */
export interface TransferFeeQuoteReply {
    readonly $: 'TransferFeeQuoteReply'
    side: uint8
    feeBps: uint16
    feeAmount: coins
    recipientAmount: coins
    feeTreasury: c.Address | null
    feeSubject: c.Address | null
    senderIsDexWallet: boolean
    recipientIsDexWallet: boolean
}

export const TransferFeeQuoteReply = {
    create(args: {
        side: uint8
        feeBps: uint16
        feeAmount: coins
        recipientAmount: coins
        feeTreasury: c.Address | null
        feeSubject: c.Address | null
        senderIsDexWallet: boolean
        recipientIsDexWallet: boolean
    }): TransferFeeQuoteReply {
        return {
            $: 'TransferFeeQuoteReply',
            ...args
        }
    },
    fromSlice(s: c.Slice): TransferFeeQuoteReply {
        return {
            $: 'TransferFeeQuoteReply',
            side: s.loadUintBig(8),
            feeBps: s.loadUintBig(16),
            feeAmount: s.loadCoins(),
            recipientAmount: s.loadCoins(),
            feeTreasury: s.loadMaybeAddress(),
            feeSubject: s.loadMaybeAddress(),
            senderIsDexWallet: s.loadBoolean(),
            recipientIsDexWallet: s.loadBoolean(),
        }
    },
    store(self: TransferFeeQuoteReply, b: c.Builder): void {
        b.storeUint(self.side, 8);
        b.storeUint(self.feeBps, 16);
        b.storeCoins(self.feeAmount);
        b.storeCoins(self.recipientAmount);
        b.storeAddress(self.feeTreasury);
        b.storeAddress(self.feeSubject);
        b.storeBit(self.senderIsDexWallet);
        b.storeBit(self.recipientIsDexWallet);
    },
    toCell(self: TransferFeeQuoteReply): c.Cell {
        return makeCellFrom<TransferFeeQuoteReply>(self, TransferFeeQuoteReply.store);
    }
}

// ————————————————————————————————————————————
//    class TgBtcCatJettonWallet
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

export class TgBtcCatJettonWallet implements c.Contract {
    static CodeCell = c.Cell.fromBase64('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');

    static Errors = {
        'Errors.BalanceError': 47,
        'Errors.NotEnoughGas': 48,
        'Errors.NotOwner': 73,
        'Errors.NotValidWallet': 74,
        'Errors.NotMinter': 75,
        'Errors.InvalidFee': 76,
        'Errors.WrongWorkchain': 333,
    }

    readonly address: c.Address
    readonly init: { code: c.Cell, data: c.Cell } | undefined

    protected constructor(address: c.Address, init?: { code: c.Cell, data: c.Cell }) {
        this.address = address;
        this.init = init;
    }

    static fromAddress(address: c.Address) {
        return new TgBtcCatJettonWallet(address);
    }

    static fromStorage(emptyStorage: {
        jettonBalance: coins
        ownerAddress: c.Address
        minterAddress: c.Address
        feeRuntime?: CellRef<WalletFeeRuntime> | null /* = null */
    }, deployedOptions?: DeployedAddrOptions) {
        const initialState = {
            code: deployedOptions?.overrideContractCode ?? TgBtcCatJettonWallet.CodeCell,
            data: WalletStorage.toCell(WalletStorage.create(emptyStorage)),
        };
        const address = calculateDeployedAddress(initialState.code, initialState.data, deployedOptions ?? {});
        return new TgBtcCatJettonWallet(address, initialState);
    }

    static createCellOfAskToTransfer(body: {
        queryId: uint64
        jettonAmount: coins
        transferRecipient: c.Address
        sendExcessesTo: c.Address | null
        customPayload: c.Cell | null
        forwardTonAmount: coins
        forwardPayload: PayloadInline | PayloadInRef
    }) {
        return AskToTransfer.toCell(AskToTransfer.create(body));
    }

    static createCellOfAskToBurn(body: {
        queryId: uint64
        jettonAmount: coins
        sendExcessesTo: c.Address | null
        customPayload: c.Cell | null
    }) {
        return AskToBurn.toCell(AskToBurn.create(body));
    }

    static createCellOfInternalTransferStep(body: {
        queryId: uint64
        jettonAmount: coins
        transferInitiator: c.Address | null
        sendExcessesTo: c.Address | null
        forwardTonAmount: coins
        feeRuntime?: CellRef<WalletFeeRuntime> | null /* = null */
        forwardPayload: PayloadInline | PayloadInRef
    }) {
        return InternalTransferStep.toCell(InternalTransferStep.create(body));
    }

    static createCellOfSetWalletFeeRuntime(body: {
        queryId: uint64
        feeTreasury: c.Address | null
        globalBuyFeeBps: uint16
        globalSellFeeBps: uint16
        isDexWallet: boolean
    }) {
        return SetWalletFeeRuntime.toCell(SetWalletFeeRuntime.create(body));
    }

    static createCellOfAddWalletDexAddress(body: {
        queryId: uint64
        wallet: c.Address
    }) {
        return AddWalletDexAddress.toCell(AddWalletDexAddress.create(body));
    }

    static createCellOfRemoveWalletDexAddress(body: {
        queryId: uint64
        wallet: c.Address
    }) {
        return RemoveWalletDexAddress.toCell(RemoveWalletDexAddress.create(body));
    }

    static createCellOfSetWalletSpecificFee(body: {
        queryId: uint64
        target: c.Address
        buyFeeBps: uint16
        sellFeeBps: uint16
    }) {
        return SetWalletSpecificFee.toCell(SetWalletSpecificFee.create(body));
    }

    static createCellOfClearWalletSpecificFee(body: {
        queryId: uint64
        target: c.Address
    }) {
        return ClearWalletSpecificFee.toCell(ClearWalletSpecificFee.create(body));
    }

    static createCellOfTopUpTons(body: {
    }) {
        return TopUpTons.toCell(TopUpTons.create());
    }

    async sendDeploy(provider: ContractProvider, via: Sender, msgValue: coins, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: c.Cell.EMPTY,
            ...extraOptions
        });
    }

    async sendAskToTransfer(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        jettonAmount: coins
        transferRecipient: c.Address
        sendExcessesTo: c.Address | null
        customPayload: c.Cell | null
        forwardTonAmount: coins
        forwardPayload: PayloadInline | PayloadInRef
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: AskToTransfer.toCell(AskToTransfer.create(body)),
            ...extraOptions
        });
    }

    async sendAskToBurn(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        jettonAmount: coins
        sendExcessesTo: c.Address | null
        customPayload: c.Cell | null
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: AskToBurn.toCell(AskToBurn.create(body)),
            ...extraOptions
        });
    }

    async sendInternalTransferStep(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        jettonAmount: coins
        transferInitiator: c.Address | null
        sendExcessesTo: c.Address | null
        forwardTonAmount: coins
        feeRuntime?: CellRef<WalletFeeRuntime> | null /* = null */
        forwardPayload: PayloadInline | PayloadInRef
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: InternalTransferStep.toCell(InternalTransferStep.create(body)),
            ...extraOptions
        });
    }

    async sendSetWalletFeeRuntime(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        feeTreasury: c.Address | null
        globalBuyFeeBps: uint16
        globalSellFeeBps: uint16
        isDexWallet: boolean
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetWalletFeeRuntime.toCell(SetWalletFeeRuntime.create(body)),
            ...extraOptions
        });
    }

    async sendAddWalletDexAddress(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        wallet: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: AddWalletDexAddress.toCell(AddWalletDexAddress.create(body)),
            ...extraOptions
        });
    }

    async sendRemoveWalletDexAddress(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        wallet: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: RemoveWalletDexAddress.toCell(RemoveWalletDexAddress.create(body)),
            ...extraOptions
        });
    }

    async sendSetWalletSpecificFee(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        target: c.Address
        buyFeeBps: uint16
        sellFeeBps: uint16
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetWalletSpecificFee.toCell(SetWalletSpecificFee.create(body)),
            ...extraOptions
        });
    }

    async sendClearWalletSpecificFee(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        target: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: ClearWalletSpecificFee.toCell(ClearWalletSpecificFee.create(body)),
            ...extraOptions
        });
    }

    async sendTopUpTons(provider: ContractProvider, via: Sender, msgValue: coins, body: {
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: TopUpTons.toCell(TopUpTons.create()),
            ...extraOptions
        });
    }

    async getWalletData(provider: ContractProvider): Promise<JettonWalletDataReply> {
        const r = StackReader.fromGetMethod(4, await provider.get('get_wallet_data', []));
        return ({
            $: 'JettonWalletDataReply',
            jettonBalance: r.readBigInt(),
            ownerAddress: r.readSlice().loadAddress(),
            minterAddress: r.readSlice().loadAddress(),
            jettonWalletCode: r.readCell(),
        });
    }

    async getFeeRuntime(provider: ContractProvider): Promise<WalletFeeRuntimeReply> {
        const r = StackReader.fromGetMethod(4, await provider.get('get_fee_runtime', []));
        return ({
            $: 'WalletFeeRuntimeReply',
            feeTreasury: r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            globalBuyFeeBps: r.readBigInt(),
            globalSellFeeBps: r.readBigInt(),
            isDexWallet: r.readBoolean(),
        });
    }

    async getIsDexWallet(provider: ContractProvider, wallet: c.Address): Promise<boolean> {
        const r = StackReader.fromGetMethod(1, await provider.get('is_dex_wallet', [
            { type: 'slice', cell: makeCellFrom<c.Address>(wallet,
                (v,b) => b.storeAddress(v)
            ) },
        ]));
        return r.readBoolean();
    }

    async getWalletSpecificFee(provider: ContractProvider, target: c.Address): Promise<WalletTransferFeeRuleReply> {
        const r = StackReader.fromGetMethod(3, await provider.get('get_wallet_specific_fee', [
            { type: 'slice', cell: makeCellFrom<c.Address>(target,
                (v,b) => b.storeAddress(v)
            ) },
        ]));
        return ({
            $: 'WalletTransferFeeRuleReply',
            isSet: r.readBoolean(),
            buyFeeBps: r.readBigInt(),
            sellFeeBps: r.readBigInt(),
        });
    }

    async getTransferFeeQuote(provider: ContractProvider, recipient: c.Address, amount: coins): Promise<TransferFeeQuoteReply> {
        const r = StackReader.fromGetMethod(8, await provider.get('get_transfer_fee_quote', [
            { type: 'slice', cell: makeCellFrom<c.Address>(recipient,
                (v,b) => b.storeAddress(v)
            ) },
            { type: 'int', value: amount },
        ]));
        return ({
            $: 'TransferFeeQuoteReply',
            side: r.readBigInt(),
            feeBps: r.readBigInt(),
            feeAmount: r.readBigInt(),
            recipientAmount: r.readBigInt(),
            feeTreasury: r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            feeSubject: r.readNullable<c.Address>(
                (r) => r.readSlice().loadAddress()
            ),
            senderIsDexWallet: r.readBoolean(),
            recipientIsDexWallet: r.readBoolean(),
        });
    }
}
