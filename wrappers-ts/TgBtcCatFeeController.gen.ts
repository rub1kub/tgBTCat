// AUTO-GENERATED, do not edit
// It's a TypeScript wrapper for a TgBtcCatFeeController contract in Tolk.
/* eslint-disable */

import * as c from '@ton/core';
import { beginCell, ContractProvider, Sender, SendMode } from '@ton/core';

// ————————————————————————————————————————————
//   predefined types and functions
//

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
}

// ————————————————————————————————————————————
//   auto-generated serializers to/from cells
//

type coins = bigint

type uint16 = bigint
type uint64 = bigint

/**
 > struct FeeControllerStorage {
 >     governor: address
 >     feeTreasury: address
 >     globalBuyFeeBps: uint16
 >     globalSellFeeBps: uint16
 > }
 */
export interface FeeControllerStorage {
    readonly $: 'FeeControllerStorage'
    governor: c.Address
    feeTreasury: c.Address
    globalBuyFeeBps: uint16
    globalSellFeeBps: uint16
}

export const FeeControllerStorage = {
    create(args: {
        governor: c.Address
        feeTreasury: c.Address
        globalBuyFeeBps: uint16
        globalSellFeeBps: uint16
    }): FeeControllerStorage {
        return {
            $: 'FeeControllerStorage',
            ...args
        }
    },
    fromSlice(s: c.Slice): FeeControllerStorage {
        return {
            $: 'FeeControllerStorage',
            governor: s.loadAddress(),
            feeTreasury: s.loadAddress(),
            globalBuyFeeBps: s.loadUintBig(16),
            globalSellFeeBps: s.loadUintBig(16),
        }
    },
    store(self: FeeControllerStorage, b: c.Builder): void {
        b.storeAddress(self.governor);
        b.storeAddress(self.feeTreasury);
        b.storeUint(self.globalBuyFeeBps, 16);
        b.storeUint(self.globalSellFeeBps, 16);
    },
    toCell(self: FeeControllerStorage): c.Cell {
        return makeCellFrom<FeeControllerStorage>(self, FeeControllerStorage.store);
    }
}

/**
 > struct FeeConfigReply {
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 >     feeTreasury: address
 >     governor: address
 > }
 */
export interface FeeConfigReply {
    readonly $: 'FeeConfigReply'
    buyFeeBps: uint16
    sellFeeBps: uint16
    feeTreasury: c.Address
    governor: c.Address
}

export const FeeConfigReply = {
    create(args: {
        buyFeeBps: uint16
        sellFeeBps: uint16
        feeTreasury: c.Address
        governor: c.Address
    }): FeeConfigReply {
        return {
            $: 'FeeConfigReply',
            ...args
        }
    },
    fromSlice(s: c.Slice): FeeConfigReply {
        return {
            $: 'FeeConfigReply',
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
            feeTreasury: s.loadAddress(),
            governor: s.loadAddress(),
        }
    },
    store(self: FeeConfigReply, b: c.Builder): void {
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
        b.storeAddress(self.feeTreasury);
        b.storeAddress(self.governor);
    },
    toCell(self: FeeConfigReply): c.Cell {
        return makeCellFrom<FeeConfigReply>(self, FeeConfigReply.store);
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
 > struct (0x10010002) SetFeeTreasury {
 >     queryId: uint64
 >     feeTreasury: address
 > }
 */
export interface SetFeeTreasury {
    readonly $: 'SetFeeTreasury'
    queryId: uint64
    feeTreasury: c.Address
}

export const SetFeeTreasury = {
    PREFIX: 0x10010002,

    create(args: {
        queryId: uint64
        feeTreasury: c.Address
    }): SetFeeTreasury {
        return {
            $: 'SetFeeTreasury',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetFeeTreasury {
        loadAndCheckPrefix32(s, 0x10010002, 'SetFeeTreasury');
        return {
            $: 'SetFeeTreasury',
            queryId: s.loadUintBig(64),
            feeTreasury: s.loadAddress(),
        }
    },
    store(self: SetFeeTreasury, b: c.Builder): void {
        b.storeUint(0x10010002, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.feeTreasury);
    },
    toCell(self: SetFeeTreasury): c.Cell {
        return makeCellFrom<SetFeeTreasury>(self, SetFeeTreasury.store);
    }
}

/**
 > struct (0x10010003) SetFeeControllerGovernor {
 >     queryId: uint64
 >     governor: address
 > }
 */
export interface SetFeeControllerGovernor {
    readonly $: 'SetFeeControllerGovernor'
    queryId: uint64
    governor: c.Address
}

export const SetFeeControllerGovernor = {
    PREFIX: 0x10010003,

    create(args: {
        queryId: uint64
        governor: c.Address
    }): SetFeeControllerGovernor {
        return {
            $: 'SetFeeControllerGovernor',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetFeeControllerGovernor {
        loadAndCheckPrefix32(s, 0x10010003, 'SetFeeControllerGovernor');
        return {
            $: 'SetFeeControllerGovernor',
            queryId: s.loadUintBig(64),
            governor: s.loadAddress(),
        }
    },
    store(self: SetFeeControllerGovernor, b: c.Builder): void {
        b.storeUint(0x10010003, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.governor);
    },
    toCell(self: SetFeeControllerGovernor): c.Cell {
        return makeCellFrom<SetFeeControllerGovernor>(self, SetFeeControllerGovernor.store);
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

// ————————————————————————————————————————————
//    class TgBtcCatFeeController
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

export class TgBtcCatFeeController implements c.Contract {
    static CodeCell = c.Cell.fromBase64('te6ccgEBCAEA4AABFP8A9KQT9LzyyAsBAgFiAgME+ND4kZEw4CDXLCCACAAMjjkx7UTQ+kj6SDD4kiLHBfLhkQLTPzHTD9cLDyGBJxC78uGSIIEnELvy4ZICyPpSE/pSEssPyw/J7VTg1ywggAgAFI4iMe1E0PpI+kgx+JIixwXy4ZEC0z8x+kgwAcj6UvpSzsntVOCJ1yfjAokEBQYHACGh4ZHaiaH0kfSRph+uFh6ABwAIEAEAAwA4Me1E0PpI+JJYxwXy4ZEB0z8x+kgwyPpSzsntVAAI03IVjAAa1ycxkTDghA8BxwDy9A==');

    static Errors = {
        'GovErrors.NotGovernor': 401,
        'GovErrors.InvalidFee': 402,
        'GovErrors.InvalidMessage': 65535,
    }

    readonly address: c.Address
    readonly init: { code: c.Cell, data: c.Cell } | undefined

    protected constructor(address: c.Address, init?: { code: c.Cell, data: c.Cell }) {
        this.address = address;
        this.init = init;
    }

    static fromAddress(address: c.Address) {
        return new TgBtcCatFeeController(address);
    }

    static fromStorage(emptyStorage: {
        governor: c.Address
        feeTreasury: c.Address
        globalBuyFeeBps: uint16
        globalSellFeeBps: uint16
    }, deployedOptions?: DeployedAddrOptions) {
        const initialState = {
            code: deployedOptions?.overrideContractCode ?? TgBtcCatFeeController.CodeCell,
            data: FeeControllerStorage.toCell(FeeControllerStorage.create(emptyStorage)),
        };
        const address = calculateDeployedAddress(initialState.code, initialState.data, deployedOptions ?? {});
        return new TgBtcCatFeeController(address, initialState);
    }

    static createCellOfSetGlobalFees(body: {
        queryId: uint64
        buyFeeBps: uint16
        sellFeeBps: uint16
    }) {
        return SetGlobalFees.toCell(SetGlobalFees.create(body));
    }

    static createCellOfSetFeeTreasury(body: {
        queryId: uint64
        feeTreasury: c.Address
    }) {
        return SetFeeTreasury.toCell(SetFeeTreasury.create(body));
    }

    static createCellOfSetFeeControllerGovernor(body: {
        queryId: uint64
        governor: c.Address
    }) {
        return SetFeeControllerGovernor.toCell(SetFeeControllerGovernor.create(body));
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

    async sendSetGlobalFees(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        buyFeeBps: uint16
        sellFeeBps: uint16
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetGlobalFees.toCell(SetGlobalFees.create(body)),
            ...extraOptions
        });
    }

    async sendSetFeeTreasury(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        feeTreasury: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetFeeTreasury.toCell(SetFeeTreasury.create(body)),
            ...extraOptions
        });
    }

    async sendSetFeeControllerGovernor(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        governor: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetFeeControllerGovernor.toCell(SetFeeControllerGovernor.create(body)),
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

    async getGlobalFees(provider: ContractProvider): Promise<FeeConfigReply> {
        const r = StackReader.fromGetMethod(4, await provider.get('get_global_fees', []));
        return ({
            $: 'FeeConfigReply',
            buyFeeBps: r.readBigInt(),
            sellFeeBps: r.readBigInt(),
            feeTreasury: r.readSlice().loadAddress(),
            governor: r.readSlice().loadAddress(),
        });
    }
}
