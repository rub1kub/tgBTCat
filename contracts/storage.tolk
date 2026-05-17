import "@stdlib/strings"

const WALLET_FEE_BPS_DENOMINATOR = 10000
const TRANSFER_SIDE_NONE = 0
const TRANSFER_SIDE_BUY = 1
const TRANSFER_SIDE_SELL = 2

struct WalletTransferFeeRule {
    buyFeeBps: uint16
    sellFeeBps: uint16
}

struct WalletFeeRuntime {
    feeTreasury: address?
    globalBuyFeeBps: uint16
    globalSellFeeBps: uint16
    isDexWallet: bool
    dexWallets: map<address, bool> = []
    walletFeeRules: map<address, WalletTransferFeeRule> = []
}

struct WalletStorage {
    jettonBalance: coins
    ownerAddress: address
    minterAddress: address
    feeRuntime: Cell<WalletFeeRuntime>? = null
}

struct MinterStorage {
    totalSupply: coins
    adminAddress: address?
    nextAdminAddress: address?
    metadata: cell
    runtimeAdminAddress: address? = null
}

fun MinterStorage.load(): MinterStorage {
    return MinterStorage.fromCell(contract.getData());
}

fun MinterStorage.save(self) {
    contract.setData(self.toCell());
}

fun WalletStorage.load(): WalletStorage {
    return WalletStorage.fromCell(contract.getData());
}

fun WalletStorage.save(self) {
    contract.setData(self.toCell());
}

fun defaultWalletFeeRuntime(): WalletFeeRuntime {
    return {
        feeTreasury: null,
        globalBuyFeeBps: 0,
        globalSellFeeBps: 0,
        isDexWallet: false,
    };
}

fun WalletStorage.loadFeeRuntime(self): WalletFeeRuntime {
    if (self.feeRuntime == null) {
        return defaultWalletFeeRuntime();
    }

    return WalletFeeRuntime.fromCell(self.feeRuntime!);
}

fun WalletStorage.saveFeeRuntime(mutate self, runtime: WalletFeeRuntime) {
    self.feeRuntime = runtime.toCell();
    self.save();
}

struct JettonWalletDataReply {
    jettonBalance: coins
    ownerAddress: address
    minterAddress: address
    jettonWalletCode: cell
}

struct WalletFeeRuntimeReply {
    feeTreasury: address?
    globalBuyFeeBps: uint16
    globalSellFeeBps: uint16
    isDexWallet: bool
}

struct WalletTransferFeeRuleReply {
    isSet: bool
    buyFeeBps: uint16
    sellFeeBps: uint16
}

struct TransferFeeQuoteReply {
    side: uint8
    feeBps: uint16
    feeAmount: coins
    recipientAmount: coins
    feeTreasury: address?
    feeSubject: address?
    senderIsDexWallet: bool
    recipientIsDexWallet: bool
}

struct JettonDataReply {
    totalSupply: int
    mintable: bool
    adminAddress: address?
    jettonContent: Cell<OnchainMetadataReply>
    jettonWalletCode: cell
}

struct (0x00) OnchainMetadataReply {
    contentDict: map<uint256, string_prefixed0x>
}
