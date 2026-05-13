import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"

import "@contracts/governance-types"
import "@wrappers/TgBtcCatDexRegistry.gen"
import "@wrappers/TgBtcCatFeeController.gen"
import "@wrappers/TgBtcCatWalletFeeRegistry.gen"

get fun `test fee controller governor can set global fees`() {
    val (controller, governor, _, treasury) = setupFeeController();

    val res = controller.sendSetGlobalFees(
        governor.address,
        1,
        1200,
        3400,
        { value: ton("0.05") },
    );
    expect(res).toHaveSuccessfulTx<SetGlobalFees>({
        from: governor.address,
        to: controller.address,
    });

    val fees = controller.getGlobalFees();
    expect(fees.buyFeeBps).toEqual(1200);
    expect(fees.sellFeeBps).toEqual(3400);
    expect(fees.feeTreasury).toEqual(treasury.address);
    expect(fees.governor).toEqual(governor.address);
}

get fun `test fee controller updates treasury governor and rejects unknown messages`() {
    val (controller, governor, outsider, _) = setupFeeController();
    val newTreasury = testing.treasury("fee-new-treasury");
    val newGovernor = testing.treasury("fee-new-governor");

    val unknown = controller.sendAny(
        outsider.address,
        beginCell().storeUint(0xfeed0001, 32).endCell(),
        { value: ton("0.05") },
    );
    expect(unknown).toHaveFailedTx({
        from: outsider.address,
        to: controller.address,
        exitCode: GovErrors.InvalidMessage,
    });

    val treasuryRes = controller.sendSetFeeTreasury(
        governor.address,
        1,
        newTreasury.address,
        { value: ton("0.05") },
    );
    expect(treasuryRes).toHaveSuccessfulTx<SetFeeTreasury>({
        from: governor.address,
        to: controller.address,
    });
    expect(controller.getGlobalFees().feeTreasury).toEqual(newTreasury.address);

    val governorRes = controller.sendSetFeeControllerGovernor(
        governor.address,
        2,
        newGovernor.address,
        { value: ton("0.05") },
    );
    expect(governorRes).toHaveSuccessfulTx<SetFeeControllerGovernor>({
        from: governor.address,
        to: controller.address,
    });
    expect(controller.getGlobalFees().governor).toEqual(newGovernor.address);

    val oldGovernorWrite = controller.sendSetGlobalFees(
        governor.address,
        3,
        1,
        1,
        { value: ton("0.05") },
    );
    expect(oldGovernorWrite).toHaveFailedTx({
        from: governor.address,
        to: controller.address,
        exitCode: GovErrors.NotGovernor,
    });

    val newGovernorWrite = controller.sendSetGlobalFees(
        newGovernor.address,
        4,
        111,
        222,
        { value: ton("0.05") },
    );
    expect(newGovernorWrite).toHaveSuccessfulTx<SetGlobalFees>({
        from: newGovernor.address,
        to: controller.address,
    });
}

get fun `test fee controller rejects non-governor and fees above 100 percent`() {
    val (controller, governor, outsider, _) = setupFeeController();

    val res = controller.sendSetGlobalFees(
        outsider.address,
        1,
        100,
        200,
        { value: ton("0.05") },
    );
    expect(res).toHaveFailedTx({
        from: outsider.address,
        to: controller.address,
        exitCode: GovErrors.NotGovernor,
    });

    val res2 = controller.sendSetGlobalFees(
        governor.address,
        2,
        10001,
        0,
        { value: ton("0.05") },
    );
    expect(res2).toHaveFailedTx({
        from: governor.address,
        to: controller.address,
        exitCode: GovErrors.InvalidFee,
    });
}

get fun `test wallet fee registry stores persistent wallet buy and sell fees`() {
    val (registry, governor, _, target) = setupWalletFeeRegistry();

    val res = registry.sendSetWalletFees(
        governor.address,
        1,
        target.address,
        2500,
        5000,
        777,
        { value: ton("0.05") },
    );
    expect(res).toHaveSuccessfulTx<SetWalletFees>({
        from: governor.address,
        to: registry.address,
    });

    val rule = registry.getWalletFees(target.address);
    expect(rule.isSet).toEqual(true);
    expect(rule.buyFeeBps).toEqual(2500);
    expect(rule.sellFeeBps).toEqual(5000);
    expect(rule.reasonHash).toEqual(777);
}

get fun `test wallet fee registry rejects protected targets and clears stale rules`() {
    val (registry, governor, _, target) = setupWalletFeeRegistry();

    registry.sendSetWalletFees(
        governor.address,
        1,
        target.address,
        100,
        200,
        1,
        { value: ton("0.05") },
    );

    val protect = registry.sendSetProtectedWallet(
        governor.address,
        2,
        target.address,
        true,
        { value: ton("0.05") },
    );
    expect(protect).toHaveSuccessfulTx<SetProtectedWallet>({
        from: governor.address,
        to: registry.address,
    });
    expect(registry.isWalletProtected(target.address)).toEqual(true);
    expect(registry.getWalletFees(target.address).isSet).toEqual(false);

    val clearProtected = registry.sendClearWalletFees(
        governor.address,
        3,
        target.address,
        { value: ton("0.05") },
    );
    expect(clearProtected).toHaveFailedTx({
        from: governor.address,
        to: registry.address,
        exitCode: GovErrors.ProtectedWallet,
    });

    val res = registry.sendSetWalletFees(
        governor.address,
        4,
        target.address,
        100,
        200,
        2,
        { value: ton("0.05") },
    );
    expect(res).toHaveFailedTx({
        from: governor.address,
        to: registry.address,
        exitCode: GovErrors.ProtectedWallet,
    });
}

get fun `test wallet fee registry clears fees and can unprotect wallets`() {
    val (registry, governor, _, target) = setupWalletFeeRegistry();

    val set = registry.sendSetWalletFees(
        governor.address,
        1,
        target.address,
        400,
        500,
        11,
        { value: ton("0.05") },
    );
    expect(set).toHaveSuccessfulTx<SetWalletFees>({
        from: governor.address,
        to: registry.address,
    });
    expect(registry.getWalletFees(target.address).isSet).toEqual(true);

    val clear = registry.sendClearWalletFees(
        governor.address,
        2,
        target.address,
        { value: ton("0.05") },
    );
    expect(clear).toHaveSuccessfulTx<ClearWalletFees>({
        from: governor.address,
        to: registry.address,
    });
    expect(registry.getWalletFees(target.address).isSet).toEqual(false);

    val protect = registry.sendSetProtectedWallet(
        governor.address,
        3,
        target.address,
        true,
        { value: ton("0.05") },
    );
    expect(protect).toHaveSuccessfulTx<SetProtectedWallet>({
        from: governor.address,
        to: registry.address,
    });
    expect(registry.isWalletProtected(target.address)).toEqual(true);

    val unprotect = registry.sendSetProtectedWallet(
        governor.address,
        4,
        target.address,
        false,
        { value: ton("0.05") },
    );
    expect(unprotect).toHaveSuccessfulTx<SetProtectedWallet>({
        from: governor.address,
        to: registry.address,
    });
    expect(registry.isWalletProtected(target.address)).toEqual(false);

    val setAfterUnprotect = registry.sendSetWalletFees(
        governor.address,
        5,
        target.address,
        600,
        700,
        12,
        { value: ton("0.05") },
    );
    expect(setAfterUnprotect).toHaveSuccessfulTx<SetWalletFees>({
        from: governor.address,
        to: registry.address,
    });
    expect(registry.getWalletFees(target.address).buyFeeBps).toEqual(600);
}

get fun `test wallet fee registry updates governor and rejects unknown messages`() {
    val (registry, governor, outsider, target) = setupWalletFeeRegistry();
    val newGovernor = testing.treasury("wallet-fee-new-governor");

    val unknown = registry.sendAny(
        outsider.address,
        beginCell().storeUint(0xfeed0002, 32).endCell(),
        { value: ton("0.05") },
    );
    expect(unknown).toHaveFailedTx({
        from: outsider.address,
        to: registry.address,
        exitCode: GovErrors.InvalidMessage,
    });

    val setGovernor = registry.sendSetWalletFeeRegistryGovernor(
        governor.address,
        1,
        newGovernor.address,
        { value: ton("0.05") },
    );
    expect(setGovernor).toHaveSuccessfulTx<SetWalletFeeRegistryGovernor>({
        from: governor.address,
        to: registry.address,
    });

    val oldGovernorWrite = registry.sendSetWalletFees(
        governor.address,
        2,
        target.address,
        100,
        200,
        1,
        { value: ton("0.05") },
    );
    expect(oldGovernorWrite).toHaveFailedTx({
        from: governor.address,
        to: registry.address,
        exitCode: GovErrors.NotGovernor,
    });

    val newGovernorWrite = registry.sendSetWalletFees(
        newGovernor.address,
        3,
        target.address,
        100,
        200,
        1,
        { value: ton("0.05") },
    );
    expect(newGovernorWrite).toHaveSuccessfulTx<SetWalletFees>({
        from: newGovernor.address,
        to: registry.address,
    });
    expect(registry.getWalletFees(target.address).isSet).toEqual(true);
}

get fun `test wallet fee registry rejects non-governor and invalid fee`() {
    val (registry, governor, outsider, target) = setupWalletFeeRegistry();

    val res = registry.sendSetWalletFees(
        outsider.address,
        1,
        target.address,
        100,
        200,
        1,
        { value: ton("0.05") },
    );
    expect(res).toHaveFailedTx({
        from: outsider.address,
        to: registry.address,
        exitCode: GovErrors.NotGovernor,
    });

    val res2 = registry.sendSetWalletFees(
        governor.address,
        2,
        target.address,
        0,
        10001,
        1,
        { value: ton("0.05") },
    );
    expect(res2).toHaveFailedTx({
        from: governor.address,
        to: registry.address,
        exitCode: GovErrors.InvalidFee,
    });
}

get fun `test dex registry tracks dex wallets and enforces governor writes`() {
    val governor = testing.treasury("dex-governor");
    val outsider = testing.treasury("dex-outsider");
    val dex = testing.treasury("dex-wallet");

    val registry = TgBtcCatDexRegistry.fromStorage({ governor: governor.address });
    expect(registry.deploy(governor.address, { value: ton("0.05") })).toHaveSuccessfulDeploy({
        to: registry.address,
    });

    val bad = registry.sendAddDexWallet(outsider.address, 1, dex.address, { value: ton("0.05") });
    expect(bad).toHaveFailedTx({
        from: outsider.address,
        to: registry.address,
        exitCode: GovErrors.NotGovernor,
    });

    val add = registry.sendAddDexWallet(governor.address, 2, dex.address, { value: ton("0.05") });
    expect(add).toHaveSuccessfulTx<AddDexWallet>({
        from: governor.address,
        to: registry.address,
    });
    expect(registry.isDexWallet(dex.address)).toEqual(true);

    val remove = registry.sendRemoveDexWallet(
        governor.address,
        3,
        dex.address,
        { value: ton("0.05") },
    );
    expect(remove).toHaveSuccessfulTx<RemoveDexWallet>({
        from: governor.address,
        to: registry.address,
    });
    expect(registry.isDexWallet(dex.address)).toEqual(false);
}

get fun `test dex registry updates governor and rejects unknown messages`() {
    val governor = testing.treasury("dex-governor-update");
    val newGovernor = testing.treasury("dex-new-governor");
    val outsider = testing.treasury("dex-unknown-outsider");
    val dex = testing.treasury("dex-updated-wallet");

    val registry = TgBtcCatDexRegistry.fromStorage({ governor: governor.address });
    expect(registry.deploy(governor.address, { value: ton("0.05") })).toHaveSuccessfulDeploy({
        to: registry.address,
    });

    val unknown = registry.sendAny(
        outsider.address,
        beginCell().storeUint(0xfeed0003, 32).endCell(),
        { value: ton("0.05") },
    );
    expect(unknown).toHaveFailedTx({
        from: outsider.address,
        to: registry.address,
        exitCode: GovErrors.InvalidMessage,
    });

    val setGovernor = registry.sendSetDexRegistryGovernor(
        governor.address,
        1,
        newGovernor.address,
        { value: ton("0.05") },
    );
    expect(setGovernor).toHaveSuccessfulTx<SetDexRegistryGovernor>({
        from: governor.address,
        to: registry.address,
    });

    val oldGovernorAdd = registry.sendAddDexWallet(
        governor.address,
        2,
        dex.address,
        { value: ton("0.05") },
    );
    expect(oldGovernorAdd).toHaveFailedTx({
        from: governor.address,
        to: registry.address,
        exitCode: GovErrors.NotGovernor,
    });

    val newGovernorAdd = registry.sendAddDexWallet(
        newGovernor.address,
        3,
        dex.address,
        { value: ton("0.05") },
    );
    expect(newGovernorAdd).toHaveSuccessfulTx<AddDexWallet>({
        from: newGovernor.address,
        to: registry.address,
    });
    expect(registry.isDexWallet(dex.address)).toEqual(true);
}

fun setupFeeController(): (TgBtcCatFeeController, Treasury, Treasury, Treasury) {
    val governor = testing.treasury("fee-governor");
    val outsider = testing.treasury("fee-outsider");
    val treasury = testing.treasury("fee-treasury");
    val controller = TgBtcCatFeeController.fromStorage({
        governor: governor.address,
        feeTreasury: treasury.address,
        globalBuyFeeBps: 0,
        globalSellFeeBps: 0,
    });
    expect(controller.deploy(governor.address, { value: ton("0.05") })).toHaveSuccessfulDeploy({
        to: controller.address,
    });
    return (controller, governor, outsider, treasury);
}

fun setupWalletFeeRegistry(): (TgBtcCatWalletFeeRegistry, Treasury, Treasury, Treasury) {
    val governor = testing.treasury("wallet-fee-governor");
    val outsider = testing.treasury("wallet-fee-outsider");
    val target = testing.treasury("wallet-fee-target");
    val registry = TgBtcCatWalletFeeRegistry.fromStorage({ governor: governor.address });
    expect(registry.deploy(governor.address, { value: ton("0.05") })).toHaveSuccessfulDeploy({
        to: registry.address,
    });
    return (registry, governor, outsider, target);
}
