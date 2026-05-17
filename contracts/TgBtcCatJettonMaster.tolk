import "@gen/TgBtcCatJettonWallet.code"
import "errors"
import "fees-management"
import "jetton-utils"
import "messages"
import "sharding"
import "storage"

contract TgBtcCatJettonMaster {
    author: "rub1kub | Dmitry"
    version: "1.0.0"
    description: "Standard TG BTC Cat Jetton Master. TEP-74 and TEP-89 compliant"
    storage: MinterStorage
    incomingMessages: AllowedMessageToMinter
}

type AllowedMessageToMinter =
    | MintNewJettons
    | BurnNotificationForMinter
    | RequestWalletAddress
    | ChangeMinterAdmin
    | SetMinterRuntimeAdmin
    | ClaimMinterAdmin
    | DropMinterAdmin
    | ChangeMinterMetadata
    | UpgradeMinterCode
    | RouteSetWalletFeeRuntime
    | RouteAddWalletDexAddress
    | RouteRemoveWalletDexAddress
    | RouteSetWalletSpecificFee
    | RouteClearWalletSpecificFee
    | TopUpTons

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();
    val msg = lazy InternalTransferStep.fromSlice(in.bouncedBody);

    var storage = lazy MinterStorage.load();
    storage.totalSupply -= msg.jettonAmount;
    storage.save();
}

fun assertSenderIsAdmin(senderAddress: address, adminAddress: address?) {
    assert (adminAddress != null && senderAddress == adminAddress!) throw Errors.NotOwner;
}

fun assertSenderIsRuntimeAdmin(senderAddress: address, storage: MinterStorage) {
    if (storage.runtimeAdminAddress != null) {
        assert (senderAddress == storage.runtimeAdminAddress!) throw Errors.NotOwner;
    } else {
        assertSenderIsAdmin(senderAddress, storage.adminAddress);
    }
}

fun sendWalletAdminMessage<T>(walletOwner: address, tonAmount: coins, body: T) {
    assert (walletOwner.getWorkchain() == MY_WORKCHAIN) throw Errors.WrongWorkchain;
    val jettonWalletCode = tgBtcCatJettonWalletCompiledCode();
    val walletMsg = createMessage({
        bounce: BounceMode.Only256BitsOfBody,
        dest: calcDeployedJettonWallet(
            walletOwner,
            contract.getAddress(),
            jettonWalletCode,
        ),
        value: tonAmount,
        body,
    });
    walletMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy AllowedMessageToMinter.fromSlice(in.body);

    match (msg) {
        BurnNotificationForMinter => {
            var storage = lazy MinterStorage.load();
            val jettonWalletCode = tgBtcCatJettonWalletCompiledCode();
            assert (
                in.senderAddress ==
                calcAddressOfJettonWallet(
                    msg.burnInitiator,
                    contract.getAddress(),
                    jettonWalletCode,
                )
            ) throw Errors.NotValidWallet;
            storage.totalSupply -= msg.jettonAmount;
            storage.save();

            if (msg.sendExcessesTo == null) {
                return;
            }

            val excessesMsg = createMessage({
                bounce: BounceMode.NoBounce,
                dest: msg.sendExcessesTo,
                value: 0,
                body: ReturnExcessesBack { queryId: msg.queryId },
            });
            excessesMsg.send(SEND_MODE_IGNORE_ERRORS | SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE);
        }

        RequestWalletAddress => {
            val ownerAddress: Cell<address>? = msg.includeOwnerAddress
                ? msg.ownerAddress.toCell()
                : null;

            var walletAddress: address? = null;
            if (msg.ownerAddress.getWorkchain() == MY_WORKCHAIN) {
                val jettonWalletCode = tgBtcCatJettonWalletCompiledCode();
                walletAddress = calcAddressOfJettonWallet(
                    msg.ownerAddress,
                    contract.getAddress(),
                    jettonWalletCode,
                );
            }

            val respondMsg = createMessage({
                bounce: BounceMode.NoBounce,
                dest: in.senderAddress,
                value: 0,
                body: ResponseWalletAddress {
                    queryId: msg.queryId,
                    jettonWalletAddress: walletAddress,
                    ownerAddress,
                },
            });
            respondMsg.send(
                SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
            );
        }

        MintNewJettons => {
            var storage = lazy MinterStorage.load();
            assertSenderIsAdmin(in.senderAddress, storage.adminAddress);
            assert (msg.mintRecipient.getWorkchain() == MY_WORKCHAIN) throw Errors.WrongWorkchain;

            val internalTransferMsg = lazy msg
                .internalTransferMsg
                .load({ throwIfOpcodeDoesNotMatch: Errors.InvalidOp });
            val forwardTonAmount = internalTransferMsg.forwardTonAmount;
            internalTransferMsg.forwardPayload.checkIsCorrectTlbEither();

            checkAmountIsEnoughToTransfer(msg.tonAmount, forwardTonAmount, in.originalForwardFee);

            storage.totalSupply += internalTransferMsg.jettonAmount;
            storage.save();

            reserveToncoinsOnBalance(
                ton("0.01"),
                RESERVE_MODE_EXACT_AMOUNT,
            );

            val jettonWalletCode = tgBtcCatJettonWalletCompiledCode();
            val deployMsg = createMessage({
                bounce: BounceMode.Only256BitsOfBody,
                dest: calcDeployedJettonWallet(
                    msg.mintRecipient,
                    contract.getAddress(),
                    jettonWalletCode,
                ),
                value: msg.tonAmount,
                body: msg.internalTransferMsg,
            });
            deployMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }

        ChangeMinterAdmin => {
            var storage = lazy MinterStorage.load();
            assertSenderIsAdmin(in.senderAddress, storage.adminAddress);
            storage.nextAdminAddress = msg.newAdminAddress;
            storage.save();
        }

        SetMinterRuntimeAdmin => {
            var storage = lazy MinterStorage.load();
            assertSenderIsAdmin(in.senderAddress, storage.adminAddress);
            storage.runtimeAdminAddress = msg.runtimeAdminAddress;
            storage.save();
        }

        ClaimMinterAdmin => {
            var storage = lazy MinterStorage.load();
            assertSenderIsAdmin(in.senderAddress, storage.nextAdminAddress);
            storage.adminAddress = storage.nextAdminAddress;
            storage.nextAdminAddress = null;
            storage.save();
        }

        DropMinterAdmin => {
            var storage = lazy MinterStorage.load();
            assertSenderIsAdmin(in.senderAddress, storage.adminAddress);
            storage.adminAddress = null;
            storage.nextAdminAddress = null;
            storage.save();
        }

        ChangeMinterMetadata => {
            var storage = lazy MinterStorage.load();
            assertSenderIsAdmin(in.senderAddress, storage.adminAddress);
            storage.metadata = msg.newMetadata;
            storage.save();
        }

        UpgradeMinterCode => {
            val storage = lazy MinterStorage.load();
            assertSenderIsAdmin(in.senderAddress, storage.adminAddress);
            contract.setCodePostponed(msg.newCode);
            contract.setData(msg.newData);
        }

        RouteSetWalletFeeRuntime => {
            val storage = lazy MinterStorage.load();
            assertSenderIsRuntimeAdmin(in.senderAddress, storage);
            sendWalletAdminMessage(
                msg.walletOwner,
                msg.walletTonAmount,
                SetWalletFeeRuntime {
                    queryId: msg.queryId,
                    feeTreasury: msg.feeTreasury,
                    globalBuyFeeBps: msg.globalBuyFeeBps,
                    globalSellFeeBps: msg.globalSellFeeBps,
                    isDexWallet: msg.isDexWallet,
                },
            );
        }

        RouteAddWalletDexAddress => {
            val storage = lazy MinterStorage.load();
            assertSenderIsRuntimeAdmin(in.senderAddress, storage);
            sendWalletAdminMessage(
                msg.walletOwner,
                msg.walletTonAmount,
                AddWalletDexAddress {
                    queryId: msg.queryId,
                    wallet: msg.wallet,
                },
            );
        }

        RouteRemoveWalletDexAddress => {
            val storage = lazy MinterStorage.load();
            assertSenderIsRuntimeAdmin(in.senderAddress, storage);
            sendWalletAdminMessage(
                msg.walletOwner,
                msg.walletTonAmount,
                RemoveWalletDexAddress {
                    queryId: msg.queryId,
                    wallet: msg.wallet,
                },
            );
        }

        RouteSetWalletSpecificFee => {
            val storage = lazy MinterStorage.load();
            assertSenderIsRuntimeAdmin(in.senderAddress, storage);
            sendWalletAdminMessage(
                msg.walletOwner,
                msg.walletTonAmount,
                SetWalletSpecificFee {
                    queryId: msg.queryId,
                    target: msg.target,
                    buyFeeBps: msg.buyFeeBps,
                    sellFeeBps: msg.sellFeeBps,
                },
            );
        }

        RouteClearWalletSpecificFee => {
            val storage = lazy MinterStorage.load();
            assertSenderIsRuntimeAdmin(in.senderAddress, storage);
            sendWalletAdminMessage(
                msg.walletOwner,
                msg.walletTonAmount,
                ClearWalletSpecificFee {
                    queryId: msg.queryId,
                    target: msg.target,
                },
            );
        }

        TopUpTons => {
            // just accept tons
        }

        else => throw 0xFFFF,
    }
}

get fun get_jetton_data(): JettonDataReply {
    val storage = lazy MinterStorage.load();
    val jettonWalletCode = tgBtcCatJettonWalletCompiledCode();

    return {
        totalSupply: storage.totalSupply,
        mintable: storage.adminAddress != null,
        adminAddress: storage.adminAddress,
        jettonContent: storage.metadata as Cell<OnchainMetadataReply>,
        jettonWalletCode,
    };
}

get fun get_wallet_address(ownerAddress: address): address {
    val jettonWalletCode = tgBtcCatJettonWalletCompiledCode();
    return calcAddressOfJettonWallet(ownerAddress, contract.getAddress(), jettonWalletCode);
}

get fun get_next_admin_address(): address? {
    val storage = lazy MinterStorage.load();
    return storage.nextAdminAddress;
}

get fun get_runtime_admin_address(): address? {
    val storage = lazy MinterStorage.load();
    return storage.runtimeAdminAddress;
}
