import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"

import "@contracts/governance-types"
import "@contracts/messages"
import "@wrappers/TgBtcCatDexRegistry.gen"
import "@wrappers/TgBtcCatFeeController.gen"
import "@wrappers/TgBtcCatGovernor.gen"
import "@wrappers/TgBtcCatJettonMaster.gen"
import "@wrappers/TgBtcCatWalletFeeRegistry.gen"
import "@wrappers/utils"

import "jetton-test-utils"

get fun `test governor counts irreversible votes from real jetton transfer notification`() {
    testing.setNow(1000);
    val (minter, admin, _) = setupTest();
    val voter = testing.treasury("vote-transfer-voter");
    val governorAdmin = testing.treasury("vote-transfer-admin");

    val voterWallet = mintTo(minter, admin, voter.address, 1000);
    val governor = deployGovernor(minter, governorAdmin, 10);

    val create = governor.sendCreateGovernanceProposal(
        governorAdmin.address,
        1,
        1,
        null,
        100,
        200,
        123,
        2000,
        { value: ton("0.05") },
    );
    expect(create).toHaveSuccessfulTx<CreateGovernanceProposal>({
        from: governorAdmin.address,
        to: governor.address,
    });

    val votePayload = CastVotePayload {
        proposalId: 0,
        side: VOTE_SIDE_FOR,
        commentHash: 456,
    }.toCell();
    val vote = voterWallet.sendTransfer(
        voter.address,
        ton("0.3"),
        250,
        governor.address,
        voter.address,
        null,
        ton("0.05"),
        votePayload,
    );
    expect(vote).toHaveSuccessfulTx<TransferNotificationForRecipient>({
        from: minter.getWalletAddress(governor.address),
        to: governor.address,
    });

    val proposal = governor.getProposal(0);
    expect(proposal.isSet).toEqual(true);
    expect(proposal.forVotes).toEqual(250);
    expect(proposal.againstVotes).toEqual(0);
    expect(proposal.abstainVotes).toEqual(0);
    expect(voterWallet.getJettonBalance()).toEqual(750);
    expect(userWallet(minter, governor.address).getJettonBalance()).toEqual(250);
}

get fun `test governor rejects fake vote notification sender`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("fake-vote-admin");
    val attacker = testing.treasury("fake-vote-attacker");
    val governor = deployGovernor(minter, governorAdmin, 10);

    governor.sendCreateGovernanceProposal(
        governorAdmin.address,
        1,
        1,
        null,
        0,
        0,
        0,
        2000,
        { value: ton("0.05") },
    );

    val res = sendDirectVoteNotification(
        governor,
        attacker.address,
        attacker.address,
        100,
        0,
        VOTE_SIDE_FOR,
    );
    expect(res).toHaveFailedTx({
        from: attacker.address,
        to: governor.address,
        exitCode: GovErrors.NotVoteJettonWallet,
    });
}

get fun `test governor rejects small vote invalid side unknown proposal and late vote`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("vote-reject-admin");
    val voter = testing.treasury("vote-reject-voter");
    val governor = deployGovernor(minter, governorAdmin, 100);
    val voteWallet = minter.getWalletAddress(governor.address);

    governor.sendCreateGovernanceProposal(
        governorAdmin.address,
        1,
        1,
        null,
        0,
        0,
        0,
        1100,
        { value: ton("0.05") },
    );

    val small = sendDirectVoteNotification(
        governor,
        voteWallet,
        voter.address,
        99,
        0,
        VOTE_SIDE_FOR,
    );
    expect(small).toHaveFailedTx({
        from: voteWallet,
        to: governor.address,
        exitCode: GovErrors.VoteTooSmall,
    });

    val invalidSide = sendDirectVoteNotification(
        governor,
        voteWallet,
        voter.address,
        100,
        0,
        9,
    );
    expect(invalidSide).toHaveFailedTx({
        from: voteWallet,
        to: governor.address,
        exitCode: GovErrors.InvalidVoteSide,
    });

    val unknown = sendDirectVoteNotification(
        governor,
        voteWallet,
        voter.address,
        100,
        999,
        VOTE_SIDE_FOR,
    );
    expect(unknown).toHaveFailedTx({
        from: voteWallet,
        to: governor.address,
        exitCode: GovErrors.UnknownProposal,
    });

    testing.setNow(1200);
    val late = sendDirectVoteNotification(
        governor,
        voteWallet,
        voter.address,
        100,
        0,
        VOTE_SIDE_FOR,
    );
    expect(late).toHaveFailedTx({
        from: voteWallet,
        to: governor.address,
        exitCode: GovErrors.VotingClosed,
    });
}

get fun `test governor enforces admin proposal validation and unknown message rejection`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("admin-validation-admin");
    val outsider = testing.treasury("admin-validation-outsider");
    val governor = deployGovernor(minter, governorAdmin, 10);

    val nonAdminCreate = governor.sendCreateGovernanceProposal(
        outsider.address,
        1,
        1,
        null,
        0,
        0,
        0,
        2000,
        { value: ton("0.05") },
    );
    expect(nonAdminCreate).toHaveFailedTx({
        from: outsider.address,
        to: governor.address,
        exitCode: GovErrors.NotGovernor,
    });

    val invalidFee = governor.sendCreateGovernanceProposal(
        governorAdmin.address,
        2,
        1,
        null,
        10001,
        0,
        0,
        2000,
        { value: ton("0.05") },
    );
    expect(invalidFee).toHaveFailedTx({
        from: governorAdmin.address,
        to: governor.address,
        exitCode: GovErrors.InvalidFee,
    });

    val expired = governor.sendCreateGovernanceProposal(
        governorAdmin.address,
        3,
        1,
        null,
        0,
        0,
        0,
        1000,
        { value: ton("0.05") },
    );
    expect(expired).toHaveFailedTx({
        from: governorAdmin.address,
        to: governor.address,
        exitCode: GovErrors.VotingClosed,
    });

    expect(governor.getNextProposalId()).toEqual(0);
    expect(governor.getProposal(999).isSet).toEqual(false);

    val unknown = governor.sendAny(
        outsider.address,
        beginCell().storeUint(0xdeadbeef, 32).endCell(),
        { value: ton("0.05") },
    );
    expect(unknown).toHaveFailedTx({
        from: outsider.address,
        to: governor.address,
        exitCode: GovErrors.InvalidMessage,
    });
}

get fun `test governor persists vote config and rejects non-admin config changes`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("config-admin");
    val outsider = testing.treasury("config-outsider");
    val governor = deployGovernor(minter, governorAdmin, 10);

    val badWallet = governor.sendSetVoteJettonWallet(
        outsider.address,
        1,
        outsider.address,
        { value: ton("0.05") },
    );
    expect(badWallet).toHaveFailedTx({
        from: outsider.address,
        to: governor.address,
        exitCode: GovErrors.NotGovernor,
    });

    val badMinimum = governor.sendSetMinimumVoteAmount(
        outsider.address,
        2,
        777,
        { value: ton("0.05") },
    );
    expect(badMinimum).toHaveFailedTx({
        from: outsider.address,
        to: governor.address,
        exitCode: GovErrors.NotGovernor,
    });

    val newVoteWallet = randomAddress();
    val setWallet = governor.sendSetVoteJettonWallet(
        governorAdmin.address,
        3,
        newVoteWallet,
        { value: ton("0.05") },
    );
    expect(setWallet).toHaveSuccessfulTx<SetVoteJettonWallet>({
        from: governorAdmin.address,
        to: governor.address,
    });

    val setMinimum = governor.sendSetMinimumVoteAmount(
        governorAdmin.address,
        4,
        777,
        { value: ton("0.05") },
    );
    expect(setMinimum).toHaveSuccessfulTx<SetMinimumVoteAmount>({
        from: governorAdmin.address,
        to: governor.address,
    });

    val (voteJettonWallet, minVoteAmount, admin) = governor.getVoteConfig();
    expect(voteJettonWallet).toEqual(newVoteWallet);
    expect(minVoteAmount).toEqual(777);
    expect(admin).toEqual(governorAdmin.address);
}

get fun `test governor counts against and abstain vote sides independently`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("side-count-admin");
    val voter = testing.treasury("side-count-voter");
    val governor = deployGovernor(minter, governorAdmin, 10);
    val voteWallet = minter.getWalletAddress(governor.address);

    val create = governor.sendCreateGovernanceProposal(
        governorAdmin.address,
        1,
        1,
        null,
        0,
        0,
        0,
        2000,
        { value: ton("0.05") },
    );
    expect(create).toHaveSuccessfulTx<CreateGovernanceProposal>({
        from: governorAdmin.address,
        to: governor.address,
    });

    val against = sendDirectVoteNotification(
        governor,
        voteWallet,
        voter.address,
        300,
        0,
        VOTE_SIDE_AGAINST,
    );
    expect(against).toHaveSuccessfulTx<TransferNotificationForRecipient>({
        from: voteWallet,
        to: governor.address,
    });

    val abstain = sendDirectVoteNotification(
        governor,
        voteWallet,
        voter.address,
        200,
        0,
        VOTE_SIDE_ABSTAIN,
    );
    expect(abstain).toHaveSuccessfulTx<TransferNotificationForRecipient>({
        from: voteWallet,
        to: governor.address,
    });

    val proposal = governor.getProposal(0);
    expect(proposal.forVotes).toEqual(0);
    expect(proposal.againstVotes).toEqual(300);
    expect(proposal.abstainVotes).toEqual(200);
}

get fun `test governor executes passed global fee proposal`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("execute-global-admin");
    val executor = testing.treasury("execute-global-executor");
    val voter = testing.treasury("execute-global-voter");
    val governor = deployGovernor(minter, governorAdmin, 10);
    val (feeController, walletFeeRegistry, dexRegistry) = deployExecutionControllers(
        governor,
        governorAdmin,
    );
    configureExecutionTargets(
        governor,
        governorAdmin,
        feeController.address,
        walletFeeRegistry.address,
        dexRegistry.address,
        200,
    );

    val proposalId = createProposal(
        governor,
        governorAdmin,
        ACTION_SET_GLOBAL_FEES,
        null,
        1200,
        3400,
        44,
        1100,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        proposalId,
        300,
        VOTE_SIDE_FOR,
    );

    val early = governor.sendExecuteProposal(
        executor.address,
        1,
        proposalId,
        { value: ton("0.05") },
    );
    expect(early).toHaveFailedTx({
        from: executor.address,
        to: governor.address,
        exitCode: GovErrors.VotingOpen,
    });

    testing.setNow(1200);
    val execute = governor.sendExecuteProposal(
        executor.address,
        2,
        proposalId,
        { value: ton("0.05") },
    );
    expect(execute).toHaveSuccessfulTx<ExecuteProposal>({
        from: executor.address,
        to: governor.address,
    });
    expect(execute).toHaveSuccessfulTx<SetGlobalFees>({
        from: governor.address,
        to: feeController.address,
    });

    val fees = feeController.getGlobalFees();
    expect(fees.buyFeeBps).toEqual(1200);
    expect(fees.sellFeeBps).toEqual(3400);
    expect(governor.getProposal(proposalId).executed).toEqual(true);

    val replay = governor.sendExecuteProposal(
        executor.address,
        3,
        proposalId,
        { value: ton("0.05") },
    );
    expect(replay).toHaveFailedTx({
        from: executor.address,
        to: governor.address,
        exitCode: GovErrors.ProposalAlreadyExecuted,
    });
}

get fun `test governor rejects execution without target quorum or majority`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("execute-reject-admin");
    val executor = testing.treasury("execute-reject-executor");
    val voter = testing.treasury("execute-reject-voter");
    val governor = deployGovernor(minter, governorAdmin, 10);

    val missingTargetProposal = createProposal(
        governor,
        governorAdmin,
        ACTION_SET_GLOBAL_FEES,
        null,
        100,
        200,
        1,
        1100,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        missingTargetProposal,
        200,
        VOTE_SIDE_FOR,
    );
    testing.setNow(1200);
    val missingTarget = governor.sendExecuteProposal(
        executor.address,
        1,
        missingTargetProposal,
        { value: ton("0.05") },
    );
    expect(missingTarget).toHaveFailedTx({
        from: executor.address,
        to: governor.address,
        exitCode: GovErrors.ExecutionTargetMissing,
    });

    val (feeController, walletFeeRegistry, dexRegistry) = deployExecutionControllers(
        governor,
        governorAdmin,
    );
    configureExecutionTargets(
        governor,
        governorAdmin,
        feeController.address,
        walletFeeRegistry.address,
        dexRegistry.address,
        500,
    );

    testing.setNow(1300);
    val belowQuorumProposal = createProposal(
        governor,
        governorAdmin,
        ACTION_SET_GLOBAL_FEES,
        null,
        300,
        400,
        2,
        1400,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        belowQuorumProposal,
        100,
        VOTE_SIDE_FOR,
    );
    testing.setNow(1500);
    val belowQuorum = governor.sendExecuteProposal(
        executor.address,
        2,
        belowQuorumProposal,
        { value: ton("0.05") },
    );
    expect(belowQuorum).toHaveFailedTx({
        from: executor.address,
        to: governor.address,
        exitCode: GovErrors.ProposalRejected,
    });

    configureExecutionTargets(
        governor,
        governorAdmin,
        feeController.address,
        walletFeeRegistry.address,
        dexRegistry.address,
        0,
    );
    testing.setNow(1600);
    val rejectedProposal = createProposal(
        governor,
        governorAdmin,
        ACTION_SET_GLOBAL_FEES,
        null,
        500,
        600,
        3,
        1700,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        rejectedProposal,
        100,
        VOTE_SIDE_FOR,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        rejectedProposal,
        200,
        VOTE_SIDE_AGAINST,
    );
    testing.setNow(1800);
    val rejected = governor.sendExecuteProposal(
        executor.address,
        3,
        rejectedProposal,
        { value: ton("0.05") },
    );
    expect(rejected).toHaveFailedTx({
        from: executor.address,
        to: governor.address,
        exitCode: GovErrors.ProposalRejected,
    });
}

get fun `test governor executes wallet fee and dex registry proposals`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("execute-registry-admin");
    val executor = testing.treasury("execute-registry-executor");
    val voter = testing.treasury("execute-registry-voter");
    val target = testing.treasury("execute-registry-target");
    val dexWallet = testing.treasury("execute-registry-dex");
    val governor = deployGovernor(minter, governorAdmin, 10);
    val (feeController, walletFeeRegistry, dexRegistry) = deployExecutionControllers(
        governor,
        governorAdmin,
    );
    configureExecutionTargets(
        governor,
        governorAdmin,
        feeController.address,
        walletFeeRegistry.address,
        dexRegistry.address,
        0,
    );

    val setWalletFeesProposal = createProposal(
        governor,
        governorAdmin,
        ACTION_SET_WALLET_FEES,
        target.address,
        111,
        222,
        7,
        1100,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        setWalletFeesProposal,
        100,
        VOTE_SIDE_FOR,
    );
    testing.setNow(1200);
    val setWalletFees = governor.sendExecuteProposal(
        executor.address,
        1,
        setWalletFeesProposal,
        { value: ton("0.05") },
    );
    expect(setWalletFees).toHaveSuccessfulTx<SetWalletFees>({
        from: governor.address,
        to: walletFeeRegistry.address,
    });
    val rule = walletFeeRegistry.getWalletFees(target.address);
    expect(rule.isSet).toEqual(true);
    expect(rule.buyFeeBps).toEqual(111);
    expect(rule.sellFeeBps).toEqual(222);
    expect(governor.getProposal(setWalletFeesProposal).executed).toEqual(true);

    testing.setNow(1300);
    val clearWalletFeesProposal = createProposal(
        governor,
        governorAdmin,
        ACTION_CLEAR_WALLET_FEES,
        target.address,
        0,
        0,
        8,
        1400,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        clearWalletFeesProposal,
        100,
        VOTE_SIDE_FOR,
    );
    testing.setNow(1500);
    val clearWalletFees = governor.sendExecuteProposal(
        executor.address,
        2,
        clearWalletFeesProposal,
        { value: ton("0.05") },
    );
    expect(clearWalletFees).toHaveSuccessfulTx<ClearWalletFees>({
        from: governor.address,
        to: walletFeeRegistry.address,
    });
    expect(walletFeeRegistry.getWalletFees(target.address).isSet).toEqual(false);
    expect(governor.getProposal(clearWalletFeesProposal).executed).toEqual(true);

    testing.setNow(1600);
    val addDexProposal = createProposal(
        governor,
        governorAdmin,
        ACTION_ADD_DEX_WALLET,
        dexWallet.address,
        0,
        0,
        9,
        1700,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        addDexProposal,
        100,
        VOTE_SIDE_FOR,
    );
    testing.setNow(1800);
    val addDex = governor.sendExecuteProposal(
        executor.address,
        3,
        addDexProposal,
        { value: ton("0.05") },
    );
    expect(addDex).toHaveSuccessfulTx<AddDexWallet>({
        from: governor.address,
        to: dexRegistry.address,
    });
    expect(dexRegistry.isDexWallet(dexWallet.address)).toEqual(true);
    expect(governor.getProposal(addDexProposal).executed).toEqual(true);

    testing.setNow(1900);
    val removeDexProposal = createProposal(
        governor,
        governorAdmin,
        ACTION_REMOVE_DEX_WALLET,
        dexWallet.address,
        0,
        0,
        10,
        2000,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        removeDexProposal,
        100,
        VOTE_SIDE_FOR,
    );
    testing.setNow(2100);
    val removeDex = governor.sendExecuteProposal(
        executor.address,
        4,
        removeDexProposal,
        { value: ton("0.05") },
    );
    expect(removeDex).toHaveSuccessfulTx<RemoveDexWallet>({
        from: governor.address,
        to: dexRegistry.address,
    });
    expect(dexRegistry.isDexWallet(dexWallet.address)).toEqual(false);
    expect(governor.getProposal(removeDexProposal).executed).toEqual(true);
}

get fun `test governor rejects invalid execution inputs`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("invalid-execution-admin");
    val executor = testing.treasury("invalid-execution-executor");
    val voter = testing.treasury("invalid-execution-voter");
    val governor = deployGovernor(minter, governorAdmin, 10);
    val (feeController, walletFeeRegistry, dexRegistry) = deployExecutionControllers(
        governor,
        governorAdmin,
    );
    configureExecutionTargets(
        governor,
        governorAdmin,
        feeController.address,
        walletFeeRegistry.address,
        dexRegistry.address,
        0,
    );

    val setExecutionValue = governor.sendSetExecutionValue(
        governorAdmin.address,
        1,
        123456789,
        { value: ton("0.05") },
    );
    expect(setExecutionValue).toHaveSuccessfulTx<SetExecutionValue>({
        from: governorAdmin.address,
        to: governor.address,
    });
    val (_, _, _, _, executionValue) = governor.getExecutionConfig();
    expect(executionValue).toEqual(123456789);

    val unknown = governor.sendExecuteProposal(
        executor.address,
        2,
        999,
        { value: ton("0.05") },
    );
    expect(unknown).toHaveFailedTx({
        from: executor.address,
        to: governor.address,
        exitCode: GovErrors.UnknownProposal,
    });

    val missingTargetProposal = createProposal(
        governor,
        governorAdmin,
        ACTION_SET_WALLET_FEES,
        null,
        100,
        200,
        1,
        1100,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        missingTargetProposal,
        100,
        VOTE_SIDE_FOR,
    );
    testing.setNow(1200);
    val missingTarget = governor.sendExecuteProposal(
        executor.address,
        3,
        missingTargetProposal,
        { value: ton("0.05") },
    );
    expect(missingTarget).toHaveFailedTx({
        from: executor.address,
        to: governor.address,
        exitCode: GovErrors.ExecutionTargetMissing,
    });

    testing.setNow(1300);
    val invalidActionProposal = createProposal(
        governor,
        governorAdmin,
        99,
        testing.treasury("invalid-action-target").address,
        0,
        0,
        2,
        1400,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        invalidActionProposal,
        100,
        VOTE_SIDE_FOR,
    );
    testing.setNow(1500);
    val invalidAction = governor.sendExecuteProposal(
        executor.address,
        4,
        invalidActionProposal,
        { value: ton("0.05") },
    );
    expect(invalidAction).toHaveFailedTx({
        from: executor.address,
        to: governor.address,
        exitCode: GovErrors.InvalidActionType,
    });
}

get fun `test governor rolls back executed flag when execution target bounces`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("bounce-execution-admin");
    val executor = testing.treasury("bounce-execution-executor");
    val voter = testing.treasury("bounce-execution-voter");
    val feeTreasury = testing.treasury("bounce-execution-fee-treasury");
    val wrongGovernor = testing.treasury("bounce-execution-wrong-governor");
    val governor = deployGovernor(minter, governorAdmin, 10);
    val rejectingFeeController = TgBtcCatFeeController.fromStorage({
        governor: wrongGovernor.address,
        feeTreasury: feeTreasury.address,
        globalBuyFeeBps: 0,
        globalSellFeeBps: 0,
    });
    expect(
        rejectingFeeController.deploy(governorAdmin.address, { value: ton("0.05") }),
    ).toHaveSuccessfulDeploy({
        to: rejectingFeeController.address,
    });
    configureExecutionTargets(
        governor,
        governorAdmin,
        rejectingFeeController.address,
        null,
        null,
        0,
    );

    val proposalId = createProposal(
        governor,
        governorAdmin,
        ACTION_SET_GLOBAL_FEES,
        null,
        100,
        200,
        1,
        1100,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        proposalId,
        100,
        VOTE_SIDE_FOR,
    );
    testing.setNow(1200);

    val execute = governor.sendExecuteProposal(
        executor.address,
        1,
        proposalId,
        { value: ton("0.05") },
    );
    expect(execute).toHaveSuccessfulTx<ExecuteProposal>({
        from: executor.address,
        to: governor.address,
    });
    expect(execute).toHaveFailedTx({
        from: governor.address,
        to: rejectingFeeController.address,
        exitCode: GovErrors.NotGovernor,
    });
    expect(governor.getProposal(proposalId).executed).toEqual(false);
}

fun deployGovernor(
    minter: TgBtcCatJettonMaster,
    admin: Treasury,
    minVoteAmount: coins,
): TgBtcCatGovernor {
    val placeholder = randomAddress();
    val governor = TgBtcCatGovernor.fromStorage({
        admin: admin.address,
        voteJettonWallet: placeholder,
        minVoteAmount,
        nextProposalId: 0,
    });
    expect(governor.deploy(admin.address, { value: ton("0.05") })).toHaveSuccessfulDeploy({
        to: governor.address,
    });

    val voteJettonWallet = minter.getWalletAddress(governor.address);
    val configure = governor.sendSetVoteJettonWallet(
        admin.address,
        0,
        voteJettonWallet,
        { value: ton("0.05") },
    );
    expect(configure).toHaveSuccessfulTx<SetVoteJettonWallet>({
        from: admin.address,
        to: governor.address,
    });
    return governor;
}

fun deployExecutionControllers(
    governor: TgBtcCatGovernor,
    deployer: Treasury,
): (TgBtcCatFeeController, TgBtcCatWalletFeeRegistry, TgBtcCatDexRegistry) {
    val feeTreasury = testing.treasury("execution-fee-treasury");
    val feeController = TgBtcCatFeeController.fromStorage({
        governor: governor.address,
        feeTreasury: feeTreasury.address,
        globalBuyFeeBps: 0,
        globalSellFeeBps: 0,
    });
    expect(feeController.deploy(deployer.address, { value: ton("0.05") })).toHaveSuccessfulDeploy({
        to: feeController.address,
    });

    val walletFeeRegistry = TgBtcCatWalletFeeRegistry.fromStorage({ governor: governor.address });
    expect(
        walletFeeRegistry.deploy(deployer.address, { value: ton("0.05") }),
    ).toHaveSuccessfulDeploy({
        to: walletFeeRegistry.address,
    });

    val dexRegistry = TgBtcCatDexRegistry.fromStorage({ governor: governor.address });
    expect(dexRegistry.deploy(deployer.address, { value: ton("0.05") })).toHaveSuccessfulDeploy({
        to: dexRegistry.address,
    });

    return (feeController, walletFeeRegistry, dexRegistry);
}

fun configureExecutionTargets(
    governor: TgBtcCatGovernor,
    admin: Treasury,
    feeController: address?,
    walletFeeRegistry: address?,
    dexRegistry: address?,
    minQuorumVotes: coins,
) {
    val topUp = governor.sendGovernanceTopUp(admin.address, { value: ton("2") });
    expect(topUp).toHaveSuccessfulTx<GovernanceTopUp>({
        from: admin.address,
        to: governor.address,
    });

    val targets = governor.sendSetExecutionTargets(
        admin.address,
        1,
        feeController,
        walletFeeRegistry,
        dexRegistry,
        { value: ton("0.05") },
    );
    expect(targets).toHaveSuccessfulTx<SetExecutionTargets>({
        from: admin.address,
        to: governor.address,
    });

    val quorum = governor.sendSetGovernanceQuorum(
        admin.address,
        2,
        minQuorumVotes,
        { value: ton("0.05") },
    );
    expect(quorum).toHaveSuccessfulTx<SetGovernanceQuorum>({
        from: admin.address,
        to: governor.address,
    });
}

fun createProposal(
    governor: TgBtcCatGovernor,
    admin: Treasury,
    actionType: uint8,
    target: address?,
    buyFeeBps: uint16,
    sellFeeBps: uint16,
    reasonHash: uint256,
    votingEndsAt: uint32,
): uint64 {
    val proposalId = governor.getNextProposalId();
    val create = governor.sendCreateGovernanceProposal(
        admin.address,
        proposalId,
        actionType,
        target,
        buyFeeBps,
        sellFeeBps,
        reasonHash,
        votingEndsAt,
        { value: ton("0.05") },
    );
    expect(create).toHaveSuccessfulTx<CreateGovernanceProposal>({
        from: admin.address,
        to: governor.address,
    });
    return proposalId;
}

fun voteDirect(
    minter: TgBtcCatJettonMaster,
    governor: TgBtcCatGovernor,
    voter: address,
    proposalId: uint64,
    amount: coins,
    side: uint8,
) {
    val voteWallet = minter.getWalletAddress(governor.address);
    val vote = sendDirectVoteNotification(
        governor,
        voteWallet,
        voter,
        amount,
        proposalId,
        side,
    );
    expect(vote).toHaveSuccessfulTx<TransferNotificationForRecipient>({
        from: voteWallet,
        to: governor.address,
    });
}

fun sendDirectVoteNotification(
    governor: TgBtcCatGovernor,
    from: address,
    voter: address,
    amount: coins,
    proposalId: uint64,
    side: uint8,
): SendResultList {
    val payload = CastVotePayload {
        proposalId,
        side,
        commentHash: 0,
    }.toCell();
    return governor.sendTransferNotificationForRecipient(
        from,
        0,
        amount,
        voter,
        PayloadInRef { value: payload as unknown as Cell<RemainingBitsAndRefs> },
        { value: ton("0.05") },
    );
}
