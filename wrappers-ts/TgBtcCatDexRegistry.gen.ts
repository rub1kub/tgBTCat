// AUTO-GENERATED, do not edit
// It's a TypeScript wrapper for a TgBtcCatDexRegistry contract in Tolk.
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

type uint64 = bigint

/**
 > struct DexRegistryStorage {
 >     governor: address
 >     dexWallets: map<address, bool>
 > }
 */
export interface DexRegistryStorage {
    readonly $: 'DexRegistryStorage'
    governor: c.Address
    dexWallets: c.Dictionary<c.Address, boolean> /* = [] */
}

export const DexRegistryStorage = {
    create(args: {
        governor: c.Address
        dexWallets: c.Dictionary<c.Address, boolean> /* = [] */
    }): DexRegistryStorage {
        return {
            $: 'DexRegistryStorage',
            ...args
        }
    },
    fromSlice(s: c.Slice): DexRegistryStorage {
        return {
            $: 'DexRegistryStorage',
            governor: s.loadAddress(),
            dexWallets: c.Dictionary.load<c.Address, boolean>(c.Dictionary.Keys.Address(), c.Dictionary.Values.Bool(), s),
        }
    },
    store(self: DexRegistryStorage, b: c.Builder): void {
        b.storeAddress(self.governor);
        b.storeDict<c.Address, boolean>(self.dexWallets, c.Dictionary.Keys.Address(), c.Dictionary.Values.Bool());
    },
    toCell(self: DexRegistryStorage): c.Cell {
        return makeCellFrom<DexRegistryStorage>(self, DexRegistryStorage.store);
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
 > struct (0x10030003) SetDexRegistryGovernor {
 >     queryId: uint64
 >     governor: address
 > }
 */
export interface SetDexRegistryGovernor {
    readonly $: 'SetDexRegistryGovernor'
    queryId: uint64
    governor: c.Address
}

export const SetDexRegistryGovernor = {
    PREFIX: 0x10030003,

    create(args: {
        queryId: uint64
        governor: c.Address
    }): SetDexRegistryGovernor {
        return {
            $: 'SetDexRegistryGovernor',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetDexRegistryGovernor {
        loadAndCheckPrefix32(s, 0x10030003, 'SetDexRegistryGovernor');
        return {
            $: 'SetDexRegistryGovernor',
            queryId: s.loadUintBig(64),
            governor: s.loadAddress(),
        }
    },
    store(self: SetDexRegistryGovernor, b: c.Builder): void {
        b.storeUint(0x10030003, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.governor);
    },
    toCell(self: SetDexRegistryGovernor): c.Cell {
        return makeCellFrom<SetDexRegistryGovernor>(self, SetDexRegistryGovernor.store);
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
//    class TgBtcCatDexRegistry
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

export class TgBtcCatDexRegistry implements c.Contract {
    static CodeCell = c.Cell.fromBase64('te6ccgEBBgEA0gABFP8A9KQT9LzyyAsBAgFiAgMC+ND4kZEw4CDXLCCAGAAMjiox7UTQ+kj0BfiSIscF8uGRAtM/MfpIMMjPg0ATgQEL9EEByPpS9ADJ7VTg1ywggBgAFI4nMe1E0PpI9AX4kiLHBfLhkQLTPzH6SDBYgQEL9FkwAcj6UvQAye1U4NcsIIAYABzjAtcsJpuQrGQEBQAloRLB2omh9JBj6AsCAhfoFN9CYwA4Me1E0PpI+JJYxwXy4ZEB0z8x+kgwyPpSzsntVAAWMZEw4IQPAccA8vQ=');

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
        return new TgBtcCatDexRegistry(address);
    }

    static fromStorage(emptyStorage: {
        governor: c.Address
        dexWallets: c.Dictionary<c.Address, boolean> /* = [] */
    }, deployedOptions?: DeployedAddrOptions) {
        const initialState = {
            code: deployedOptions?.overrideContractCode ?? TgBtcCatDexRegistry.CodeCell,
            data: DexRegistryStorage.toCell(DexRegistryStorage.create(emptyStorage)),
        };
        const address = calculateDeployedAddress(initialState.code, initialState.data, deployedOptions ?? {});
        return new TgBtcCatDexRegistry(address, initialState);
    }

    static createCellOfAddDexWallet(body: {
        queryId: uint64
        wallet: c.Address
    }) {
        return AddDexWallet.toCell(AddDexWallet.create(body));
    }

    static createCellOfRemoveDexWallet(body: {
        queryId: uint64
        wallet: c.Address
    }) {
        return RemoveDexWallet.toCell(RemoveDexWallet.create(body));
    }

    static createCellOfSetDexRegistryGovernor(body: {
        queryId: uint64
        governor: c.Address
    }) {
        return SetDexRegistryGovernor.toCell(SetDexRegistryGovernor.create(body));
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

    async sendAddDexWallet(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        wallet: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: AddDexWallet.toCell(AddDexWallet.create(body)),
            ...extraOptions
        });
    }

    async sendRemoveDexWallet(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        wallet: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: RemoveDexWallet.toCell(RemoveDexWallet.create(body)),
            ...extraOptions
        });
    }

    async sendSetDexRegistryGovernor(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        governor: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetDexRegistryGovernor.toCell(SetDexRegistryGovernor.create(body)),
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

    async getIsDexWallet(provider: ContractProvider, wallet: c.Address): Promise<boolean> {
        const r = StackReader.fromGetMethod(1, await provider.get('is_dex_wallet', [
            { type: 'slice', cell: makeCellFrom<c.Address>(wallet,
                (v,b) => b.storeAddress(v)
            ) },
        ]));
        return r.readBoolean();
    }
}
