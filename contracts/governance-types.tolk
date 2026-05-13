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
    InvalidMessage = 0xFFFF
}

const FEE_BPS_DENOMINATOR = 10000
const VOTE_SIDE_FOR = 1
const VOTE_SIDE_AGAINST = 2
const VOTE_SIDE_ABSTAIN = 3

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

struct FeeConfigReply {
    buyFeeBps: uint16
    sellFeeBps: uint16
    feeTreasury: address
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
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
    votingEndsAt: uint32
    forVotes: coins
    againstVotes: coins
    abstainVotes: coins
    executed: bool
}

struct GovernorStorage {
    admin: address
    voteJettonWallet: address
    minVoteAmount: coins
    nextProposalId: uint64
    proposals: map<uint64, Proposal> = []
}

fun GovernorStorage.load(): GovernorStorage {
    return GovernorStorage.fromCell(contract.getData());
}

fun GovernorStorage.save(self) {
    contract.setData(self.toCell());
}

struct ProposalReply {
    isSet: bool
    actionType: uint8
    target: address?
    buyFeeBps: uint16
    sellFeeBps: uint16
    reasonHash: uint256
    votingEndsAt: uint32
    forVotes: coins
    againstVotes: coins
    abstainVotes: coins
    executed: bool
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

struct (0x10040001) CreateGovernanceProposal {
    queryId: uint64
    actionType: uint8
    target: address?
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
