import "@stdlib/strings"

enum GovErrors {
    NotGovernor = 401
    InvalidFee = 402
    ProtectedWallet = 403
    InvalidVotePayload = 404
    InvalidVoteSide = 405
    UnknownProposal = 406
    VotingClosed = 407
    VoteTooSmall = 408
    NotVoteJettonWallet = 409
    ProposalAlreadyExecuted = 410
    ProposalRejected = 411
    ExecutionTargetMissing = 412
    VotingOpen = 413
    InvalidActionType = 414
    UnknownEvent = 415
    InvalidEventStatus = 416
    InvalidEventTime = 417
    InvalidEventKind = 418
    ProposalFeeTooSmall = 419
    InvalidMessage = 0xFFFF
}

const FEE_BPS_DENOMINATOR = 10000
const MIN_PROPOSAL_CREATE_VALUE = 50000000
const VOTE_SIDE_FOR = 1
const VOTE_SIDE_AGAINST = 2
const VOTE_SIDE_ABSTAIN = 3
const ACTION_SET_GLOBAL_FEES = 1
const ACTION_SET_WALLET_FEES = 2
const ACTION_CLEAR_WALLET_FEES = 3
const ACTION_ADD_DEX_WALLET = 4
const ACTION_REMOVE_DEX_WALLET = 5
const ACTION_ROUTE_WALLET_RUNTIME = 6
const ACTION_ROUTE_ADD_WALLET_DEX = 7
const ACTION_ROUTE_REMOVE_WALLET_DEX = 8
const ACTION_ROUTE_SET_WALLET_SPECIFIC_FEE = 9
const ACTION_ROUTE_CLEAR_WALLET_SPECIFIC_FEE = 10
const ACTION_RAW_EXECUTION = 11
const RUNTIME_FLAG_IS_DEX_WALLET = 1

const EVENT_STATUS_DRAFT = 1
const EVENT_STATUS_ACTIVE = 2
const EVENT_STATUS_PAUSED = 3
const EVENT_STATUS_ENDED = 4
const EVENT_STATUS_CANCELLED = 5

struct FeeControllerStorage {
    governor: address
    feeTreasury: address
    globalBuyFeeBps: uint16
    globalSellFeeBps: uint16
}

fun FeeControllerStorage.load(): FeeControllerStorage {
    return FeeControllerStorage.fromCell(contract.getData());
}

fun FeeControllerStorage.save(self) {
    contract.setData(self.toCell());
}

struct WalletFeeRule {
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
}

struct WalletFeeRegistryStorage {
    governor: address
    rules: map<address, WalletFeeRule> = []
    protectedWallets: map<address, bool> = []
}

fun WalletFeeRegistryStorage.load(): WalletFeeRegistryStorage {
    return WalletFeeRegistryStorage.fromCell(contract.getData());
}

fun WalletFeeRegistryStorage.save(self) {
    contract.setData(self.toCell());
}

struct DexRegistryStorage {
    governor: address
    dexWallets: map<address, bool> = []
}

fun DexRegistryStorage.load(): DexRegistryStorage {
    return DexRegistryStorage.fromCell(contract.getData());
}

fun DexRegistryStorage.save(self) {
    contract.setData(self.toCell());
}

struct TreasuryStorage {
    governor: address
    primaryJettonWallet: address?
}

fun TreasuryStorage.load(): TreasuryStorage {
    return TreasuryStorage.fromCell(contract.getData());
}

fun TreasuryStorage.save(self) {
    contract.setData(self.toCell());
}

struct EventMetadata {
    uri: string_prefixed0x
}

struct CommunityEvent {
    eventKind: uint8
    status: uint8
    metadataHash: uint256
    metadata: Cell<EventMetadata>
    startsAt: uint32
    endsAt: uint32
    createdAt: uint32
    updatedAt: uint32
}

struct EventControllerStorage {
    governor: address
    nextEventId: uint64
    events: map<uint64, CommunityEvent> = []
}

fun EventControllerStorage.load(): EventControllerStorage {
    return EventControllerStorage.fromCell(contract.getData());
}

fun EventControllerStorage.save(self) {
    contract.setData(self.toCell());
}

struct FeeConfigReply {
    buyFeeBps: uint16
    sellFeeBps: uint16
    feeTreasury: address
    governor: address
}

struct TreasuryConfigReply {
    governor: address
    primaryJettonWallet: address?
}

struct CommunityEventReply {
    isSet: bool
    eventId: uint64
    eventKind: uint8
    status: uint8
    metadataHash: uint256
    metadata: Cell<EventMetadata>?
    startsAt: uint32
    endsAt: uint32
    createdAt: uint32
    updatedAt: uint32
    governor: address
}

struct WalletFeeRuleReply {
    isSet: bool
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
}

struct Proposal {
    actionType: uint8
    target: address?
    auxTarget: Cell<address>? = null
    flags: uint8 = 0
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
    votingEndsAt: uint32
    forVotes: coins
    againstVotes: coins
    abstainVotes: coins
    executed: bool
    rawExecution: Cell<RawExecution>? = null
}

struct RawExecution {
    dest: address
    value: coins
    body: cell
}

struct GovernorExecutionTargets {
    feeController: address?
    walletFeeRegistry: address?
    dexRegistry: address?
}

struct GovernorExecutionConfig {
    targets: Cell<GovernorExecutionTargets>? = null
    minQuorumVotes: coins
    executionValue: coins
    runtime: Cell<GovernorRuntimeExecutionConfig>? = null
}

struct GovernorRuntimeExecutionConfig {
    jettonMaster: address?
    feeTreasury: address?
    walletRouteValue: coins
}

struct GovernorStorage {
    admin: address
    voteJettonWallet: address
    minVoteAmount: coins
    nextProposalId: uint64
    proposals: map<uint64, Proposal> = []
    executionConfig: Cell<GovernorExecutionConfig>? = null
}

fun GovernorStorage.load(): GovernorStorage {
    return GovernorStorage.fromCell(contract.getData());
}

fun GovernorStorage.save(self) {
    contract.setData(self.toCell());
}

fun defaultGovernorExecutionConfig(): GovernorExecutionConfig {
    return {
        targets: null,
        minQuorumVotes: 0,
        executionValue: 50000000,
        runtime: null,
    };
}

fun defaultGovernorExecutionTargets(): GovernorExecutionTargets {
    return {
        feeController: null,
        walletFeeRegistry: null,
        dexRegistry: null,
    };
}

fun GovernorStorage.loadExecutionConfig(self): GovernorExecutionConfig {
    if (self.executionConfig == null) {
        return defaultGovernorExecutionConfig();
    }

    return GovernorExecutionConfig.fromCell(self.executionConfig!);
}

fun GovernorExecutionConfig.loadTargets(self): GovernorExecutionTargets {
    if (self.targets == null) {
        return defaultGovernorExecutionTargets();
    }

    return GovernorExecutionTargets.fromCell(self.targets!);
}

fun defaultGovernorRuntimeExecutionConfig(): GovernorRuntimeExecutionConfig {
    return {
        jettonMaster: null,
        feeTreasury: null,
        walletRouteValue: 120000000,
    };
}

fun GovernorExecutionConfig.loadRuntime(self): GovernorRuntimeExecutionConfig {
    if (self.runtime == null) {
        return defaultGovernorRuntimeExecutionConfig();
    }

    return GovernorRuntimeExecutionConfig.fromCell(self.runtime!);
}

struct ProposalReply {
    isSet: bool
    actionType: uint8
    target: address?
    auxTarget: address?
    flags: uint8
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
    votingEndsAt: uint32
    forVotes: coins
    againstVotes: coins
    abstainVotes: coins
    executed: bool
    hasRawExecution: bool
}

struct RawExecutionReply {
    isSet: bool
    dest: address?
    value: coins
    body: cell?
}

struct (0x10010001) SetGlobalFees {
    queryId: uint64
    buyFeeBps: uint16
    sellFeeBps: uint16
}

struct (0x10010002) SetFeeTreasury {
    queryId: uint64
    feeTreasury: address
}

struct (0x10010003) SetFeeControllerGovernor {
    queryId: uint64
    governor: address
}

struct (0x10020001) SetWalletFees {
    queryId: uint64
    target: address
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
}

struct (0x10020002) ClearWalletFees {
    queryId: uint64
    target: address
}

struct (0x10020003) SetProtectedWallet {
    queryId: uint64
    target: address
    isProtected: bool
}

struct (0x10020004) SetWalletFeeRegistryGovernor {
    queryId: uint64
    governor: address
}

struct (0x10030001) AddDexWallet {
    queryId: uint64
    wallet: address
}

struct (0x10030002) RemoveDexWallet {
    queryId: uint64
    wallet: address
}

struct (0x10030003) SetDexRegistryGovernor {
    queryId: uint64
    governor: address
}

struct (0x10050001) SendTreasuryTon {
    queryId: uint64
    recipient: address
    amount: coins
    bounce: bool
}

struct (0x10050003) SetTreasuryGovernor {
    queryId: uint64
    governor: address
}

struct (0x10050004) SetTreasuryPrimaryJettonWallet {
    queryId: uint64
    primaryJettonWallet: address?
}

struct (0x10060001) CreateCommunityEvent {
    queryId: uint64
    eventKind: uint8
    metadataHash: uint256
    metadata: Cell<EventMetadata>
    startsAt: uint32
    endsAt: uint32
}

struct (0x10060002) UpdateCommunityEvent {
    queryId: uint64
    eventId: uint64
    eventKind: uint8
    metadataHash: uint256
    metadata: Cell<EventMetadata>
    startsAt: uint32
    endsAt: uint32
}

struct (0x10060003) SetCommunityEventStatus {
    queryId: uint64
    eventId: uint64
    status: uint8
}

struct (0x10060004) SetEventControllerGovernor {
    queryId: uint64
    governor: address
}

struct (0x10040001) CreateGovernanceProposal {
    queryId: uint64
    actionType: uint8
    target: address?
    auxTarget: address?
    flags: uint8
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
    votingEndsAt: uint32
}

struct (0x10040002) SetVoteJettonWallet {
    queryId: uint64
    voteJettonWallet: address
}

struct (0x10040003) SetMinimumVoteAmount {
    queryId: uint64
    minVoteAmount: coins
}

struct (0x10040004) SetExecutionTargets {
    queryId: uint64
    feeController: address?
    walletFeeRegistry: address?
    dexRegistry: address?
}

struct (0x10040005) SetGovernanceQuorum {
    queryId: uint64
    minQuorumVotes: coins
}

struct (0x10040006) SetExecutionValue {
    queryId: uint64
    executionValue: coins
}

struct (0x10040007) ExecuteProposal {
    queryId: uint64
    proposalId: uint64
}

struct (0x10040008) SetWalletRuntimeExecution {
    queryId: uint64
    jettonMaster: address?
    feeTreasury: address?
    walletRouteValue: coins
}

struct (0x10040009) ClaimJettonMasterAdmin {
    queryId: uint64
    jettonMaster: address
    claimValue: coins
}

struct (0x1004000a) CreateRawExecutionProposal {
    queryId: uint64
    dest: address
    value: coins
    body: cell
    reasonHash: uint256
    votingEndsAt: uint32
}

struct (0x766f7465) CastVotePayload {
    proposalId: uint64
    side: uint8
    commentHash: uint256
}

struct (0xd372158c) GovernanceTopUp {}

fun assertGovernor(sender: address, governor: address) {
    assert (sender == governor) throw GovErrors.NotGovernor;
}

fun assertFeeBps(feeBps: int) {
    assert (feeBps <= FEE_BPS_DENOMINATOR) throw GovErrors.InvalidFee;
}

fun assertVoteSide(side: int) {
    assert (
        side == VOTE_SIDE_FOR || side == VOTE_SIDE_AGAINST || side == VOTE_SIDE_ABSTAIN
    ) throw GovErrors.InvalidVoteSide;
}

fun assertEventKind(eventKind: int) {
    assert (eventKind != 0) throw GovErrors.InvalidEventKind;
}

fun assertEventStatus(status: int) {
    assert (
        status == EVENT_STATUS_DRAFT || status == EVENT_STATUS_ACTIVE ||
        status == EVENT_STATUS_PAUSED ||
        status == EVENT_STATUS_ENDED ||
        status == EVENT_STATUS_CANCELLED
    ) throw GovErrors.InvalidEventStatus;
}

fun assertEventTimeRange(startsAt: uint32, endsAt: uint32) {
    assert (endsAt == 0 || endsAt > startsAt) throw GovErrors.InvalidEventTime;
}
