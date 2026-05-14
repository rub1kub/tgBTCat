// AUTO-GENERATED, do not edit
// It's a TypeScript wrapper for a TgBtcCatWalletFeeRegistry contract in Tolk.
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
}

// ————————————————————————————————————————————
//   auto-generated serializers to/from cells
//

type coins = bigint

type uint16 = bigint
type uint64 = bigint
type uint256 = bigint

/**
 > struct WalletFeeRule {
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 >     reasonHash: uint256
 > }
 */
export interface WalletFeeRule {
    readonly $: 'WalletFeeRule'
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
}

export const WalletFeeRule = {
    create(args: {
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
    }): WalletFeeRule {
        return {
            $: 'WalletFeeRule',
            ...args
        }
    },
    fromSlice(s: c.Slice): WalletFeeRule {
        return {
            $: 'WalletFeeRule',
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
            reasonHash: s.loadUintBig(256),
        }
    },
    store(self: WalletFeeRule, b: c.Builder): void {
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
        b.storeUint(self.reasonHash, 256);
    },
    toCell(self: WalletFeeRule): c.Cell {
        return makeCellFrom<WalletFeeRule>(self, WalletFeeRule.store);
    }
}

/**
 > struct WalletFeeRegistryStorage {
 >     governor: address
 >     rules: map<address, WalletFeeRule>
 >     protectedWallets: map<address, bool>
 > }
 */
export interface WalletFeeRegistryStorage {
    readonly $: 'WalletFeeRegistryStorage'
    governor: c.Address
    rules: c.Dictionary<c.Address, WalletFeeRule> /* = [] */
    protectedWallets: c.Dictionary<c.Address, boolean> /* = [] */
}

export const WalletFeeRegistryStorage = {
    create(args: {
        governor: c.Address
        rules: c.Dictionary<c.Address, WalletFeeRule> /* = [] */
        protectedWallets: c.Dictionary<c.Address, boolean> /* = [] */
    }): WalletFeeRegistryStorage {
        return {
            $: 'WalletFeeRegistryStorage',
            ...args
        }
    },
    fromSlice(s: c.Slice): WalletFeeRegistryStorage {
        return {
            $: 'WalletFeeRegistryStorage',
            governor: s.loadAddress(),
            rules: c.Dictionary.load<c.Address, WalletFeeRule>(c.Dictionary.Keys.Address(), createDictionaryValue<WalletFeeRule>(WalletFeeRule.fromSlice, WalletFeeRule.store), s),
            protectedWallets: c.Dictionary.load<c.Address, boolean>(c.Dictionary.Keys.Address(), c.Dictionary.Values.Bool(), s),
        }
    },
    store(self: WalletFeeRegistryStorage, b: c.Builder): void {
        b.storeAddress(self.governor);
        b.storeDict<c.Address, WalletFeeRule>(self.rules, c.Dictionary.Keys.Address(), createDictionaryValue<WalletFeeRule>(WalletFeeRule.fromSlice, WalletFeeRule.store));
        b.storeDict<c.Address, boolean>(self.protectedWallets, c.Dictionary.Keys.Address(), c.Dictionary.Values.Bool());
    },
    toCell(self: WalletFeeRegistryStorage): c.Cell {
        return makeCellFrom<WalletFeeRegistryStorage>(self, WalletFeeRegistryStorage.store);
    }
}

/**
 > struct WalletFeeRuleReply {
 >     isSet: bool
 >     buyFeeBps: uint16
 >     sellFeeBps: uint16
 >     reasonHash: uint256
 > }
 */
export interface WalletFeeRuleReply {
    readonly $: 'WalletFeeRuleReply'
    isSet: boolean
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
}

export const WalletFeeRuleReply = {
    create(args: {
        isSet: boolean
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
    }): WalletFeeRuleReply {
        return {
            $: 'WalletFeeRuleReply',
            ...args
        }
    },
    fromSlice(s: c.Slice): WalletFeeRuleReply {
        return {
            $: 'WalletFeeRuleReply',
            isSet: s.loadBoolean(),
            buyFeeBps: s.loadUintBig(16),
            sellFeeBps: s.loadUintBig(16),
            reasonHash: s.loadUintBig(256),
        }
    },
    store(self: WalletFeeRuleReply, b: c.Builder): void {
        b.storeBit(self.isSet);
        b.storeUint(self.buyFeeBps, 16);
        b.storeUint(self.sellFeeBps, 16);
        b.storeUint(self.reasonHash, 256);
    },
    toCell(self: WalletFeeRuleReply): c.Cell {
        return makeCellFrom<WalletFeeRuleReply>(self, WalletFeeRuleReply.store);
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
 > struct (0x10020003) SetProtectedWallet {
 >     queryId: uint64
 >     target: address
 >     isProtected: bool
 > }
 */
export interface SetProtectedWallet {
    readonly $: 'SetProtectedWallet'
    queryId: uint64
    target: c.Address
    isProtected: boolean
}

export const SetProtectedWallet = {
    PREFIX: 0x10020003,

    create(args: {
        queryId: uint64
        target: c.Address
        isProtected: boolean
    }): SetProtectedWallet {
        return {
            $: 'SetProtectedWallet',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetProtectedWallet {
        loadAndCheckPrefix32(s, 0x10020003, 'SetProtectedWallet');
        return {
            $: 'SetProtectedWallet',
            queryId: s.loadUintBig(64),
            target: s.loadAddress(),
            isProtected: s.loadBoolean(),
        }
    },
    store(self: SetProtectedWallet, b: c.Builder): void {
        b.storeUint(0x10020003, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.target);
        b.storeBit(self.isProtected);
    },
    toCell(self: SetProtectedWallet): c.Cell {
        return makeCellFrom<SetProtectedWallet>(self, SetProtectedWallet.store);
    }
}

/**
 > struct (0x10020004) SetWalletFeeRegistryGovernor {
 >     queryId: uint64
 >     governor: address
 > }
 */
export interface SetWalletFeeRegistryGovernor {
    readonly $: 'SetWalletFeeRegistryGovernor'
    queryId: uint64
    governor: c.Address
}

export const SetWalletFeeRegistryGovernor = {
    PREFIX: 0x10020004,

    create(args: {
        queryId: uint64
        governor: c.Address
    }): SetWalletFeeRegistryGovernor {
        return {
            $: 'SetWalletFeeRegistryGovernor',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetWalletFeeRegistryGovernor {
        loadAndCheckPrefix32(s, 0x10020004, 'SetWalletFeeRegistryGovernor');
        return {
            $: 'SetWalletFeeRegistryGovernor',
            queryId: s.loadUintBig(64),
            governor: s.loadAddress(),
        }
    },
    store(self: SetWalletFeeRegistryGovernor, b: c.Builder): void {
        b.storeUint(0x10020004, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.governor);
    },
    toCell(self: SetWalletFeeRegistryGovernor): c.Cell {
        return makeCellFrom<SetWalletFeeRegistryGovernor>(self, SetWalletFeeRegistryGovernor.store);
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
//    class TgBtcCatWalletFeeRegistry
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

export class TgBtcCatWalletFeeRegistry implements c.Contract {
    static CodeCell = c.Cell.fromBase64('te6ccgECCgEAAZIAART/APSkE/S88sgLAQIBYgIDBPbQ+JGRMOAg1ywggBAADI5XMe1E0PpI9AQg9AX4kiTHBfLhkQTTPzH6SNMP0w/XC/9SOIEBC/QKb6Ex8tGTIYEnELvy4ZIggScQu/LhkgHIyw/LDxXL/1BCgQEL9EEByPpS9ADOye1U4NcsIIAQABTjAtcsIIAQABzjAokEBQYHAgEgCAkAcjHtRND6SPQEIPQF+JIkxwXy4ZEE0z8x+kgwUgWBAQv0Cm+hMfLRk1AzgQEL9FkwAcj6UvQAzsntVACMMe1E0PpI9AT0BfiSI8cF8uGRA9M/MfpI1woAjhPIz4NUIAWBAQv0QVAzgQEL9FkwmVADgQEL9FkwAuIByPpS9AD0AMntVAAIEAIABABm1yeOHDHtRND6SPiSWMcF8uGRAdM/MfpIMMj6Us7J7VTg1ywmm5CsZDGRMOCEDwHHAPL0AEW+RN9qJofSQY+gLAgIX6BTfQypg4OCmAcOmH6Yfp/+i/qpBAApv2Q3aiaH0kGPoA+gLAgIX6BTfQmM');

    static Errors = {
        'GovErrors.NotGovernor': 401,
        'GovErrors.InvalidFee': 402,
        'GovErrors.ProtectedWallet': 403,
        'GovErrors.InvalidMessage': 65535,
    }

    readonly address: c.Address
    readonly init: { code: c.Cell, data: c.Cell } | undefined

    protected constructor(address: c.Address, init?: { code: c.Cell, data: c.Cell }) {
        this.address = address;
        this.init = init;
    }

    static fromAddress(address: c.Address) {
        return new TgBtcCatWalletFeeRegistry(address);
    }

    static fromStorage(emptyStorage: {
        governor: c.Address
        rules: c.Dictionary<c.Address, WalletFeeRule> /* = [] */
        protectedWallets: c.Dictionary<c.Address, boolean> /* = [] */
    }, deployedOptions?: DeployedAddrOptions) {
        const initialState = {
            code: deployedOptions?.overrideContractCode ?? TgBtcCatWalletFeeRegistry.CodeCell,
            data: WalletFeeRegistryStorage.toCell(WalletFeeRegistryStorage.create(emptyStorage)),
        };
        const address = calculateDeployedAddress(initialState.code, initialState.data, deployedOptions ?? {});
        return new TgBtcCatWalletFeeRegistry(address, initialState);
    }

    static createCellOfSetWalletFees(body: {
        queryId: uint64
        target: c.Address
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
    }) {
        return SetWalletFees.toCell(SetWalletFees.create(body));
    }

    static createCellOfClearWalletFees(body: {
        queryId: uint64
        target: c.Address
    }) {
        return ClearWalletFees.toCell(ClearWalletFees.create(body));
    }

    static createCellOfSetProtectedWallet(body: {
        queryId: uint64
        target: c.Address
        isProtected: boolean
    }) {
        return SetProtectedWallet.toCell(SetProtectedWallet.create(body));
    }

    static createCellOfSetWalletFeeRegistryGovernor(body: {
        queryId: uint64
        governor: c.Address
    }) {
        return SetWalletFeeRegistryGovernor.toCell(SetWalletFeeRegistryGovernor.create(body));
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

    async sendSetWalletFees(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        target: c.Address
        buyFeeBps: uint16
        sellFeeBps: uint16
        reasonHash: uint256
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetWalletFees.toCell(SetWalletFees.create(body)),
            ...extraOptions
        });
    }

    async sendClearWalletFees(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        target: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: ClearWalletFees.toCell(ClearWalletFees.create(body)),
            ...extraOptions
        });
    }

    async sendSetProtectedWallet(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        target: c.Address
        isProtected: boolean
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetProtectedWallet.toCell(SetProtectedWallet.create(body)),
            ...extraOptions
        });
    }

    async sendSetWalletFeeRegistryGovernor(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        governor: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetWalletFeeRegistryGovernor.toCell(SetWalletFeeRegistryGovernor.create(body)),
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

    async getWalletFees(provider: ContractProvider, target: c.Address): Promise<WalletFeeRuleReply> {
        const r = StackReader.fromGetMethod(4, await provider.get('get_wallet_fees', [
            { type: 'slice', cell: makeCellFrom<c.Address>(target,
                (v,b) => b.storeAddress(v)
            ) },
        ]));
        return ({
            $: 'WalletFeeRuleReply',
            isSet: r.readBoolean(),
            buyFeeBps: r.readBigInt(),
            sellFeeBps: r.readBigInt(),
            reasonHash: r.readBigInt(),
        });
    }

    async getIsWalletProtected(provider: ContractProvider, target: c.Address): Promise<boolean> {
        const r = StackReader.fromGetMethod(1, await provider.get('is_wallet_protected', [
            { type: 'slice', cell: makeCellFrom<c.Address>(target,
                (v,b) => b.storeAddress(v)
            ) },
        ]));
        return r.readBoolean();
    }
}
