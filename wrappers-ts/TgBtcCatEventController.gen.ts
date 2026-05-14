// AUTO-GENERATED, do not edit
// It's a TypeScript wrapper for a TgBtcCatEventController contract in Tolk.
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

    readNullable<T>(readFn_T: (r: StackReader) => T): T | null {
        if (this.tuple[0].type === 'null') {
            this.tuple.shift();
            return null;
        }
        return readFn_T(this);
    }

    readCellRef<T>(loadFn_T: LoadCallback<T>): CellRef<T> {
        return { ref: loadFn_T(this.readCell().beginParse()) };
    }
}

// ————————————————————————————————————————————
//   auto-generated serializers to/from cells
//

type coins = bigint

type uint8 = bigint
type uint32 = bigint
type uint64 = bigint
type uint256 = bigint

/**
 > struct EventMetadata {
 >     uri: string_prefixed0x
 > }
 */
export interface EventMetadata {
    readonly $: 'EventMetadata'
    uri: string_prefixed0x
}

export const EventMetadata = {
    create(args: {
        uri: string_prefixed0x
    }): EventMetadata {
        return {
            $: 'EventMetadata',
            ...args
        }
    },
    fromSlice(s: c.Slice): EventMetadata {
        return {
            $: 'EventMetadata',
            uri: string_prefixed0x.fromSlice(s),
        }
    },
    store(self: EventMetadata, b: c.Builder): void {
        string_prefixed0x.store(self.uri, b);
    },
    toCell(self: EventMetadata): c.Cell {
        return makeCellFrom<EventMetadata>(self, EventMetadata.store);
    }
}

/**
 > struct CommunityEvent {
 >     eventKind: uint8
 >     status: uint8
 >     metadataHash: uint256
 >     metadata: Cell<EventMetadata>
 >     startsAt: uint32
 >     endsAt: uint32
 >     createdAt: uint32
 >     updatedAt: uint32
 > }
 */
export interface CommunityEvent {
    readonly $: 'CommunityEvent'
    eventKind: uint8
    status: uint8
    metadataHash: uint256
    metadata: CellRef<EventMetadata>
    startsAt: uint32
    endsAt: uint32
    createdAt: uint32
    updatedAt: uint32
}

export const CommunityEvent = {
    create(args: {
        eventKind: uint8
        status: uint8
        metadataHash: uint256
        metadata: CellRef<EventMetadata>
        startsAt: uint32
        endsAt: uint32
        createdAt: uint32
        updatedAt: uint32
    }): CommunityEvent {
        return {
            $: 'CommunityEvent',
            ...args
        }
    },
    fromSlice(s: c.Slice): CommunityEvent {
        return {
            $: 'CommunityEvent',
            eventKind: s.loadUintBig(8),
            status: s.loadUintBig(8),
            metadataHash: s.loadUintBig(256),
            metadata: loadCellRef<EventMetadata>(s, EventMetadata.fromSlice),
            startsAt: s.loadUintBig(32),
            endsAt: s.loadUintBig(32),
            createdAt: s.loadUintBig(32),
            updatedAt: s.loadUintBig(32),
        }
    },
    store(self: CommunityEvent, b: c.Builder): void {
        b.storeUint(self.eventKind, 8);
        b.storeUint(self.status, 8);
        b.storeUint(self.metadataHash, 256);
        storeCellRef<EventMetadata>(self.metadata, b, EventMetadata.store);
        b.storeUint(self.startsAt, 32);
        b.storeUint(self.endsAt, 32);
        b.storeUint(self.createdAt, 32);
        b.storeUint(self.updatedAt, 32);
    },
    toCell(self: CommunityEvent): c.Cell {
        return makeCellFrom<CommunityEvent>(self, CommunityEvent.store);
    }
}

/**
 > struct EventControllerStorage {
 >     governor: address
 >     nextEventId: uint64
 >     events: map<uint64, CommunityEvent>
 > }
 */
export interface EventControllerStorage {
    readonly $: 'EventControllerStorage'
    governor: c.Address
    nextEventId: uint64
    events: c.Dictionary<uint64, CommunityEvent> /* = [] */
}

export const EventControllerStorage = {
    create(args: {
        governor: c.Address
        nextEventId: uint64
        events: c.Dictionary<uint64, CommunityEvent> /* = [] */
    }): EventControllerStorage {
        return {
            $: 'EventControllerStorage',
            ...args
        }
    },
    fromSlice(s: c.Slice): EventControllerStorage {
        return {
            $: 'EventControllerStorage',
            governor: s.loadAddress(),
            nextEventId: s.loadUintBig(64),
            events: c.Dictionary.load<uint64, CommunityEvent>(c.Dictionary.Keys.BigUint(64), createDictionaryValue<CommunityEvent>(CommunityEvent.fromSlice, CommunityEvent.store), s),
        }
    },
    store(self: EventControllerStorage, b: c.Builder): void {
        b.storeAddress(self.governor);
        b.storeUint(self.nextEventId, 64);
        b.storeDict<uint64, CommunityEvent>(self.events, c.Dictionary.Keys.BigUint(64), createDictionaryValue<CommunityEvent>(CommunityEvent.fromSlice, CommunityEvent.store));
    },
    toCell(self: EventControllerStorage): c.Cell {
        return makeCellFrom<EventControllerStorage>(self, EventControllerStorage.store);
    }
}

/**
 > struct CommunityEventReply {
 >     isSet: bool
 >     eventId: uint64
 >     eventKind: uint8
 >     status: uint8
 >     metadataHash: uint256
 >     metadata: Cell<EventMetadata>?
 >     startsAt: uint32
 >     endsAt: uint32
 >     createdAt: uint32
 >     updatedAt: uint32
 >     governor: address
 > }
 */
export interface CommunityEventReply {
    readonly $: 'CommunityEventReply'
    isSet: boolean
    eventId: uint64
    eventKind: uint8
    status: uint8
    metadataHash: uint256
    metadata: CellRef<EventMetadata> | null
    startsAt: uint32
    endsAt: uint32
    createdAt: uint32
    updatedAt: uint32
    governor: c.Address
}

export const CommunityEventReply = {
    create(args: {
        isSet: boolean
        eventId: uint64
        eventKind: uint8
        status: uint8
        metadataHash: uint256
        metadata: CellRef<EventMetadata> | null
        startsAt: uint32
        endsAt: uint32
        createdAt: uint32
        updatedAt: uint32
        governor: c.Address
    }): CommunityEventReply {
        return {
            $: 'CommunityEventReply',
            ...args
        }
    },
    fromSlice(s: c.Slice): CommunityEventReply {
        return {
            $: 'CommunityEventReply',
            isSet: s.loadBoolean(),
            eventId: s.loadUintBig(64),
            eventKind: s.loadUintBig(8),
            status: s.loadUintBig(8),
            metadataHash: s.loadUintBig(256),
            metadata: s.loadBoolean() ? loadCellRef<EventMetadata>(s, EventMetadata.fromSlice) : null,
            startsAt: s.loadUintBig(32),
            endsAt: s.loadUintBig(32),
            createdAt: s.loadUintBig(32),
            updatedAt: s.loadUintBig(32),
            governor: s.loadAddress(),
        }
    },
    store(self: CommunityEventReply, b: c.Builder): void {
        b.storeBit(self.isSet);
        b.storeUint(self.eventId, 64);
        b.storeUint(self.eventKind, 8);
        b.storeUint(self.status, 8);
        b.storeUint(self.metadataHash, 256);
        storeTolkNullable<CellRef<EventMetadata>>(self.metadata, b,
            (v,b) => storeCellRef<EventMetadata>(v, b, EventMetadata.store)
        );
        b.storeUint(self.startsAt, 32);
        b.storeUint(self.endsAt, 32);
        b.storeUint(self.createdAt, 32);
        b.storeUint(self.updatedAt, 32);
        b.storeAddress(self.governor);
    },
    toCell(self: CommunityEventReply): c.Cell {
        return makeCellFrom<CommunityEventReply>(self, CommunityEventReply.store);
    }
}

/**
 > struct (0x10060001) CreateCommunityEvent {
 >     queryId: uint64
 >     eventKind: uint8
 >     metadataHash: uint256
 >     metadata: Cell<EventMetadata>
 >     startsAt: uint32
 >     endsAt: uint32
 > }
 */
export interface CreateCommunityEvent {
    readonly $: 'CreateCommunityEvent'
    queryId: uint64
    eventKind: uint8
    metadataHash: uint256
    metadata: CellRef<EventMetadata>
    startsAt: uint32
    endsAt: uint32
}

export const CreateCommunityEvent = {
    PREFIX: 0x10060001,

    create(args: {
        queryId: uint64
        eventKind: uint8
        metadataHash: uint256
        metadata: CellRef<EventMetadata>
        startsAt: uint32
        endsAt: uint32
    }): CreateCommunityEvent {
        return {
            $: 'CreateCommunityEvent',
            ...args
        }
    },
    fromSlice(s: c.Slice): CreateCommunityEvent {
        loadAndCheckPrefix32(s, 0x10060001, 'CreateCommunityEvent');
        return {
            $: 'CreateCommunityEvent',
            queryId: s.loadUintBig(64),
            eventKind: s.loadUintBig(8),
            metadataHash: s.loadUintBig(256),
            metadata: loadCellRef<EventMetadata>(s, EventMetadata.fromSlice),
            startsAt: s.loadUintBig(32),
            endsAt: s.loadUintBig(32),
        }
    },
    store(self: CreateCommunityEvent, b: c.Builder): void {
        b.storeUint(0x10060001, 32);
        b.storeUint(self.queryId, 64);
        b.storeUint(self.eventKind, 8);
        b.storeUint(self.metadataHash, 256);
        storeCellRef<EventMetadata>(self.metadata, b, EventMetadata.store);
        b.storeUint(self.startsAt, 32);
        b.storeUint(self.endsAt, 32);
    },
    toCell(self: CreateCommunityEvent): c.Cell {
        return makeCellFrom<CreateCommunityEvent>(self, CreateCommunityEvent.store);
    }
}

/**
 > struct (0x10060002) UpdateCommunityEvent {
 >     queryId: uint64
 >     eventId: uint64
 >     eventKind: uint8
 >     metadataHash: uint256
 >     metadata: Cell<EventMetadata>
 >     startsAt: uint32
 >     endsAt: uint32
 > }
 */
export interface UpdateCommunityEvent {
    readonly $: 'UpdateCommunityEvent'
    queryId: uint64
    eventId: uint64
    eventKind: uint8
    metadataHash: uint256
    metadata: CellRef<EventMetadata>
    startsAt: uint32
    endsAt: uint32
}

export const UpdateCommunityEvent = {
    PREFIX: 0x10060002,

    create(args: {
        queryId: uint64
        eventId: uint64
        eventKind: uint8
        metadataHash: uint256
        metadata: CellRef<EventMetadata>
        startsAt: uint32
        endsAt: uint32
    }): UpdateCommunityEvent {
        return {
            $: 'UpdateCommunityEvent',
            ...args
        }
    },
    fromSlice(s: c.Slice): UpdateCommunityEvent {
        loadAndCheckPrefix32(s, 0x10060002, 'UpdateCommunityEvent');
        return {
            $: 'UpdateCommunityEvent',
            queryId: s.loadUintBig(64),
            eventId: s.loadUintBig(64),
            eventKind: s.loadUintBig(8),
            metadataHash: s.loadUintBig(256),
            metadata: loadCellRef<EventMetadata>(s, EventMetadata.fromSlice),
            startsAt: s.loadUintBig(32),
            endsAt: s.loadUintBig(32),
        }
    },
    store(self: UpdateCommunityEvent, b: c.Builder): void {
        b.storeUint(0x10060002, 32);
        b.storeUint(self.queryId, 64);
        b.storeUint(self.eventId, 64);
        b.storeUint(self.eventKind, 8);
        b.storeUint(self.metadataHash, 256);
        storeCellRef<EventMetadata>(self.metadata, b, EventMetadata.store);
        b.storeUint(self.startsAt, 32);
        b.storeUint(self.endsAt, 32);
    },
    toCell(self: UpdateCommunityEvent): c.Cell {
        return makeCellFrom<UpdateCommunityEvent>(self, UpdateCommunityEvent.store);
    }
}

/**
 > struct (0x10060003) SetCommunityEventStatus {
 >     queryId: uint64
 >     eventId: uint64
 >     status: uint8
 > }
 */
export interface SetCommunityEventStatus {
    readonly $: 'SetCommunityEventStatus'
    queryId: uint64
    eventId: uint64
    status: uint8
}

export const SetCommunityEventStatus = {
    PREFIX: 0x10060003,

    create(args: {
        queryId: uint64
        eventId: uint64
        status: uint8
    }): SetCommunityEventStatus {
        return {
            $: 'SetCommunityEventStatus',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetCommunityEventStatus {
        loadAndCheckPrefix32(s, 0x10060003, 'SetCommunityEventStatus');
        return {
            $: 'SetCommunityEventStatus',
            queryId: s.loadUintBig(64),
            eventId: s.loadUintBig(64),
            status: s.loadUintBig(8),
        }
    },
    store(self: SetCommunityEventStatus, b: c.Builder): void {
        b.storeUint(0x10060003, 32);
        b.storeUint(self.queryId, 64);
        b.storeUint(self.eventId, 64);
        b.storeUint(self.status, 8);
    },
    toCell(self: SetCommunityEventStatus): c.Cell {
        return makeCellFrom<SetCommunityEventStatus>(self, SetCommunityEventStatus.store);
    }
}

/**
 > struct (0x10060004) SetEventControllerGovernor {
 >     queryId: uint64
 >     governor: address
 > }
 */
export interface SetEventControllerGovernor {
    readonly $: 'SetEventControllerGovernor'
    queryId: uint64
    governor: c.Address
}

export const SetEventControllerGovernor = {
    PREFIX: 0x10060004,

    create(args: {
        queryId: uint64
        governor: c.Address
    }): SetEventControllerGovernor {
        return {
            $: 'SetEventControllerGovernor',
            ...args
        }
    },
    fromSlice(s: c.Slice): SetEventControllerGovernor {
        loadAndCheckPrefix32(s, 0x10060004, 'SetEventControllerGovernor');
        return {
            $: 'SetEventControllerGovernor',
            queryId: s.loadUintBig(64),
            governor: s.loadAddress(),
        }
    },
    store(self: SetEventControllerGovernor, b: c.Builder): void {
        b.storeUint(0x10060004, 32);
        b.storeUint(self.queryId, 64);
        b.storeAddress(self.governor);
    },
    toCell(self: SetEventControllerGovernor): c.Cell {
        return makeCellFrom<SetEventControllerGovernor>(self, SetEventControllerGovernor.store);
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
 > type string_prefixed0x = string
 */
export type string_prefixed0x = string

export const string_prefixed0x = {
    fromSlice(s: c.Slice): string_prefixed0x {
        return s.loadStringRefTail();
    },
    store(self: string_prefixed0x, b: c.Builder): void {
        b.storeStringRefTail(self);
    },
    toCell(self: string_prefixed0x): c.Cell {
        return makeCellFrom<string_prefixed0x>(self, string_prefixed0x.store);
    }
}

// ————————————————————————————————————————————
//    class TgBtcCatEventController
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

export class TgBtcCatEventController implements c.Contract {
    static CodeCell = c.Cell.fromBase64('te6ccgECDQEAAjwAART/APSkE/S88sgLAQIBYgIDA/bQ+JGRMOAg1ywggDAADI5gMe1E0PpI0z/0BfiSI8cF8uGRA9M/MdMH0//U0x/XCx8k8uGiIJVTAbzDAJF/4vLhoSWk+CP4IwfIywfPhAYWy/8UzBLLH8sfEssfEssfQASAQPRDAcj6UhLLP/QAye1U4NcsIIAwABTjAokEBQYCASAJCgDyMe1E0PpI1j/0BfiSI8cF8uGRA9M/MdM/0wfT/9TTH9cLHyTy4aIglVMBvMMAkX/i8uGhU1iAQPQO8uGf0wcx0wfT/zHUMdMfMdMfMdMf0x8x0fgjB8jLBxLLBxXL/xPMyx/LH8sfyx9AFIBA9EMByPpSEs70AMntVAAIEAYAAwF41yfjAtcsIIAwACSOHDHtRND6SPiSWMcF8uGRAdM/MfpIMMj6Us7J7VTg1ywmm5CsZDGRMOCEDwHHAPL0BwH+Me1E0PpI1j/0BfiSI8cF8uGRA9M/MdM/1wsHIMABkX+VIMACwwDikX+VIMADwwDikX+VIMAEwwDikX+VIMAFwwDi8uGgUxSAQPQO8uGf0wfTBzHT/9TTH9Mf0x/THzHR+CMGyMsHF8sHFMv/EszLH8sfEssfyx9AFIBA9EMByAgAEvpSEs70AMntVAIBIAsMABG+RgdqJofSQYQAF7vLXtRND6SDHXCz+ABvuFcu1E0PpI0z8x9AVSIIBA9A5voZ4wcHBTAG1UcREgEIpVCOHTB9MH0//U0x/TH9Mf0x/RfwoJg=');

    static Errors = {
        'GovErrors.NotGovernor': 401,
        'GovErrors.UnknownEvent': 415,
        'GovErrors.InvalidEventStatus': 416,
        'GovErrors.InvalidEventTime': 417,
        'GovErrors.InvalidEventKind': 418,
        'GovErrors.InvalidMessage': 65535,
    }

    readonly address: c.Address
    readonly init: { code: c.Cell, data: c.Cell } | undefined

    protected constructor(address: c.Address, init?: { code: c.Cell, data: c.Cell }) {
        this.address = address;
        this.init = init;
    }

    static fromAddress(address: c.Address) {
        return new TgBtcCatEventController(address);
    }

    static fromStorage(emptyStorage: {
        governor: c.Address
        nextEventId: uint64
        events: c.Dictionary<uint64, CommunityEvent> /* = [] */
    }, deployedOptions?: DeployedAddrOptions) {
        const initialState = {
            code: deployedOptions?.overrideContractCode ?? TgBtcCatEventController.CodeCell,
            data: EventControllerStorage.toCell(EventControllerStorage.create(emptyStorage)),
        };
        const address = calculateDeployedAddress(initialState.code, initialState.data, deployedOptions ?? {});
        return new TgBtcCatEventController(address, initialState);
    }

    static createCellOfCreateCommunityEvent(body: {
        queryId: uint64
        eventKind: uint8
        metadataHash: uint256
        metadata: CellRef<EventMetadata>
        startsAt: uint32
        endsAt: uint32
    }) {
        return CreateCommunityEvent.toCell(CreateCommunityEvent.create(body));
    }

    static createCellOfUpdateCommunityEvent(body: {
        queryId: uint64
        eventId: uint64
        eventKind: uint8
        metadataHash: uint256
        metadata: CellRef<EventMetadata>
        startsAt: uint32
        endsAt: uint32
    }) {
        return UpdateCommunityEvent.toCell(UpdateCommunityEvent.create(body));
    }

    static createCellOfSetCommunityEventStatus(body: {
        queryId: uint64
        eventId: uint64
        status: uint8
    }) {
        return SetCommunityEventStatus.toCell(SetCommunityEventStatus.create(body));
    }

    static createCellOfSetEventControllerGovernor(body: {
        queryId: uint64
        governor: c.Address
    }) {
        return SetEventControllerGovernor.toCell(SetEventControllerGovernor.create(body));
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

    async sendCreateCommunityEvent(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        eventKind: uint8
        metadataHash: uint256
        metadata: CellRef<EventMetadata>
        startsAt: uint32
        endsAt: uint32
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: CreateCommunityEvent.toCell(CreateCommunityEvent.create(body)),
            ...extraOptions
        });
    }

    async sendUpdateCommunityEvent(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        eventId: uint64
        eventKind: uint8
        metadataHash: uint256
        metadata: CellRef<EventMetadata>
        startsAt: uint32
        endsAt: uint32
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: UpdateCommunityEvent.toCell(UpdateCommunityEvent.create(body)),
            ...extraOptions
        });
    }

    async sendSetCommunityEventStatus(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        eventId: uint64
        status: uint8
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetCommunityEventStatus.toCell(SetCommunityEventStatus.create(body)),
            ...extraOptions
        });
    }

    async sendSetEventControllerGovernor(provider: ContractProvider, via: Sender, msgValue: coins, body: {
        queryId: uint64
        governor: c.Address
    }, extraOptions?: ExtraSendOptions) {
        return provider.internal(via, {
            value: msgValue,
            body: SetEventControllerGovernor.toCell(SetEventControllerGovernor.create(body)),
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

    async getEvent(provider: ContractProvider, eventId: uint64): Promise<CommunityEventReply> {
        const r = StackReader.fromGetMethod(11, await provider.get('get_event', [
            { type: 'int', value: eventId },
        ]));
        return ({
            $: 'CommunityEventReply',
            isSet: r.readBoolean(),
            eventId: r.readBigInt(),
            eventKind: r.readBigInt(),
            status: r.readBigInt(),
            metadataHash: r.readBigInt(),
            metadata: r.readNullable<CellRef<EventMetadata>>(
                (r) => r.readCellRef<EventMetadata>(EventMetadata.fromSlice)
            ),
            startsAt: r.readBigInt(),
            endsAt: r.readBigInt(),
            createdAt: r.readBigInt(),
            updatedAt: r.readBigInt(),
            governor: r.readSlice().loadAddress(),
        });
    }

    async getNextEventId(provider: ContractProvider): Promise<uint64> {
        const r = StackReader.fromGetMethod(1, await provider.get('get_next_event_id', []));
        return r.readBigInt();
    }

    async getEventControllerGovernor(provider: ContractProvider): Promise<c.Address> {
        const r = StackReader.fromGetMethod(1, await provider.get('get_event_controller_governor', []));
        return r.readSlice().loadAddress();
    }
}
