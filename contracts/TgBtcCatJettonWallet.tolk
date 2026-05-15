import "@stdlib/gas-payments"
import "errors"
import "fees-management"
import "jetton-utils"
import "messages"
import "sharding"
import "storage"

contract TgBtcCatJettonWallet {
    author: "rub1kub | Dmitry"
    version: "1.0.0"
    description: "Standard TG BTC Cat Jetton Wallet. TEP-74 and TEP-89 compliant"
    storage: WalletStorage
    incomingMessages: AllowedMessageToWallet
}

type AllowedMessageToWallet =
    | AskToTransfer
    | AskToBurn
    | InternalTransferStep
    | SetWalletFeeRuntime
    | AddWalletDexAddress
    | RemoveWalletDexAddress
    | SetWalletSpecificFee
    | ClearWalletSpecificFee
    | TopUpTons

type BounceOpToHandle = InternalTransferStep | BurnNotificationForMinter

const FEE_INTERNAL_TRANSFER_TON_AMOUNT = 50000000
const FEE_TRANSFER_ACTION_TON_BUFFER = 100000000

fun assertSenderIsMinter(sender: address, minter: address) {
    assert (sender == minter) throw Errors.NotMinter;
}

fun assertFeeBps(feeBps: int) {
    assert (feeBps <= WALLET_FEE_BPS_DENOMINATOR) throw Errors.InvalidFee;
}

fun calcFeeAmount(amount: coins, feeBps: uint16): coins {
    return amount * feeBps / WALLET_FEE_BPS_DENOMINATOR;
}

fun classifyTransferSide(runtime: WalletFeeRuntime, recipient: address): uint8 {
    val recipientIsDex = runtime.dexWallets.exists(recipient);
    if (runtime.isDexWallet && !recipientIsDex) {
        return TRANSFER_SIDE_BUY;
    }
    if (!runtime.isDexWallet && recipientIsDex) {
        return TRANSFER_SIDE_SELL;
    }

    return TRANSFER_SIDE_NONE;
}

fun quoteTransferFee(
    storage: WalletStorage,
    runtime: WalletFeeRuntime,
    recipient: address,
    amount: coins,
): TransferFeeQuoteReply {
    val recipientIsDex = runtime.dexWallets.exists(recipient);
    val side = classifyTransferSide(runtime, recipient);
    var feeSubject: address? = null;

    if (side != TRANSFER_SIDE_NONE) {
        feeSubject = side == TRANSFER_SIDE_BUY ? recipient : storage.ownerAddress;
    }

    if (runtime.feeTreasury == null) {
        return {
            side,
            feeBps: 0,
            feeAmount: 0,
            recipientAmount: amount,
            feeTreasury: runtime.feeTreasury,
            feeSubject,
            senderIsDexWallet: runtime.isDexWallet,
            recipientIsDexWallet: recipientIsDex,
        };
    }

    if (side == TRANSFER_SIDE_NONE) {
        return {
            side,
            feeBps: 0,
            feeAmount: 0,
            recipientAmount: amount,
            feeTreasury: runtime.feeTreasury,
            feeSubject,
            senderIsDexWallet: runtime.isDexWallet,
            recipientIsDexWallet: recipientIsDex,
        };
    }

    val rule = runtime.walletFeeRules.get(feeSubject!);
    var feeBps = side == TRANSFER_SIDE_BUY ? runtime.globalBuyFeeBps : runtime.globalSellFeeBps;
    if (rule.isFound) {
        val value = rule.loadValue();
        feeBps = side == TRANSFER_SIDE_BUY ? value.buyFeeBps : value.sellFeeBps;
    }

    val feeAmount = calcFeeAmount(amount, feeBps);
    return {
        side,
        feeBps,
        feeAmount,
        recipientAmount: amount - feeAmount,
        feeTreasury: runtime.feeTreasury,
        feeSubject,
        senderIsDexWallet: runtime.isDexWallet,
        recipientIsDexWallet: recipientIsDex,
    };
}

fun inheritedFeeRuntimeForRecipient(
    storage: WalletStorage,
    runtime: WalletFeeRuntime,
    recipient: address,
): WalletFeeRuntime {
    var inherited: WalletFeeRuntime = {
        feeTreasury: runtime.feeTreasury,
        globalBuyFeeBps: runtime.globalBuyFeeBps,
        globalSellFeeBps: runtime.globalSellFeeBps,
        isDexWallet: runtime.dexWallets.exists(recipient),
    };

    if (runtime.dexWallets.exists(recipient)) {
        inherited.dexWallets.set(recipient, true);
    }
    if (runtime.isDexWallet) {
        inherited.dexWallets.set(storage.ownerAddress, true);
    }

    return inherited;
}

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();

    val msg = lazy BounceOpToHandle.fromSlice(in.bouncedBody);
    val restoreAmount = match (msg) {
        InternalTransferStep => msg.jettonAmount,
        BurnNotificationForMinter => msg.jettonAmount,
    };

    var storage = lazy WalletStorage.load();
    storage.jettonBalance += restoreAmount;
    storage.save();
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy AllowedMessageToWallet.fromSlice(in.body);

    match (msg) {
        InternalTransferStep => {
            var storage = lazy WalletStorage.load();
            if (in.senderAddress != storage.minterAddress) {
                assert (
                    in.senderAddress ==
                    calcAddressOfJettonWallet(
                        msg.transferInitiator!,
                        storage.minterAddress,
                        contract.getCode(),
                    )
                ) throw Errors.NotValidWallet;
            }
            storage.jettonBalance += msg.jettonAmount;
            if (storage.feeRuntime == null && msg.feeRuntime != null) {
                storage.feeRuntime = msg.feeRuntime;
            }
            storage.save();

            if (msg.forwardTonAmount != 0) {
                val notifyOwnerMsg = createMessage({
                    bounce: BounceMode.NoBounce,
                    dest: storage.ownerAddress,
                    value: msg.forwardTonAmount,
                    body: TransferNotificationForRecipient {
                        queryId: msg.queryId,
                        jettonAmount: msg.jettonAmount,
                        transferInitiator: msg.transferInitiator,
                        forwardPayload: msg.forwardPayload,
                    },
                });
                notifyOwnerMsg.send(
                    SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
                );
            }

            if (msg.sendExcessesTo != null) {
                val toLeaveOnBalance = contract.getOriginalBalance() - in.valueCoins +
                contract.getStorageDuePayment();
                reserveToncoinsOnBalance(
                    max(toLeaveOnBalance, calculateJettonWalletMinStorageFee()),
                    RESERVE_MODE_AT_MOST,
                );

                val excessesMsg = createMessage({
                    bounce: BounceMode.NoBounce,
                    dest: msg.sendExcessesTo,
                    value: 0,
                    body: ReturnExcessesBack { queryId: msg.queryId },
                });
                // SAFETY: It is safe because of reserveToncoinsOnBalance() called earlier
                excessesMsg.send(SEND_MODE_CARRY_ALL_BALANCE | SEND_MODE_IGNORE_ERRORS);
            }
        }

        AskToTransfer => {
            msg.forwardPayload.checkIsCorrectTlbEither();
            assert (
                msg.transferRecipient.getWorkchain() == MY_WORKCHAIN
            ) throw Errors.WrongWorkchain;

            var storage = lazy WalletStorage.load();
            assert (in.senderAddress == storage.ownerAddress) throw Errors.NotOwner;
            assert (storage.jettonBalance >= msg.jettonAmount) throw Errors.BalanceError;
            val runtime = storage.loadFeeRuntime();
            val feeQuote = quoteTransferFee(
                storage,
                runtime,
                msg.transferRecipient,
                msg.jettonAmount,
            );
            val feeAmount = feeQuote.feeAmount;
            val feeForwardTonAmount = feeAmount == 0 ? 0 : FEE_INTERNAL_TRANSFER_TON_AMOUNT;
            checkAmountIsEnoughToTransfer(
                in.valueCoins,
                msg.forwardTonAmount + feeForwardTonAmount,
                in.originalForwardFee,
            );
            storage.jettonBalance -= msg.jettonAmount;
            storage.save();

            if (feeAmount != 0) {
                val feeTreasury = runtime.feeTreasury!;
                val feeMsg = createMessage({
                    bounce: BounceMode.Only256BitsOfBody,
                    dest: calcDeployedJettonWallet(
                        feeTreasury,
                        storage.minterAddress,
                        contract.getCode(),
                    ),
                    value: FEE_INTERNAL_TRANSFER_TON_AMOUNT,
                    body: InternalTransferStep {
                        queryId: msg.queryId,
                        jettonAmount: feeAmount,
                        transferInitiator: storage.ownerAddress,
                        sendExcessesTo: null,
                        forwardTonAmount: 0,
                        feeRuntime: null,
                        forwardPayload: beginCell().storeMaybeRef(null).endCell().beginParse(),
                    },
                });
                feeMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
            }

            val recipientAmount = msg.jettonAmount - feeAmount;
            var recipientMsgValue: coins = 0;
            if (feeAmount != 0) {
                val senderWalletBuffer = max(
                    calculateJettonWalletMinStorageFee(),
                    FEE_TRANSFER_ACTION_TON_BUFFER,
                );
                assert (
                    in.valueCoins > feeForwardTonAmount + senderWalletBuffer
                ) throw Errors.NotEnoughGas;
                recipientMsgValue = in.valueCoins - feeForwardTonAmount - senderWalletBuffer;
                assert (
                    recipientMsgValue >
                    calcMinimalTransferAmount(msg.forwardTonAmount, in.originalForwardFee)
                ) throw Errors.NotEnoughGas;
            }
            val deployMsg = createMessage({
                bounce: BounceMode.Only256BitsOfBody,
                dest: calcDeployedJettonWallet(
                    msg.transferRecipient,
                    storage.minterAddress,
                    contract.getCode(),
                ),
                value: recipientMsgValue,
                body: InternalTransferStep {
                    queryId: msg.queryId,
                    jettonAmount: recipientAmount,
                    transferInitiator: storage.ownerAddress,
                    sendExcessesTo: msg.sendExcessesTo,
                    forwardTonAmount: msg.forwardTonAmount,
                    feeRuntime: inheritedFeeRuntimeForRecipient(
                        storage,
                        runtime,
                        msg.transferRecipient,
                    ).toCell(),
                    forwardPayload: msg.forwardPayload,
                },
            });
            val recipientSendMode = feeAmount == 0
                ? SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL
                : SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL;
            deployMsg.send(recipientSendMode);
        }

        AskToBurn => {
            checkAmountIsEnoughToBurn(in.valueCoins);

            var storage = lazy WalletStorage.load();
            assert (in.senderAddress == storage.ownerAddress) throw Errors.NotOwner;
            assert (storage.jettonBalance >= msg.jettonAmount) throw Errors.BalanceError;
            storage.jettonBalance -= msg.jettonAmount;
            storage.save();

            val notifyMinterMsg = createMessage({
                bounce: BounceMode.Only256BitsOfBody,
                dest: storage.minterAddress,
                value: 0,
                body: BurnNotificationForMinter {
                    queryId: msg.queryId,
                    jettonAmount: msg.jettonAmount,
                    burnInitiator: storage.ownerAddress,
                    sendExcessesTo: msg.sendExcessesTo,
                },
            });
            notifyMinterMsg.send(
                SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
            );
        }

        SetWalletFeeRuntime => {
            var storage = lazy WalletStorage.load();
            assertSenderIsMinter(in.senderAddress, storage.minterAddress);
            assertFeeBps(msg.globalBuyFeeBps);
            assertFeeBps(msg.globalSellFeeBps);
            var runtime = storage.loadFeeRuntime();
            runtime.feeTreasury = msg.feeTreasury;
            runtime.globalBuyFeeBps = msg.globalBuyFeeBps;
            runtime.globalSellFeeBps = msg.globalSellFeeBps;
            runtime.isDexWallet = msg.isDexWallet;
            storage.saveFeeRuntime(runtime);
        }

        AddWalletDexAddress => {
            var storage = lazy WalletStorage.load();
            assertSenderIsMinter(in.senderAddress, storage.minterAddress);
            var runtime = storage.loadFeeRuntime();
            runtime.dexWallets.set(msg.wallet, true);
            storage.saveFeeRuntime(runtime);
        }

        RemoveWalletDexAddress => {
            var storage = lazy WalletStorage.load();
            assertSenderIsMinter(in.senderAddress, storage.minterAddress);
            var runtime = storage.loadFeeRuntime();
            runtime.dexWallets.delete(msg.wallet);
            storage.saveFeeRuntime(runtime);
        }

        SetWalletSpecificFee => {
            var storage = lazy WalletStorage.load();
            assertSenderIsMinter(in.senderAddress, storage.minterAddress);
            assertFeeBps(msg.buyFeeBps);
            assertFeeBps(msg.sellFeeBps);
            var runtime = storage.loadFeeRuntime();
            runtime
                .walletFeeRules
                .set(
                    msg.target,
                    { buyFeeBps: msg.buyFeeBps, sellFeeBps: msg.sellFeeBps },
                );
            storage.saveFeeRuntime(runtime);
        }

        ClearWalletSpecificFee => {
            var storage = lazy WalletStorage.load();
            assertSenderIsMinter(in.senderAddress, storage.minterAddress);
            var runtime = storage.loadFeeRuntime();
            runtime.walletFeeRules.delete(msg.target);
            storage.saveFeeRuntime(runtime);
        }

        TopUpTons => {
            // just accept tons
        }

        else => throw 0xFFFF,
    }
}

get fun get_wallet_data(): JettonWalletDataReply {
    val storage = lazy WalletStorage.load();

    return {
        jettonBalance: storage.jettonBalance,
        ownerAddress: storage.ownerAddress,
        minterAddress: storage.minterAddress,
        jettonWalletCode: contract.getCode(),
    };
}

get fun get_fee_runtime(): WalletFeeRuntimeReply {
    val storage = lazy WalletStorage.load();
    val runtime = storage.loadFeeRuntime();
    return {
        feeTreasury: runtime.feeTreasury,
        globalBuyFeeBps: runtime.globalBuyFeeBps,
        globalSellFeeBps: runtime.globalSellFeeBps,
        isDexWallet: runtime.isDexWallet,
    };
}

get fun is_dex_wallet(wallet: address): bool {
    val storage = lazy WalletStorage.load();
    val runtime = storage.loadFeeRuntime();
    return runtime.dexWallets.exists(wallet);
}

get fun get_wallet_specific_fee(target: address): WalletTransferFeeRuleReply {
    val storage = lazy WalletStorage.load();
    val runtime = storage.loadFeeRuntime();
    val rule = runtime.walletFeeRules.get(target);
    if (!rule.isFound) {
        return {
            isSet: false,
            buyFeeBps: 0,
            sellFeeBps: 0,
        };
    }

    val value = rule.loadValue();
    return {
        isSet: true,
        buyFeeBps: value.buyFeeBps,
        sellFeeBps: value.sellFeeBps,
    };
}

get fun get_transfer_fee_quote(recipient: address, amount: coins): TransferFeeQuoteReply {
    val storage = lazy WalletStorage.load();
    val runtime = storage.loadFeeRuntime();
    return quoteTransferFee(storage, runtime, recipient, amount);
}
