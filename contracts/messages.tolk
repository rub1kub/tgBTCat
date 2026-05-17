import "storage"

type ForwardPayloadRemainder = RemainingBitsAndRefs

struct (0b0) PayloadInline {
    value: RemainingBitsAndRefs
}

struct (0b1) PayloadInRef {
    value: Cell<RemainingBitsAndRefs>
}

struct (0x0f8a7ea5) AskToTransfer {
    queryId: uint64
    jettonAmount: coins
    transferRecipient: address
    sendExcessesTo: address?
    customPayload: cell?
    forwardTonAmount: coins
    @abi.clientType(PayloadInline | PayloadInRef)
    forwardPayload: ForwardPayloadRemainder
}

struct (0x7362d09c) TransferNotificationForRecipient {
    queryId: uint64
    jettonAmount: coins
    transferInitiator: address?
    @abi.clientType(PayloadInline | PayloadInRef)
    forwardPayload: ForwardPayloadRemainder
}

struct (0x178d4519) InternalTransferStep {
    queryId: uint64
    jettonAmount: coins
    transferInitiator: address?
    sendExcessesTo: address?
    forwardTonAmount: coins
    feeRuntime: Cell<WalletFeeRuntime>? = null
    @abi.clientType(PayloadInline | PayloadInRef)
    forwardPayload: ForwardPayloadRemainder
}

struct (0xd53276db) ReturnExcessesBack {
    queryId: uint64
}

struct (0x595f07bc) AskToBurn {
    queryId: uint64
    jettonAmount: coins
    sendExcessesTo: address?
    customPayload: cell?
}

struct (0x7bdd97de) BurnNotificationForMinter {
    queryId: uint64
    jettonAmount: coins
    burnInitiator: address
    sendExcessesTo: address?
}

struct (0x2c76b973) RequestWalletAddress {
    queryId: uint64
    ownerAddress: address
    includeOwnerAddress: bool
}

struct (0xd1735400) ResponseWalletAddress {
    queryId: uint64
    jettonWalletAddress: address?
    ownerAddress: Cell<address>?
}

struct (0x642b7d07) MintNewJettons {
    queryId: uint64
    mintRecipient: address
    tonAmount: coins
    internalTransferMsg: Cell<InternalTransferStep>
}

struct (0x6501f354) ChangeMinterAdmin {
    queryId: uint64
    newAdminAddress: address
}

struct (0x6501f355) SetMinterRuntimeAdmin {
    queryId: uint64
    runtimeAdminAddress: address?
}

struct (0xfb88e119) ClaimMinterAdmin {
    queryId: uint64
}

struct (0x7431f221) DropMinterAdmin {
    queryId: uint64
}

struct (0x2508d66a) UpgradeMinterCode {
    queryId: uint64
    newData: cell
    newCode: cell
}

struct (0xcb862902) ChangeMinterMetadata {
    queryId: uint64
    newMetadata: cell
}

struct (0x20010001) SetWalletFeeRuntime {
    queryId: uint64
    feeTreasury: address?
    globalBuyFeeBps: uint16
    globalSellFeeBps: uint16
    isDexWallet: bool
}

struct (0x20010002) AddWalletDexAddress {
    queryId: uint64
    wallet: address
}

struct (0x20010003) RemoveWalletDexAddress {
    queryId: uint64
    wallet: address
}

struct (0x20010004) SetWalletSpecificFee {
    queryId: uint64
    target: address
    buyFeeBps: uint16
    sellFeeBps: uint16
}

struct (0x20010005) ClearWalletSpecificFee {
    queryId: uint64
    target: address
}

struct (0x20020001) RouteSetWalletFeeRuntime {
    queryId: uint64
    walletOwner: address
    walletTonAmount: coins
    feeTreasury: address?
    globalBuyFeeBps: uint16
    globalSellFeeBps: uint16
    isDexWallet: bool
}

struct (0x20020002) RouteAddWalletDexAddress {
    queryId: uint64
    walletOwner: address
    walletTonAmount: coins
    wallet: address
}

struct (0x20020003) RouteRemoveWalletDexAddress {
    queryId: uint64
    walletOwner: address
    walletTonAmount: coins
    wallet: address
}

struct (0x20020004) RouteSetWalletSpecificFee {
    queryId: uint64
    walletOwner: address
    walletTonAmount: coins
    target: address
    buyFeeBps: uint16
    sellFeeBps: uint16
}

struct (0x20020005) RouteClearWalletSpecificFee {
    queryId: uint64
    walletOwner: address
    walletTonAmount: coins
    target: address
}

struct (0x10050002) SendTreasuryJettons {
    queryId: uint64
    jettonWallet: address
    jettonAmount: coins
    transferRecipient: address
    sendExcessesTo: address?
    walletTonAmount: coins
    forwardTonAmount: coins
    @abi.clientType(PayloadInline | PayloadInRef)
    forwardPayload: ForwardPayloadRemainder
}

struct (0x1004000c) OpsSweepVoteJettons {
    queryId: uint64
    jettonAmount: coins
    transferRecipient: address
    sendExcessesTo: address?
    walletTonAmount: coins
    forwardTonAmount: coins
}

struct OpsSendTreasuryJettonsExtra {
    transferRecipient: address
    sendExcessesTo: address?
    walletTonAmount: coins
    forwardTonAmount: coins
}

struct (0x10040010) OpsSendTreasuryJettons {
    queryId: uint64
    treasury: address
    treasuryValue: coins
    jettonWallet: address
    jettonAmount: coins
    extra: Cell<OpsSendTreasuryJettonsExtra>
}

struct (0xd372158c) TopUpTons {}

fun ForwardPayloadRemainder.checkIsCorrectTlbEither(self) {
    var mutableCopy = self;
    if (mutableCopy.loadMaybeRef() != null) {
        mutableCopy.assertEnd();
    }
}
