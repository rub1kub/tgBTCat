import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"
import "@acton/types/message"

import "@contracts/errors"
import "@contracts/messages"
import "@contracts/storage"
import "@wrappers/TgBtcCatJettonMaster.gen"
import "@wrappers/TgBtcCatJettonWallet.gen"
import "@wrappers/utils"

import "jetton-test-utils"

const FEE_TEST_TRANSFER_VALUE = 1000000000 // 1 TON
const FEE_ROUTE_MSG_VALUE = 500000000 // 0.5 TON
const FEE_WALLET_CONFIG_VALUE = 120000000 // 0.12 TON

get fun `test fees: global sell fee forwards jettons to fee treasury`() {
    val (minter, admin, _) = setupTest();
    val seller = testing.treasury("fee-sell-seller");
    val dex = testing.treasury("fee-sell-dex");
    val feeTreasury = testing.treasury("fee-sell-treasury");

    val sellerWallet = mintTo(minter, admin, seller.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        seller.address,
        feeTreasury.address,
        0,
        1000,
        false,
    );
    routeAddDexWallet(minter, admin, seller.address, dex.address);

    val transfer = sellerWallet.sendTransfer(
        seller.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        dex.address,
        seller.address,
        null,
        0,
        null,
    );
    expect(transfer).toHaveSuccessfulTx<AskToTransfer>({
        from: seller.address,
        to: sellerWallet.address,
    });

    expect(sellerWallet.getJettonBalance()).toEqual(0);
    expect(userWallet(minter, dex.address).getJettonBalance()).toEqual(900);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(100);
}

get fun `test fees: global buy fee applies when sender wallet is marked as dex`() {
    val (minter, admin, _) = setupTest();
    val dex = testing.treasury("fee-buy-dex");
    val buyer = testing.treasury("fee-buy-buyer");
    val feeTreasury = testing.treasury("fee-buy-treasury");

    val dexWallet = mintTo(minter, admin, dex.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        dex.address,
        feeTreasury.address,
        1000,
        0,
        true,
    );

    val transfer = dexWallet.sendTransfer(
        dex.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        buyer.address,
        dex.address,
        null,
        0,
        null,
    );
    expect(transfer).toHaveSuccessfulTx<AskToTransfer>({
        from: dex.address,
        to: dexWallet.address,
    });

    expect(dexWallet.getJettonBalance()).toEqual(0);
    expect(userWallet(minter, buyer.address).getJettonBalance()).toEqual(900);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(100);
}

get fun `test fees: stonfi router flow quotes and taxes sell and buy transfers`() {
    val (minter, admin, _) = setupTest();
    val seller = testing.treasury("fee-stonfi-seller");
    val router = testing.treasury("fee-stonfi-router");
    val buyer = testing.treasury("fee-stonfi-buyer");
    val feeTreasury = testing.treasury("fee-stonfi-treasury");

    val sellerWallet = mintTo(minter, admin, seller.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        seller.address,
        feeTreasury.address,
        0,
        1000,
        false,
    );
    routeAddDexWallet(minter, admin, seller.address, router.address);

    val sellQuote = sellerWallet.getTransferFeeQuote(router.address, 1000);
    expect(sellQuote.side).toEqual(TRANSFER_SIDE_SELL);
    expect(sellQuote.feeBps).toEqual(1000);
    expect(sellQuote.feeAmount).toEqual(100);
    expect(sellQuote.recipientAmount).toEqual(900);
    expect(sellQuote.feeTreasury).toEqual(feeTreasury.address);
    expect(sellQuote.feeSubject).toEqual(seller.address);
    expect(sellQuote.senderIsDexWallet).toEqual(false);
    expect(sellQuote.recipientIsDexWallet).toEqual(true);

    val sell = sellerWallet.sendTransfer(
        seller.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        router.address,
        seller.address,
        null,
        0,
        null,
    );
    expect(sell).toHaveSuccessfulTx<AskToTransfer>({
        from: seller.address,
        to: sellerWallet.address,
    });
    expect(userWallet(minter, router.address).getJettonBalance()).toEqual(900);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(100);

    val routerWallet = userWallet(minter, router.address);
    routeWalletRuntime(
        minter,
        admin,
        router.address,
        feeTreasury.address,
        1000,
        0,
        true,
    );

    val buyQuote = routerWallet.getTransferFeeQuote(buyer.address, 900);
    expect(buyQuote.side).toEqual(TRANSFER_SIDE_BUY);
    expect(buyQuote.feeBps).toEqual(1000);
    expect(buyQuote.feeAmount).toEqual(90);
    expect(buyQuote.recipientAmount).toEqual(810);
    expect(buyQuote.feeTreasury).toEqual(feeTreasury.address);
    expect(buyQuote.feeSubject).toEqual(buyer.address);
    expect(buyQuote.senderIsDexWallet).toEqual(true);
    expect(buyQuote.recipientIsDexWallet).toEqual(false);

    val buy = routerWallet.sendTransfer(
        router.address,
        FEE_TEST_TRANSFER_VALUE,
        900,
        buyer.address,
        router.address,
        null,
        0,
        null,
    );
    expect(buy).toHaveSuccessfulTx<AskToTransfer>({
        from: router.address,
        to: routerWallet.address,
    });
    expect(routerWallet.getJettonBalance()).toEqual(0);
    expect(userWallet(minter, buyer.address).getJettonBalance()).toEqual(810);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(190);
}

get fun `test fees: dedust vault flow inherits runtime for sell and buy transfers`() {
    val (minter, admin, _) = setupTest();
    val seller = testing.treasury("fee-dedust-seller");
    val vault = testing.treasury("fee-dedust-vault");
    val buyer = testing.treasury("fee-dedust-buyer");
    val feeTreasury = testing.treasury("fee-dedust-treasury");

    val sellerWallet = mintTo(minter, admin, seller.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        seller.address,
        feeTreasury.address,
        500,
        1000,
        false,
    );
    routeAddDexWallet(minter, admin, seller.address, vault.address);

    val sell = sellerWallet.sendTransfer(
        seller.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        vault.address,
        seller.address,
        null,
        DEFAULT_FORWARD_TON_AMOUNT,
        beginCell().storeUint(0xe3a0d482, 32).endCell(),
    );
    val vaultWallet = userWallet(minter, vault.address);
    expect(sell).toHaveSuccessfulTx<AskToTransfer>({
        from: seller.address,
        to: sellerWallet.address,
    });
    expect(sell).toHaveSuccessfulTx<TransferNotificationForRecipient>({
        from: vaultWallet.address,
        to: vault.address,
    });
    expect(vaultWallet.getJettonBalance()).toEqual(900);
    expect(vaultWallet.getFeeRuntime().isDexWallet).toEqual(true);
    expect(vaultWallet.isDexWallet(vault.address)).toEqual(true);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(100);

    val buyQuote = vaultWallet.getTransferFeeQuote(buyer.address, 900);
    expect(buyQuote.side).toEqual(TRANSFER_SIDE_BUY);
    expect(buyQuote.feeBps).toEqual(500);
    expect(buyQuote.feeAmount).toEqual(45);
    expect(buyQuote.recipientAmount).toEqual(855);

    val buy = vaultWallet.sendTransfer(
        vault.address,
        ton("10"),
        900,
        buyer.address,
        vault.address,
        null,
        DEFAULT_FORWARD_TON_AMOUNT,
        null,
    );
    val buyerWallet = userWallet(minter, buyer.address);
    expect(buy).toHaveSuccessfulTx<AskToTransfer>({
        from: vault.address,
        to: vaultWallet.address,
    });
    expect(buy).toHaveSuccessfulTx<TransferNotificationForRecipient>({
        from: buyerWallet.address,
        to: buyer.address,
    });
    expect(buyerWallet.getJettonBalance()).toEqual(855);
    expect(buyerWallet.getFeeRuntime().isDexWallet).toEqual(false);
    expect(buyerWallet.isDexWallet(vault.address)).toEqual(true);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(145);
}

get fun `test fees: wallet-specific buy override beats global fee and can be cleared`() {
    val (minter, admin, _) = setupTest();
    val dex = testing.treasury("fee-override-dex");
    val buyer = testing.treasury("fee-override-buyer");
    val feeTreasury = testing.treasury("fee-override-treasury");

    val dexWallet = mintTo(minter, admin, dex.address, 2000);
    routeWalletRuntime(
        minter,
        admin,
        dex.address,
        feeTreasury.address,
        1000,
        0,
        true,
    );
    routeSetWalletSpecificFee(
        minter,
        admin,
        dex.address,
        buyer.address,
        2500,
        0,
    );

    val first = dexWallet.sendTransfer(
        dex.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        buyer.address,
        dex.address,
        null,
        0,
        null,
    );
    expect(first).toHaveSuccessfulTx<AskToTransfer>({
        from: dex.address,
        to: dexWallet.address,
    });
    expect(userWallet(minter, buyer.address).getJettonBalance()).toEqual(750);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(250);

    routeClearWalletSpecificFee(minter, admin, dex.address, buyer.address);
    val second = dexWallet.sendTransfer(
        dex.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        buyer.address,
        dex.address,
        null,
        0,
        null,
    );
    expect(second).toHaveSuccessfulTx<AskToTransfer>({
        from: dex.address,
        to: dexWallet.address,
    });
    expect(userWallet(minter, buyer.address).getJettonBalance()).toEqual(1650);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(350);
}

get fun `test fees: zero and hundred percent sell fee edges`() {
    val (minter, admin, _) = setupTest();
    val zeroSeller = testing.treasury("fee-zero-seller");
    val fullSeller = testing.treasury("fee-full-seller");
    val zeroDex = testing.treasury("fee-zero-dex");
    val fullDex = testing.treasury("fee-full-dex");
    val feeTreasury = testing.treasury("fee-edge-treasury");

    val zeroWallet = mintTo(minter, admin, zeroSeller.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        zeroSeller.address,
        feeTreasury.address,
        0,
        0,
        false,
    );
    routeAddDexWallet(minter, admin, zeroSeller.address, zeroDex.address);
    val zero = zeroWallet.sendTransfer(
        zeroSeller.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        zeroDex.address,
        zeroSeller.address,
        null,
        0,
        null,
    );
    expect(zero).toHaveSuccessfulTx<AskToTransfer>({
        from: zeroSeller.address,
        to: zeroWallet.address,
    });
    expect(userWallet(minter, zeroDex.address).getJettonBalance()).toEqual(1000);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(0);

    val fullWallet = mintTo(minter, admin, fullSeller.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        fullSeller.address,
        feeTreasury.address,
        0,
        10000,
        false,
    );
    routeAddDexWallet(minter, admin, fullSeller.address, fullDex.address);
    val full = fullWallet.sendTransfer(
        fullSeller.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        fullDex.address,
        fullSeller.address,
        null,
        0,
        null,
    );
    expect(full).toHaveSuccessfulTx<AskToTransfer>({
        from: fullSeller.address,
        to: fullWallet.address,
    });
    expect(userWallet(minter, fullDex.address).getJettonBalance()).toEqual(0);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(1000);
}

get fun `test fees: only minter can update wallet runtime and only admin can route updates`() {
    val (minter, admin, outsider) = setupTest();
    val owner = testing.treasury("fee-security-owner");
    val feeTreasury = testing.treasury("fee-security-treasury");
    val wallet = mintTo(minter, admin, owner.address, 1000);

    val direct = wallet.sendSetWalletFeeRuntime(
        owner.address,
        10000000,
        feeTreasury.address,
        0,
        100,
        false,
        { value: ton("0.05") },
    );
    expect(direct).toHaveFailedTx<SetWalletFeeRuntime>({
        from: owner.address,
        to: wallet.address,
        exitCode: Errors.NotMinter,
    });

    val nonAdminRoute = minter.sendRouteSetWalletFeeRuntime(
        outsider.address,
        2,
        owner.address,
        FEE_WALLET_CONFIG_VALUE,
        feeTreasury.address,
        0,
        100,
        false,
        { value: FEE_ROUTE_MSG_VALUE },
    );
    expect(nonAdminRoute).toHaveFailedTx<RouteSetWalletFeeRuntime>({
        from: outsider.address,
        to: minter.address,
        exitCode: Errors.NotOwner,
    });

    val invalidFee = minter.sendRouteSetWalletFeeRuntime(
        admin.address,
        3,
        owner.address,
        FEE_WALLET_CONFIG_VALUE,
        feeTreasury.address,
        0,
        10001,
        false,
        { value: FEE_ROUTE_MSG_VALUE },
    );
    expect(invalidFee).toHaveFailedTx<SetWalletFeeRuntime>({
        from: minter.address,
        to: wallet.address,
        exitCode: Errors.InvalidFee,
    });
}

get fun `test fees: active fee requires enough TON for extra internal transfer`() {
    val (minter, admin, _) = setupTest();
    val seller = testing.treasury("fee-gas-seller");
    val dex = testing.treasury("fee-gas-dex");
    val feeTreasury = testing.treasury("fee-gas-treasury");

    val sellerWallet = mintTo(minter, admin, seller.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        seller.address,
        feeTreasury.address,
        0,
        1000,
        false,
    );
    routeAddDexWallet(minter, admin, seller.address, dex.address);

    val lowValue = sellerWallet.sendTransfer(
        seller.address,
        10000000,
        1000,
        dex.address,
        seller.address,
        null,
        0,
        null,
    );
    expect(lowValue).toHaveFailedTx<AskToTransfer>({
        from: seller.address,
        to: sellerWallet.address,
        exitCode: Errors.NotEnoughGas,
    });
}

get fun `test fees: bounced fee and recipient transfers restore sender balance`() {
    val (minter, admin, _) = setupTest();
    val seller = testing.treasury("fee-bounce-seller");
    val dex = testing.treasury("fee-bounce-dex");
    val feeTreasury = testing.treasury("fee-bounce-treasury");

    val sellerWallet = mintTo(minter, admin, seller.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        seller.address,
        feeTreasury.address,
        0,
        1000,
        false,
    );
    routeAddDexWallet(minter, admin, seller.address, dex.address);

    val transferMsg = createMessage({
        bounce: true,
        value: FEE_TEST_TRANSFER_VALUE,
        dest: sellerWallet.address,
        body: AskToTransfer {
            queryId: 0,
            jettonAmount: 1000,
            transferRecipient: dex.address,
            sendExcessesTo: seller.address,
            customPayload: null,
            forwardTonAmount: 0,
            forwardPayload: makeTinyForwardPayload(),
        },
    });

    val res = testing.processSingleTraceStep(seller.address, transferMsg);
    expect(sellerWallet.getJettonBalance()).toEqual(0);

    val feeOut = res.outMessages.at<InternalTransferStep>(0);
    val feeOutBody = feeOut.loadBody();
    expect(feeOutBody.jettonAmount).toEqual(100);
    val feeBouncedBody = beginCell()
        .storeUint(0xffffffff, 32)
        .storeSlice(feeOutBody.toCell().beginParse())
        .endCell();
    val feeWallet = userWallet(minter, feeTreasury.address);
    val feeBouncedMsg = createMessage({
        bounce: false,
        value: ton("0.95"),
        dest: sellerWallet.address,
        body: feeBouncedBody,
    }).bounced();
    testing.processSingleTraceStep(feeWallet.address, feeBouncedMsg);
    expect(sellerWallet.getJettonBalance()).toEqual(100);

    val recipientOut = res.outMessages.at<InternalTransferStep>(1);
    val recipientOutBody = recipientOut.loadBody();
    expect(recipientOutBody.jettonAmount).toEqual(900);
    val recipientBouncedBody = beginCell()
        .storeUint(0xffffffff, 32)
        .storeSlice(recipientOutBody.toCell().beginParse())
        .endCell();
    val dexWallet = userWallet(minter, dex.address);
    val recipientBouncedMsg = createMessage({
        bounce: false,
        value: ton("0.95"),
        dest: sellerWallet.address,
        body: recipientBouncedBody,
    }).bounced();
    testing.processSingleTraceStep(dexWallet.address, recipientBouncedMsg);
    expect(sellerWallet.getJettonBalance()).toEqual(1000);
}

get fun `test fees: no fee without treasury dex side or for dex to dex transfer`() {
    val (minter, admin, _) = setupTest();
    val sellerNoTreasury = testing.treasury("fee-no-treasury-seller");
    val sellerNoDex = testing.treasury("fee-no-dex-seller");
    val dexSender = testing.treasury("fee-dex-to-dex-sender");
    val dexRecipient = testing.treasury("fee-dex-to-dex-recipient");
    val normalRecipient = testing.treasury("fee-normal-recipient");
    val feeTreasury = testing.treasury("fee-none-treasury");

    val noTreasuryWallet = mintTo(minter, admin, sellerNoTreasury.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        sellerNoTreasury.address,
        null,
        0,
        1000,
        false,
    );
    routeAddDexWallet(minter, admin, sellerNoTreasury.address, dexRecipient.address);
    val noTreasury = noTreasuryWallet.sendTransfer(
        sellerNoTreasury.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        dexRecipient.address,
        sellerNoTreasury.address,
        null,
        0,
        null,
    );
    expect(noTreasury).toHaveSuccessfulTx<AskToTransfer>({
        from: sellerNoTreasury.address,
        to: noTreasuryWallet.address,
    });
    expect(userWallet(minter, dexRecipient.address).getJettonBalance()).toEqual(1000);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(0);

    val noDexWallet = mintTo(minter, admin, sellerNoDex.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        sellerNoDex.address,
        feeTreasury.address,
        0,
        1000,
        false,
    );
    val noDex = noDexWallet.sendTransfer(
        sellerNoDex.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        normalRecipient.address,
        sellerNoDex.address,
        null,
        0,
        null,
    );
    expect(noDex).toHaveSuccessfulTx<AskToTransfer>({
        from: sellerNoDex.address,
        to: noDexWallet.address,
    });
    expect(userWallet(minter, normalRecipient.address).getJettonBalance()).toEqual(1000);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(0);

    val dexSenderWallet = mintTo(minter, admin, dexSender.address, 1000);
    routeWalletRuntime(
        minter,
        admin,
        dexSender.address,
        feeTreasury.address,
        1000,
        1000,
        true,
    );
    routeAddDexWallet(minter, admin, dexSender.address, dexRecipient.address);
    val dexToDex = dexSenderWallet.sendTransfer(
        dexSender.address,
        FEE_TEST_TRANSFER_VALUE,
        1000,
        dexRecipient.address,
        dexSender.address,
        null,
        0,
        null,
    );
    expect(dexToDex).toHaveSuccessfulTx<AskToTransfer>({
        from: dexSender.address,
        to: dexSenderWallet.address,
    });
    expect(userWallet(minter, dexRecipient.address).getJettonBalance()).toEqual(2000);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(0);
}

get fun `test fees: wallet rejects unknown fee message body`() {
    val (minter, admin, _) = setupTest();
    val owner = testing.treasury("fee-unknown-owner");
    val wallet = mintTo(minter, admin, owner.address, 1000);

    val unknown = wallet.sendAny(
        owner.address,
        beginCell().storeUint(0x2001ffff, 32).endCell(),
        { value: ton("0.05") },
    );
    expect(unknown).toHaveFailedTx({
        from: owner.address,
        to: wallet.address,
        exitCode: 0xFFFF,
    });
}

fun routeWalletRuntime(
    minter: TgBtcCatJettonMaster,
    admin: Treasury,
    walletOwner: address,
    feeTreasury: address?,
    globalBuyFeeBps: uint16,
    globalSellFeeBps: uint16,
    isDexWallet: bool,
): TgBtcCatJettonWallet {
    val wallet = userWallet(minter, walletOwner);
    val res = minter.sendRouteSetWalletFeeRuntime(
        admin.address,
        1,
        walletOwner,
        FEE_WALLET_CONFIG_VALUE,
        feeTreasury,
        globalBuyFeeBps,
        globalSellFeeBps,
        isDexWallet,
        { value: FEE_ROUTE_MSG_VALUE },
    );
    expect(res).toHaveSuccessfulTx<RouteSetWalletFeeRuntime>({
        from: admin.address,
        to: minter.address,
    });
    expect(res).toHaveSuccessfulTx<SetWalletFeeRuntime>({
        from: minter.address,
        to: wallet.address,
    });
    val runtime = wallet.getFeeRuntime();
    expect(runtime.feeTreasury).toEqual(feeTreasury);
    expect(runtime.globalBuyFeeBps).toEqual(globalBuyFeeBps);
    expect(runtime.globalSellFeeBps).toEqual(globalSellFeeBps);
    expect(runtime.isDexWallet).toEqual(isDexWallet);
    return wallet;
}

fun routeAddDexWallet(
    minter: TgBtcCatJettonMaster,
    admin: Treasury,
    walletOwner: address,
    dexWallet: address,
) {
    val wallet = userWallet(minter, walletOwner);
    val res = minter.sendRouteAddWalletDexAddress(
        admin.address,
        2,
        walletOwner,
        FEE_WALLET_CONFIG_VALUE,
        dexWallet,
        { value: FEE_ROUTE_MSG_VALUE },
    );
    expect(res).toHaveSuccessfulTx<RouteAddWalletDexAddress>({
        from: admin.address,
        to: minter.address,
    });
    expect(res).toHaveSuccessfulTx<AddWalletDexAddress>({
        from: minter.address,
        to: wallet.address,
    });
    expect(wallet.isDexWallet(dexWallet)).toEqual(true);
}

fun routeSetWalletSpecificFee(
    minter: TgBtcCatJettonMaster,
    admin: Treasury,
    walletOwner: address,
    target: address,
    buyFeeBps: uint16,
    sellFeeBps: uint16,
) {
    val wallet = userWallet(minter, walletOwner);
    val res = minter.sendRouteSetWalletSpecificFee(
        admin.address,
        3,
        walletOwner,
        FEE_WALLET_CONFIG_VALUE,
        target,
        buyFeeBps,
        sellFeeBps,
        { value: FEE_ROUTE_MSG_VALUE },
    );
    expect(res).toHaveSuccessfulTx<RouteSetWalletSpecificFee>({
        from: admin.address,
        to: minter.address,
    });
    expect(res).toHaveSuccessfulTx<SetWalletSpecificFee>({
        from: minter.address,
        to: wallet.address,
    });
    val rule = wallet.getWalletSpecificFee(target);
    expect(rule.isSet).toEqual(true);
    expect(rule.buyFeeBps).toEqual(buyFeeBps);
    expect(rule.sellFeeBps).toEqual(sellFeeBps);
}

fun routeClearWalletSpecificFee(
    minter: TgBtcCatJettonMaster,
    admin: Treasury,
    walletOwner: address,
    target: address,
) {
    val wallet = userWallet(minter, walletOwner);
    val res = minter.sendRouteClearWalletSpecificFee(
        admin.address,
        4,
        walletOwner,
        FEE_WALLET_CONFIG_VALUE,
        target,
        { value: FEE_ROUTE_MSG_VALUE },
    );
    expect(res).toHaveSuccessfulTx<RouteClearWalletSpecificFee>({
        from: admin.address,
        to: minter.address,
    });
    expect(res).toHaveSuccessfulTx<ClearWalletSpecificFee>({
        from: minter.address,
        to: wallet.address,
    });
    expect(wallet.getWalletSpecificFee(target).isSet).toEqual(false);
}
