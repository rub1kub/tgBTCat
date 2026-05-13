enum GovErrors {
    NotGovernor = 401
    InvalidFee = 402
    ProtectedWallet = 403
    InvalidMessage = 0xFFFF
}

const FEE_BPS_DENOMINATOR = 10000

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

struct (0xd372158c) GovernanceTopUp {}

fun assertGovernor(sender: address, governor: address) {
    assert (sender == governor) throw GovErrors.NotGovernor;
}

fun assertFeeBps(feeBps: int) {
    assert (feeBps <= FEE_BPS_DENOMINATOR) throw GovErrors.InvalidFee;
}
