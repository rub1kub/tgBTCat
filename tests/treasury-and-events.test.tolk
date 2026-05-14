import "@stdlib/strings"
import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"

import "@contracts/governance-types"
import "@contracts/messages"
import "@wrappers/TgBtcCatEventController.gen"
import "@wrappers/TgBtcCatTreasury.gen"
import "@wrappers/utils"

import "jetton-test-utils"

get fun `test treasury sends TON and enforces governor`() {
    val governor = testing.treasury("treasury-ton-governor");
    val deployer = testing.treasury("treasury-ton-deployer");
    val outsider = testing.treasury("treasury-ton-outsider");
    val recipient = testing.treasury("treasury-ton-recipient");
    val treasury = deployTreasury(governor.address, deployer.address, null, ton("2"));

    val config = treasury.getTreasuryConfig();
    expect(config.governor).toEqual(governor.address);
    expect(config.primaryJettonWallet).toEqual(null);

    val nonGovernor = treasury.sendSendTreasuryTon(
        outsider.address,
        1,
        recipient.address,
        ton("0.1"),
        false,
        { value: ton("0.05") },
    );
    expect(nonGovernor).toHaveFailedTx({
        from: outsider.address,
        to: treasury.address,
        exitCode: GovErrors.NotGovernor,
    });

    val send = treasury.sendSendTreasuryTon(
        governor.address,
        2,
        recipient.address,
        ton("0.2"),
        false,
        { value: ton("0.05") },
    );
    expect(send).toHaveSuccessfulTx<SendTreasuryTon>({
        from: governor.address,
        to: treasury.address,
    });
    expect(send).toHaveSuccessfulTx<TopUpTons>({
        from: treasury.address,
        to: recipient.address,
    });
}

get fun `test treasury sends owned jettons through configured wallet`() {
    val (minter, minterAdmin, _) = setupTest();
    val governor = testing.treasury("treasury-jetton-governor");
    val deployer = testing.treasury("treasury-jetton-deployer");
    val recipient = testing.treasury("treasury-jetton-recipient");
    val treasury = deployTreasury(governor.address, deployer.address, null, ton("2"));
    val treasuryWallet = mintTo(minter, minterAdmin, treasury.address, 1000);

    val configure = treasury.sendSetTreasuryPrimaryJettonWallet(
        governor.address,
        1,
        treasuryWallet.address,
        { value: ton("0.05") },
    );
    expect(configure).toHaveSuccessfulTx<SetTreasuryPrimaryJettonWallet>({
        from: governor.address,
        to: treasury.address,
    });
    expect(treasury.getTreasuryConfig().primaryJettonWallet).toEqual(treasuryWallet.address);

    val send = treasury.sendSendTreasuryJettons(
        governor.address,
        2,
        treasuryWallet.address,
        400,
        recipient.address,
        treasury.address,
        ton("0.3"),
        0,
        PayloadInline { value: makeTinyForwardPayload() },
        { value: ton("0.05") },
    );
    expect(send).toHaveSuccessfulTx<SendTreasuryJettons>({
        from: governor.address,
        to: treasury.address,
    });
    expect(send).toHaveSuccessfulTx<AskToTransfer>({
        from: treasury.address,
        to: treasuryWallet.address,
    });
    expect(treasuryWallet.getJettonBalance()).toEqual(600);
    expect(userWallet(minter, recipient.address).getJettonBalance()).toEqual(400);
}

get fun `test treasury rejects malformed jetton forward payload`() {
    val (minter, minterAdmin, _) = setupTest();
    val governor = testing.treasury("treasury-bad-payload-governor");
    val deployer = testing.treasury("treasury-bad-payload-deployer");
    val recipient = testing.treasury("treasury-bad-payload-recipient");
    val treasury = deployTreasury(governor.address, deployer.address, null, ton("2"));
    val treasuryWallet = mintTo(minter, minterAdmin, treasury.address, 1000);

    val payloadRef = beginCell().endCell();
    val badPayload = beginCell()
        .storeUint(1, 1)
        .storeRef(payloadRef)
        .storeUint(1, 1)
        .endCell()
        .beginParse();
    val sendMessage = createMessage({
        bounce: true,
        value: ton("0.05"),
        dest: treasury.address,
        body: SendTreasuryJettons {
            queryId: 1,
            jettonWallet: treasuryWallet.address,
            jettonAmount: 1,
            transferRecipient: recipient.address,
            sendExcessesTo: treasury.address,
            walletTonAmount: ton("0.3"),
            forwardTonAmount: 0,
            forwardPayload: badPayload,
        },
    });
    val send = net.send(governor.address, sendMessage);
    expect(send).toHaveFailedTx<SendTreasuryJettons>({
        from: governor.address,
        to: treasury.address,
        exitCode: 9,
    });
    expect(treasuryWallet.getJettonBalance()).toEqual(1000);
}

get fun `test treasury updates governor and rejects unknown messages`() {
    val governor = testing.treasury("treasury-config-governor");
    val newGovernor = testing.treasury("treasury-config-new-governor");
    val deployer = testing.treasury("treasury-config-deployer");
    val treasury = deployTreasury(governor.address, deployer.address, null, ton("1"));

    val change = treasury.sendSetTreasuryGovernor(
        governor.address,
        1,
        newGovernor.address,
        { value: ton("0.05") },
    );
    expect(change).toHaveSuccessfulTx<SetTreasuryGovernor>({
        from: governor.address,
        to: treasury.address,
    });
    expect(treasury.getTreasuryConfig().governor).toEqual(newGovernor.address);

    val unknown = treasury.sendAny(
        newGovernor.address,
        beginCell().storeUint(0x1005ffff, 32).endCell(),
        { value: ton("0.05") },
    );
    expect(unknown).toHaveFailedTx({
        from: newGovernor.address,
        to: treasury.address,
        exitCode: GovErrors.InvalidMessage,
    });
}

get fun `test event controller creates updates and changes event status`() {
    testing.setNow(1000);
    val governor = testing.treasury("event-governor");
    val deployer = testing.treasury("event-deployer");
    val controller = deployEventController(governor.address, deployer.address);

    expect(controller.getNextEventId()).toEqual(0);
    expect(controller.getEvent(999).isSet).toEqual(false);
    expect(controller.getEventControllerGovernor()).toEqual(governor.address);

    val create = controller.sendCreateCommunityEvent(
        governor.address,
        1,
        1,
        123,
        EventMetadata { uri: "ipfs://event-one".prefixWith00() },
        1100,
        2000,
        { value: ton("0.05") },
    );
    expect(create).toHaveSuccessfulTx<CreateCommunityEvent>({
        from: governor.address,
        to: controller.address,
    });
    var event = controller.getEvent(0);
    expect(event.isSet).toEqual(true);
    expect(event.eventKind).toEqual(1);
    expect(event.status).toEqual(EVENT_STATUS_DRAFT);
    expect(event.metadataHash).toEqual(123);
    expect(event.metadata!.load().uri).toEqual("ipfs://event-one".prefixWith00());
    expect(event.startsAt).toEqual(1100);
    expect(event.endsAt).toEqual(2000);
    expect(event.createdAt).toEqual(1000);
    expect(event.updatedAt).toEqual(1000);
    expect(controller.getNextEventId()).toEqual(1);

    testing.setNow(1200);
    val update = controller.sendUpdateCommunityEvent(
        governor.address,
        2,
        0,
        2,
        456,
        EventMetadata { uri: "ipfs://event-two".prefixWith00() },
        1300,
        2500,
        { value: ton("0.05") },
    );
    expect(update).toHaveSuccessfulTx<UpdateCommunityEvent>({
        from: governor.address,
        to: controller.address,
    });

    val activate = controller.sendSetCommunityEventStatus(
        governor.address,
        3,
        0,
        EVENT_STATUS_ACTIVE,
        { value: ton("0.05") },
    );
    expect(activate).toHaveSuccessfulTx<SetCommunityEventStatus>({
        from: governor.address,
        to: controller.address,
    });

    event = controller.getEvent(0);
    expect(event.eventKind).toEqual(2);
    expect(event.status).toEqual(EVENT_STATUS_ACTIVE);
    expect(event.metadataHash).toEqual(456);
    expect(event.metadata!.load().uri).toEqual("ipfs://event-two".prefixWith00());
    expect(event.startsAt).toEqual(1300);
    expect(event.endsAt).toEqual(2500);
    expect(event.updatedAt).toEqual(1200);
}

get fun `test event controller rejects non-governor invalid data and unknown messages`() {
    val governor = testing.treasury("event-security-governor");
    val outsider = testing.treasury("event-security-outsider");
    val deployer = testing.treasury("event-security-deployer");
    val controller = deployEventController(governor.address, deployer.address);

    val nonGovernor = controller.sendCreateCommunityEvent(
        outsider.address,
        1,
        1,
        123,
        EventMetadata { uri: "ipfs://event".prefixWith00() },
        1000,
        2000,
        { value: ton("0.05") },
    );
    expect(nonGovernor).toHaveFailedTx({
        from: outsider.address,
        to: controller.address,
        exitCode: GovErrors.NotGovernor,
    });

    val invalidKind = controller.sendCreateCommunityEvent(
        governor.address,
        2,
        0,
        123,
        EventMetadata { uri: "ipfs://event".prefixWith00() },
        1000,
        2000,
        { value: ton("0.05") },
    );
    expect(invalidKind).toHaveFailedTx({
        from: governor.address,
        to: controller.address,
        exitCode: GovErrors.InvalidEventKind,
    });

    val invalidTime = controller.sendCreateCommunityEvent(
        governor.address,
        3,
        1,
        123,
        EventMetadata { uri: "ipfs://event".prefixWith00() },
        2000,
        1000,
        { value: ton("0.05") },
    );
    expect(invalidTime).toHaveFailedTx({
        from: governor.address,
        to: controller.address,
        exitCode: GovErrors.InvalidEventTime,
    });

    val unknownUpdate = controller.sendUpdateCommunityEvent(
        governor.address,
        4,
        999,
        1,
        123,
        EventMetadata { uri: "ipfs://event".prefixWith00() },
        1000,
        2000,
        { value: ton("0.05") },
    );
    expect(unknownUpdate).toHaveFailedTx({
        from: governor.address,
        to: controller.address,
        exitCode: GovErrors.UnknownEvent,
    });

    val unknownEvent = controller.sendSetCommunityEventStatus(
        governor.address,
        5,
        999,
        EVENT_STATUS_ACTIVE,
        { value: ton("0.05") },
    );
    expect(unknownEvent).toHaveFailedTx({
        from: governor.address,
        to: controller.address,
        exitCode: GovErrors.UnknownEvent,
    });

    val invalidStatus = controller.sendSetCommunityEventStatus(
        governor.address,
        6,
        0,
        99,
        { value: ton("0.05") },
    );
    expect(invalidStatus).toHaveFailedTx({
        from: governor.address,
        to: controller.address,
        exitCode: GovErrors.InvalidEventStatus,
    });

    val newGovernor = testing.treasury("event-security-new-governor");
    val changeGovernor = controller.sendSetEventControllerGovernor(
        governor.address,
        7,
        newGovernor.address,
        { value: ton("0.05") },
    );
    expect(changeGovernor).toHaveSuccessfulTx<SetEventControllerGovernor>({
        from: governor.address,
        to: controller.address,
    });
    expect(controller.getEventControllerGovernor()).toEqual(newGovernor.address);

    val unknownMessage = controller.sendAny(
        newGovernor.address,
        beginCell().storeUint(0x1006ffff, 32).endCell(),
        { value: ton("0.05") },
    );
    expect(unknownMessage).toHaveFailedTx({
        from: newGovernor.address,
        to: controller.address,
        exitCode: GovErrors.InvalidMessage,
    });
}

fun deployTreasury(
    governor: address,
    deployer: address,
    primaryJettonWallet: address?,
    value: coins,
): TgBtcCatTreasury {
    val treasury = TgBtcCatTreasury.fromStorage({
        governor,
        primaryJettonWallet,
    });
    expect(treasury.deploy(deployer, { value })).toHaveSuccessfulDeploy({
        to: treasury.address,
    });
    return treasury;
}

fun deployEventController(
    governor: address,
    deployer: address,
): TgBtcCatEventController {
    val controller = TgBtcCatEventController.fromStorage({
        governor,
        nextEventId: 0,
    });
    expect(controller.deploy(deployer, { value: ton("0.05") })).toHaveSuccessfulDeploy({
        to: controller.address,
    });
    return controller;
}
