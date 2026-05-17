import "@stdlib/strings"

import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"
import "@contracts/errors"
import "@contracts/governance-types"
import "@contracts/messages"
import "@wrappers/TgBtcCatDexRegistry.gen"
import "@wrappers/TgBtcCatEventController.gen"
import "@wrappers/TgBtcCatFeeController.gen"
import "@wrappers/TgBtcCatGovernor.gen"
import "@wrappers/TgBtcCatJettonMaster.gen"
import "@wrappers/TgBtcCatJettonWallet.gen"
import "@wrappers/TgBtcCatTreasury.gen"
import "@wrappers/TgBtcCatWalletFeeRegistry.gen"
import "@wrappers/utils"

import "jetton-test-utils"

const GOVERNOR_MASTER_ROUTE_VALUE = 500000000
const GOVERNOR_WALLET_ROUTE_VALUE = 120000000

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
        null,
        0,
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
        null,
        0,
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
        null,
        0,
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

    testing.setNow(2801);
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

get fun `test governor charges token proposal fee and rejects invalid proposal messages`() {
    testing.setNow(1000);
    val (minter, minterAdmin, _) = setupTest();
    val governorAdmin = testing.treasury("admin-validation-admin");
    val outsider = testing.treasury("admin-validation-outsider");
    val governor = deployGovernor(minter, governorAdmin, 10);
    val outsiderWallet = mintTo(
        minter,
        minterAdmin,
        outsider.address,
        MIN_PROPOSAL_CREATE_JETTONS * 2,
    );

    val proposalPayload = CreateGovernanceProposal {
        queryId: 1,
        actionType: ACTION_SET_GLOBAL_FEES,
        target: null,
        auxTarget: null,
        flags: 0,
        buyFeeBps: 0,
        sellFeeBps: 0,
        reasonHash: 0,
        votingEndsAt: 2000,
    }.toCell();

    val publicCreate = outsiderWallet.sendTransfer(
        outsider.address,
        ton("0.3"),
        MIN_PROPOSAL_CREATE_JETTONS,
        governor.address,
        outsider.address,
        null,
        ton("0.05"),
        proposalPayload,
    );
    expect(publicCreate).toHaveSuccessfulTx<TransferNotificationForRecipient>({
        from: minter.getWalletAddress(governor.address),
        to: governor.address,
    });
    expect(governor.getProposal(0).isSet).toEqual(true);
    expect(userWallet(minter, governor.address).getJettonBalance()).toEqual(
        MIN_PROPOSAL_CREATE_JETTONS,
    );

    val directPublicCreate = governor.sendCreateGovernanceProposal(
        outsider.address,
        2,
        1,
        null,
        null,
        0,
        0,
        0,
        0,
        2000,
        { value: ton("0.049") },
    );
    expect(directPublicCreate).toHaveFailedTx({
        from: outsider.address,
        to: governor.address,
        exitCode: GovErrors.NotGovernor,
    });

    val underpaidPayload = CreateGovernanceProposal {
        queryId: 3,
        actionType: ACTION_SET_GLOBAL_FEES,
        target: null,
        auxTarget: null,
        flags: 0,
        buyFeeBps: 0,
        sellFeeBps: 0,
        reasonHash: 0,
        votingEndsAt: 2000,
    }.toCell();
    val underpaidCreate = outsiderWallet.sendTransfer(
        outsider.address,
        ton("0.3"),
        MIN_PROPOSAL_CREATE_JETTONS - 1,
        governor.address,
        outsider.address,
        null,
        ton("0.05"),
        underpaidPayload,
    );
    expect(underpaidCreate).toHaveFailedTx<TransferNotificationForRecipient>({
        from: minter.getWalletAddress(governor.address),
        to: governor.address,
        exitCode: GovErrors.ProposalFeeTooSmall,
    });

    val invalidFee = governor.sendCreateGovernanceProposal(
        governorAdmin.address,
        2,
        1,
        null,
        null,
        0,
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

    val manualDuration = governor.sendCreateGovernanceProposal(
        governorAdmin.address,
        3,
        1,
        null,
        null,
        0,
        0,
        0,
        0,
        1000,
        { value: ton("0.05") },
    );
    expect(manualDuration).toHaveSuccessfulTx<CreateGovernanceProposal>({
        from: governorAdmin.address,
        to: governor.address,
    });
    expect(governor.getProposal(1).votingEndsAt).toEqual(2800);

    expect(governor.getNextProposalId()).toEqual(2);
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
    val (
        defaultRuntimeMaster,
        defaultRuntimeTreasury,
        defaultRuntimeValue,
    ) = governor.getWalletRuntimeExecutionConfig();
    expect(defaultRuntimeMaster).toEqual(null);
    expect(defaultRuntimeTreasury).toEqual(null);
    expect(defaultRuntimeValue).toEqual(GOVERNOR_WALLET_ROUTE_VALUE);

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

get fun `test governor counts against votes and rejects abstain side`() {
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
        null,
        0,
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
        3,
    );
    expect(abstain).toHaveFailedTx({
        from: voteWallet,
        to: governor.address,
        exitCode: GovErrors.InvalidVoteSide,
    });

    val proposal = governor.getProposal(0);
    expect(proposal.forVotes).toEqual(0);
    expect(proposal.againstVotes).toEqual(300);
    expect(proposal.abstainVotes).toEqual(0);
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

    testing.setNow(2801);
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
    testing.setNow(2801);
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

    testing.setNow(2802);
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
    testing.setNow(4603);
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
    testing.setNow(4604);
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
    testing.setNow(6405);
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
    testing.setNow(2801);
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

    testing.setNow(2802);
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
    testing.setNow(4603);
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

    testing.setNow(4604);
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
    testing.setNow(6405);
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

    testing.setNow(6406);
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
    testing.setNow(8207);
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

get fun `test governor claims minter admin and routes wallet runtime proposals`() {
    testing.setNow(1000);
    val (minter, admin, _) = setupTest();
    val governorAdmin = testing.treasury("runtime-route-admin");
    val executor = testing.treasury("runtime-route-executor");
    val voter = testing.treasury("runtime-route-voter");
    val seller = testing.treasury("runtime-route-seller");
    val dex = testing.treasury("runtime-route-dex");
    val feeTreasury = testing.treasury("runtime-route-fee-treasury");

    val sellerWallet = mintTo(minter, admin, seller.address, 3000);
    val governor = deployGovernor(minter, governorAdmin, 10);
    configureExecutionTargets(
        governor,
        governorAdmin,
        null,
        null,
        null,
        0,
    );
    configureRuntimeExecution(governor, governorAdmin, minter, feeTreasury.address);
    handOffMinterAdminToGovernor(minter, admin, governor, governorAdmin);

    val runtimeProposal = createExtendedProposal(
        governor,
        governorAdmin,
        ACTION_ROUTE_WALLET_RUNTIME,
        seller.address,
        null,
        0,
        0,
        1000,
        11,
        1100,
    );
    val runtime = executePassedProposal(
        minter,
        governor,
        executor,
        voter.address,
        runtimeProposal,
        1,
        1200,
    );
    expect(runtime).toHaveSuccessfulTx<RouteSetWalletFeeRuntime>({
        from: governor.address,
        to: minter.address,
    });
    expect(runtime).toHaveSuccessfulTx<SetWalletFeeRuntime>({
        from: minter.address,
        to: sellerWallet.address,
    });
    expect(sellerWallet.getFeeRuntime().globalSellFeeBps).toEqual(1000);

    val addDexProposal = createExtendedProposal(
        governor,
        governorAdmin,
        ACTION_ROUTE_ADD_WALLET_DEX,
        seller.address,
        dex.address,
        0,
        0,
        0,
        12,
        1400,
    );
    expect(governor.getProposal(addDexProposal).auxTarget).toEqual(dex.address);
    val addDex = executePassedProposal(
        minter,
        governor,
        executor,
        voter.address,
        addDexProposal,
        2,
        1500,
    );
    expect(addDex).toHaveSuccessfulTx<RouteAddWalletDexAddress>({
        from: governor.address,
        to: minter.address,
    });
    expect(addDex).toHaveSuccessfulTx<AddWalletDexAddress>({
        from: minter.address,
        to: sellerWallet.address,
    });
    expect(sellerWallet.isDexWallet(dex.address)).toEqual(true);

    val setSpecificProposal = createExtendedProposal(
        governor,
        governorAdmin,
        ACTION_ROUTE_SET_WALLET_SPECIFIC_FEE,
        seller.address,
        seller.address,
        0,
        0,
        2500,
        13,
        1700,
    );
    val setSpecific = executePassedProposal(
        minter,
        governor,
        executor,
        voter.address,
        setSpecificProposal,
        3,
        1800,
    );
    expect(setSpecific).toHaveSuccessfulTx<SetWalletSpecificFee>({
        from: minter.address,
        to: sellerWallet.address,
    });
    expect(sellerWallet.getWalletSpecificFee(seller.address).sellFeeBps).toEqual(2500);

    val firstSell = sellerWallet.sendTransfer(
        seller.address,
        ton("1"),
        1000,
        dex.address,
        seller.address,
        null,
        0,
        null,
    );
    expect(firstSell).toHaveSuccessfulTx<AskToTransfer>({
        from: seller.address,
        to: sellerWallet.address,
    });
    expect(userWallet(minter, dex.address).getJettonBalance()).toEqual(750);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(250);

    val clearSpecificProposal = createExtendedProposal(
        governor,
        governorAdmin,
        ACTION_ROUTE_CLEAR_WALLET_SPECIFIC_FEE,
        seller.address,
        seller.address,
        0,
        0,
        0,
        14,
        2000,
    );
    val clearSpecific = executePassedProposal(
        minter,
        governor,
        executor,
        voter.address,
        clearSpecificProposal,
        4,
        2100,
    );
    expect(clearSpecific).toHaveSuccessfulTx<ClearWalletSpecificFee>({
        from: minter.address,
        to: sellerWallet.address,
    });
    expect(sellerWallet.getWalletSpecificFee(seller.address).isSet).toEqual(false);

    val secondSell = sellerWallet.sendTransfer(
        seller.address,
        ton("1"),
        1000,
        dex.address,
        seller.address,
        null,
        0,
        null,
    );
    expect(secondSell).toHaveSuccessfulTx<AskToTransfer>({
        from: seller.address,
        to: sellerWallet.address,
    });
    expect(userWallet(minter, dex.address).getJettonBalance()).toEqual(1650);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(350);

    val removeDexProposal = createExtendedProposal(
        governor,
        governorAdmin,
        ACTION_ROUTE_REMOVE_WALLET_DEX,
        seller.address,
        dex.address,
        0,
        0,
        0,
        15,
        2300,
    );
    val removeDex = executePassedProposal(
        minter,
        governor,
        executor,
        voter.address,
        removeDexProposal,
        5,
        2400,
    );
    expect(removeDex).toHaveSuccessfulTx<RemoveWalletDexAddress>({
        from: minter.address,
        to: sellerWallet.address,
    });
    expect(sellerWallet.isDexWallet(dex.address)).toEqual(false);

    val thirdSell = sellerWallet.sendTransfer(
        seller.address,
        ton("1"),
        1000,
        dex.address,
        seller.address,
        null,
        0,
        null,
    );
    expect(thirdSell).toHaveSuccessfulTx<AskToTransfer>({
        from: seller.address,
        to: sellerWallet.address,
    });
    expect(userWallet(minter, dex.address).getJettonBalance()).toEqual(2650);
    expect(userWallet(minter, feeTreasury.address).getJettonBalance()).toEqual(350);
}

get fun `test governor rolls back runtime route proposal when master rejects it`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("runtime-bounce-admin");
    val executor = testing.treasury("runtime-bounce-executor");
    val voter = testing.treasury("runtime-bounce-voter");
    val target = testing.treasury("runtime-bounce-target");
    val feeTreasury = testing.treasury("runtime-bounce-fee-treasury");
    val governor = deployGovernor(minter, governorAdmin, 10);
    configureExecutionTargets(
        governor,
        governorAdmin,
        null,
        null,
        null,
        0,
    );
    configureRuntimeExecution(governor, governorAdmin, minter, feeTreasury.address);

    val proposalId = createExtendedProposal(
        governor,
        governorAdmin,
        ACTION_ROUTE_WALLET_RUNTIME,
        target.address,
        null,
        0,
        100,
        200,
        21,
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
    testing.setNow(2801);

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
    expect(execute).toHaveFailedTx<RouteSetWalletFeeRuntime>({
        from: governor.address,
        to: minter.address,
        exitCode: Errors.NotOwner,
    });
    expect(governor.getProposal(proposalId).executed).toEqual(false);
}

get fun `test governor executes raw treasury and event controller proposals`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("raw-exec-admin");
    val executor = testing.treasury("raw-exec-executor");
    val voter = testing.treasury("raw-exec-voter");
    val deployer = testing.treasury("raw-exec-deployer");
    val recipient = testing.treasury("raw-exec-recipient");
    val governor = deployGovernor(minter, governorAdmin, 10);
    configureExecutionTargets(
        governor,
        governorAdmin,
        null,
        null,
        null,
        0,
    );

    val treasury = TgBtcCatTreasury.fromStorage({
        governor: governor.address,
        primaryJettonWallet: null,
    });
    expect(treasury.deploy(deployer.address, { value: ton("1") })).toHaveSuccessfulDeploy({
        to: treasury.address,
    });

    val treasuryProposal = createRawProposal(
        governor,
        governorAdmin,
        treasury.address,
        ton("0.05"),
        SendTreasuryTon {
            queryId: governor.getNextProposalId(),
            recipient: recipient.address,
            amount: ton("0.2"),
            bounce: false,
        }.toCell(),
        91,
        1100,
    );
    expect(governor.getProposal(treasuryProposal).hasRawExecution).toEqual(true);
    val treasuryRaw = governor.getRawExecution(treasuryProposal);
    expect(treasuryRaw.isSet).toEqual(true);
    expect(treasuryRaw.dest).toEqual(treasury.address);
    expect(treasuryRaw.value).toEqual(ton("0.05"));
    val treasuryExec = executePassedProposal(
        minter,
        governor,
        executor,
        voter.address,
        treasuryProposal,
        1,
        1200,
    );
    expect(treasuryExec).toHaveSuccessfulTx<SendTreasuryTon>({
        from: governor.address,
        to: treasury.address,
    });
    expect(treasuryExec).toHaveSuccessfulTx<TopUpTons>({
        from: treasury.address,
        to: recipient.address,
    });

    val eventController = TgBtcCatEventController.fromStorage({
        governor: governor.address,
        nextEventId: 0,
    });
    expect(
        eventController.deploy(deployer.address, { value: ton("0.05") }),
    ).toHaveSuccessfulDeploy({
        to: eventController.address,
    });

    val eventProposal = createRawProposal(
        governor,
        governorAdmin,
        eventController.address,
        ton("0.05"),
        CreateCommunityEvent {
            queryId: governor.getNextProposalId(),
            eventKind: 1,
            metadataHash: 92,
            metadata: EventMetadata { uri: "ipfs://raw-event".prefixWith00() }.toCell(),
            startsAt: 1400,
            endsAt: 2400,
        }.toCell(),
        92,
        1500,
    );
    val eventExec = executePassedProposal(
        minter,
        governor,
        executor,
        voter.address,
        eventProposal,
        2,
        1600,
    );
    expect(eventExec).toHaveSuccessfulTx<CreateCommunityEvent>({
        from: governor.address,
        to: eventController.address,
    });
    val event = eventController.getEvent(0);
    expect(event.isSet).toEqual(true);
    expect(event.metadataHash).toEqual(92);
    expect(event.metadata!.load().uri).toEqual("ipfs://raw-event".prefixWith00());
}

get fun `test governor ops admin sweeps vote tokens and treasury funds`() {
    testing.setNow(1000);
    val (minter, minterAdmin, _) = setupTest();
    val governorAdmin = testing.treasury("ops-sweep-admin");
    val opsAdmin = testing.treasury("ops-sweep-ops");
    val outsider = testing.treasury("ops-sweep-outsider");
    val voter = testing.treasury("ops-sweep-voter");
    val recipient = testing.treasury("ops-sweep-recipient");
    val deployer = testing.treasury("ops-sweep-deployer");
    val governor = deployGovernor(minter, governorAdmin, 10);

    expect(
        governor.sendGovernanceTopUp(governorAdmin.address, { value: ton("2") }),
    ).toHaveSuccessfulTx<GovernanceTopUp>({
        from: governorAdmin.address,
        to: governor.address,
    });

    val setOps = governor.sendSetOpsAdmin(
        governorAdmin.address,
        40,
        opsAdmin.address,
        { value: ton("0.05") },
    );
    expect(setOps).toHaveSuccessfulTx<SetOpsAdmin>({
        from: governorAdmin.address,
        to: governor.address,
    });
    expect(governor.getOpsConfig().opsAdmin).toEqual(opsAdmin.address);

    val voterWallet = mintTo(minter, minterAdmin, voter.address, 2000);
    createProposal(
        governor,
        governorAdmin,
        ACTION_SET_GLOBAL_FEES,
        null,
        100,
        200,
        41,
        1100,
    );
    val votePayload = CastVotePayload {
        proposalId: 0,
        side: VOTE_SIDE_FOR,
        commentHash: 0,
    }.toCell();
    val vote = voterWallet.sendTransfer(
        voter.address,
        ton("0.3"),
        1000,
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
    val governorVoteWallet = userWallet(minter, governor.address);
    expect(governorVoteWallet.getJettonBalance()).toEqual(1000);

    val blocked = governor.sendOpsSweepVoteJettons(
        outsider.address,
        41,
        100,
        recipient.address,
        outsider.address,
        ton("0.3"),
        0,
        { value: ton("0.05") },
    );
    expect(blocked).toHaveFailedTx<OpsSweepVoteJettons>({
        from: outsider.address,
        to: governor.address,
        exitCode: GovErrors.NotOpsAdmin,
    });

    val sweep = governor.sendOpsSweepVoteJettons(
        opsAdmin.address,
        42,
        400,
        recipient.address,
        opsAdmin.address,
        ton("0.3"),
        0,
        { value: ton("0.05") },
    );
    expect(sweep).toHaveSuccessfulTx<OpsSweepVoteJettons>({
        from: opsAdmin.address,
        to: governor.address,
    });
    expect(sweep).toHaveSuccessfulTx<AskToTransfer>({
        from: governor.address,
        to: governorVoteWallet.address,
    });
    expect(governorVoteWallet.getJettonBalance()).toEqual(600);
    expect(userWallet(minter, recipient.address).getJettonBalance()).toEqual(400);

    val treasury = TgBtcCatTreasury.fromStorage({
        governor: governor.address,
        primaryJettonWallet: null,
    });
    expect(treasury.deploy(deployer.address, { value: ton("2") })).toHaveSuccessfulDeploy({
        to: treasury.address,
    });

    val sendTon = governor.sendOpsSendTreasuryTon(
        opsAdmin.address,
        43,
        treasury.address,
        ton("0.05"),
        recipient.address,
        ton("0.2"),
        false,
        { value: ton("0.05") },
    );
    expect(sendTon).toHaveSuccessfulTx<OpsSendTreasuryTon>({
        from: opsAdmin.address,
        to: governor.address,
    });
    expect(sendTon).toHaveSuccessfulTx<SendTreasuryTon>({
        from: governor.address,
        to: treasury.address,
    });
    expect(sendTon).toHaveSuccessfulTx<TopUpTons>({
        from: treasury.address,
        to: recipient.address,
    });

    val treasuryWallet = mintTo(minter, minterAdmin, treasury.address, 1000);
    val sendJettons = governor.sendOpsSendTreasuryJettons(
        opsAdmin.address,
        44,
        treasury.address,
        ton("0.05"),
        treasuryWallet.address,
        300,
        {
            transferRecipient: recipient.address,
            sendExcessesTo: treasury.address,
            walletTonAmount: ton("0.3"),
            forwardTonAmount: 0,
        },
        { value: ton("0.05") },
    );
    expect(sendJettons).toHaveSuccessfulTx<OpsSendTreasuryJettons>({
        from: opsAdmin.address,
        to: governor.address,
    });
    expect(sendJettons).toHaveSuccessfulTx<SendTreasuryJettons>({
        from: governor.address,
        to: treasury.address,
    });
    expect(sendJettons).toHaveSuccessfulTx<AskToTransfer>({
        from: treasury.address,
        to: treasuryWallet.address,
    });
    expect(treasuryWallet.getJettonBalance()).toEqual(700);
    expect(userWallet(minter, recipient.address).getJettonBalance()).toEqual(700);
}

get fun `test ops admin manages fees after mint admin is dropped`() {
    testing.setNow(1000);
    val (minter, minterAdmin, _) = setupTest();
    val governorAdmin = testing.treasury("ops-fees-admin");
    val opsAdmin = testing.treasury("ops-fees-ops");
    val deployer = testing.treasury("ops-fees-deployer");
    val walletOwner = testing.treasury("ops-fees-wallet-owner");
    val feeTreasuryA = testing.treasury("ops-fees-treasury-a");
    val feeTreasuryB = testing.treasury("ops-fees-treasury-b");
    val governor = deployGovernor(minter, governorAdmin, 10);
    val wallet = mintTo(minter, minterAdmin, walletOwner.address, 1000);

    val setOps = governor.sendSetOpsAdmin(
        governorAdmin.address,
        50,
        opsAdmin.address,
        { value: ton("0.05") },
    );
    expect(setOps).toHaveSuccessfulTx<SetOpsAdmin>({
        from: governorAdmin.address,
        to: governor.address,
    });

    val setRuntimeAdmin = minter.sendSetMinterRuntimeAdmin(
        minterAdmin.address,
        51,
        governor.address,
        { value: ton("0.05") },
    );
    expect(setRuntimeAdmin).toHaveSuccessfulTx<SetMinterRuntimeAdmin>({
        from: minterAdmin.address,
        to: minter.address,
    });
    expect(minter.getRuntimeAdminAddress()).toEqual(governor.address);

    val dropAdmin = minter.sendDropMinterAdmin(
        minterAdmin.address,
        52,
        { value: ton("0.05") },
    );
    expect(dropAdmin).toHaveSuccessfulTx<DropMinterAdmin>({
        from: minterAdmin.address,
        to: minter.address,
    });
    expect(minter.getJettonData().adminAddress).toEqual(null);
    expect(minter.getJettonData().mintable).toEqual(false);
    expect(minter.getRuntimeAdminAddress()).toEqual(governor.address);

    val feeController = TgBtcCatFeeController.fromStorage({
        governor: governor.address,
        feeTreasury: feeTreasuryA.address,
        globalBuyFeeBps: 0,
        globalSellFeeBps: 0,
    });
    expect(feeController.deploy(deployer.address, { value: ton("0.05") })).toHaveSuccessfulDeploy({
        to: feeController.address,
    });
    configureExecutionTargets(
        governor,
        governorAdmin,
        feeController.address,
        null,
        null,
        0,
    );
    configureRuntimeExecution(governor, governorAdmin, minter, feeTreasuryA.address);

    val setFeeTreasury = governor.sendOpsSetFeeTreasury(
        opsAdmin.address,
        53,
        null,
        feeTreasuryB.address,
        ton("0.05"),
        { value: ton("0.05") },
    );
    expect(setFeeTreasury).toHaveSuccessfulTx<OpsSetFeeTreasury>({
        from: opsAdmin.address,
        to: governor.address,
    });
    expect(setFeeTreasury).toHaveSuccessfulTx<SetFeeTreasury>({
        from: governor.address,
        to: feeController.address,
    });
    expect(feeController.getGlobalFees().feeTreasury).toEqual(feeTreasuryB.address);
    val (_, runtimeFeeTreasury, _) = governor.getWalletRuntimeExecutionConfig();
    expect(runtimeFeeTreasury).toEqual(feeTreasuryB.address);

    val route = governor.sendOpsRouteWalletRuntime(
        opsAdmin.address,
        54,
        null,
        walletOwner.address,
        ton("0.2"),
        GOVERNOR_WALLET_ROUTE_VALUE,
        {
            feeTreasury: feeTreasuryB.address,
            globalBuyFeeBps: 123,
            globalSellFeeBps: 456,
            isDexWallet: false,
        },
        { value: ton("0.1") },
    );
    expect(route).toHaveSuccessfulTx<OpsRouteWalletRuntime>({
        from: opsAdmin.address,
        to: governor.address,
    });
    expect(route).toHaveSuccessfulTx<RouteSetWalletFeeRuntime>({
        from: governor.address,
        to: minter.address,
    });
    expect(route).toHaveSuccessfulTx<SetWalletFeeRuntime>({
        from: minter.address,
        to: wallet.address,
    });
    val runtime = wallet.getFeeRuntime();
    expect(runtime.feeTreasury).toEqual(feeTreasuryB.address);
    expect(runtime.globalBuyFeeBps).toEqual(123);
    expect(runtime.globalSellFeeBps).toEqual(456);
}

get fun `test governor rolls back raw event proposals rejected by event controller`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("raw-event-reject-admin");
    val executor = testing.treasury("raw-event-reject-executor");
    val voter = testing.treasury("raw-event-reject-voter");
    val deployer = testing.treasury("raw-event-reject-deployer");
    val governor = deployGovernor(minter, governorAdmin, 10);
    configureExecutionTargets(
        governor,
        governorAdmin,
        null,
        null,
        null,
        0,
    );

    val eventController = TgBtcCatEventController.fromStorage({
        governor: governor.address,
        nextEventId: 0,
    });
    expect(
        eventController.deploy(deployer.address, { value: ton("0.05") }),
    ).toHaveSuccessfulDeploy({
        to: eventController.address,
    });

    val invalidKindProposal = createRawProposal(
        governor,
        governorAdmin,
        eventController.address,
        ton("0.05"),
        CreateCommunityEvent {
            queryId: governor.getNextProposalId(),
            eventKind: 0,
            metadataHash: 101,
            metadata: EventMetadata { uri: "ipfs://bad-kind".prefixWith00() }.toCell(),
            startsAt: 1100,
            endsAt: 2100,
        }.toCell(),
        101,
        1100,
    );
    val invalidKind = executePassedProposalWithTargetBounce(
        minter,
        governor,
        executor,
        voter.address,
        invalidKindProposal,
        1,
        1200,
    );
    expect(invalidKind).toHaveFailedTx<CreateCommunityEvent>({
        from: governor.address,
        to: eventController.address,
        exitCode: GovErrors.InvalidEventKind,
    });
    expect(eventController.getNextEventId()).toEqual(0);

    val invalidTimeProposal = createRawProposal(
        governor,
        governorAdmin,
        eventController.address,
        ton("0.05"),
        CreateCommunityEvent {
            queryId: governor.getNextProposalId(),
            eventKind: 1,
            metadataHash: 102,
            metadata: EventMetadata { uri: "ipfs://bad-time".prefixWith00() }.toCell(),
            startsAt: 1600,
            endsAt: 1500,
        }.toCell(),
        102,
        1400,
    );
    val invalidTime = executePassedProposalWithTargetBounce(
        minter,
        governor,
        executor,
        voter.address,
        invalidTimeProposal,
        2,
        1500,
    );
    expect(invalidTime).toHaveFailedTx<CreateCommunityEvent>({
        from: governor.address,
        to: eventController.address,
        exitCode: GovErrors.InvalidEventTime,
    });
    expect(eventController.getNextEventId()).toEqual(0);

    val validEventProposal = createRawProposal(
        governor,
        governorAdmin,
        eventController.address,
        ton("0.05"),
        CreateCommunityEvent {
            queryId: governor.getNextProposalId(),
            eventKind: 1,
            metadataHash: 103,
            metadata: EventMetadata { uri: "ipfs://valid-event".prefixWith00() }.toCell(),
            startsAt: 1700,
            endsAt: 2700,
        }.toCell(),
        103,
        1700,
    );
    val validEvent = executePassedProposal(
        minter,
        governor,
        executor,
        voter.address,
        validEventProposal,
        3,
        1800,
    );
    expect(validEvent).toHaveSuccessfulTx<CreateCommunityEvent>({
        from: governor.address,
        to: eventController.address,
    });
    expect(eventController.getEvent(0).status).toEqual(EVENT_STATUS_DRAFT);

    val invalidStatusProposal = createRawProposal(
        governor,
        governorAdmin,
        eventController.address,
        ton("0.05"),
        SetCommunityEventStatus {
            queryId: governor.getNextProposalId(),
            eventId: 0,
            status: 99,
        }.toCell(),
        104,
        2000,
    );
    val invalidStatus = executePassedProposalWithTargetBounce(
        minter,
        governor,
        executor,
        voter.address,
        invalidStatusProposal,
        4,
        2100,
    );
    expect(invalidStatus).toHaveFailedTx<SetCommunityEventStatus>({
        from: governor.address,
        to: eventController.address,
        exitCode: GovErrors.InvalidEventStatus,
    });
    expect(eventController.getEvent(0).status).toEqual(EVENT_STATUS_DRAFT);
}

get fun `test governor validates raw execution proposal body`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("raw-validation-admin");
    val target = testing.treasury("raw-validation-target");
    val governor = deployGovernor(minter, governorAdmin, 10);

    expect(governor.getRawExecution(999).isSet).toEqual(false);
    val nonRawProposal = createProposal(
        governor,
        governorAdmin,
        ACTION_SET_GLOBAL_FEES,
        null,
        0,
        0,
        0,
        1100,
    );
    expect(governor.getRawExecution(nonRawProposal).isSet).toEqual(false);

    val manualDuration = governor.sendCreateRawExecutionProposal(
        governorAdmin.address,
        1,
        target.address,
        ton("0.05"),
        SendTreasuryTon {
            queryId: governor.getNextProposalId(),
            recipient: target.address,
            amount: ton("0.1"),
            bounce: false,
        }.toCell(),
        1,
        1000,
        { value: ton("0.05") },
    );
    expect(manualDuration).toHaveSuccessfulTx<CreateRawExecutionProposal>({
        from: governorAdmin.address,
        to: governor.address,
    });
    expect(governor.getProposal(1).votingEndsAt).toEqual(2800);

    val wrongQuery = governor.sendCreateRawExecutionProposal(
        governorAdmin.address,
        2,
        target.address,
        ton("0.05"),
        SendTreasuryTon {
            queryId: 999,
            recipient: target.address,
            amount: ton("0.1"),
            bounce: false,
        }.toCell(),
        1,
        1100,
        { value: ton("0.05") },
    );
    expect(wrongQuery).toHaveFailedTx({
        from: governorAdmin.address,
        to: governor.address,
        exitCode: GovErrors.InvalidMessage,
    });

    val unknownOpcode = governor.sendCreateRawExecutionProposal(
        governorAdmin.address,
        3,
        target.address,
        ton("0.05"),
        beginCell().storeUint(0x12345678, 32).storeUint(0, 64).endCell(),
        2,
        1100,
        { value: ton("0.05") },
    );
    expect(unknownOpcode).toHaveFailedTx({
        from: governorAdmin.address,
        to: governor.address,
        exitCode: GovErrors.InvalidMessage,
    });
}

get fun `test governor rejects raw execution proposal without raw payload`() {
    testing.setNow(1000);
    val governorAdmin = testing.treasury("raw-missing-payload-admin");
    val executor = testing.treasury("raw-missing-payload-executor");
    var proposals: map<uint64, Proposal> = [];
    proposals.set(
        0,
        {
            actionType: ACTION_RAW_EXECUTION,
            target: null,
            buyFeeBps: 0,
            sellFeeBps: 0,
            reasonHash: 0,
            votingEndsAt: 900,
            forVotes: 100,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
        },
    );
    val governor = TgBtcCatGovernor.fromStorage({
        admin: governorAdmin.address,
        voteJettonWallet: randomAddress(),
        minVoteAmount: 10,
        nextProposalId: 1,
        proposals,
    });
    expect(governor.deploy(governorAdmin.address, { value: ton("0.05") })).toHaveSuccessfulDeploy({
        to: governor.address,
    });

    val execute = governor.sendExecuteProposal(
        executor.address,
        1,
        0,
        { value: ton("0.05") },
    );
    expect(execute).toHaveFailedTx({
        from: executor.address,
        to: governor.address,
        exitCode: GovErrors.ExecutionTargetMissing,
    });
}

get fun `test governor handles execution bounce query ids defensively`() {
    testing.setNow(1000);
    val (minter, _, _) = setupTest();
    val governorAdmin = testing.treasury("bounce-defensive-admin");
    val sender = testing.treasury("bounce-defensive-sender");
    val governor = deployGovernor(minter, governorAdmin, 10);

    val unknownProposalBounce = sendGovernorBouncedExecution(
        governor,
        sender.address,
        0x10010001,
        999,
    );
    expect(unknownProposalBounce).toHaveSuccessfulTx({
        from: sender.address,
        to: governor.address,
    });

    val invalidOpcodeBounce = sendGovernorBouncedExecution(
        governor,
        sender.address,
        0xdeadbeef,
        0,
    );
    expect(invalidOpcodeBounce).toHaveFailedTx({
        from: sender.address,
        to: governor.address,
        exitCode: GovErrors.InvalidMessage,
    });
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
    configureRuntimeExecution(governor, governorAdmin, minter, null);

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
    testing.setNow(governor.getProposal(missingTargetProposal).votingEndsAt + 1);
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

    val missingAuxProposal = createExtendedProposal(
        governor,
        governorAdmin,
        ACTION_ROUTE_ADD_WALLET_DEX,
        testing.treasury("missing-aux-wallet-owner").address,
        null,
        0,
        0,
        0,
        2,
        1400,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        missingAuxProposal,
        100,
        VOTE_SIDE_FOR,
    );
    testing.setNow(governor.getProposal(missingAuxProposal).votingEndsAt + 1);
    val missingAux = governor.sendExecuteProposal(
        executor.address,
        4,
        missingAuxProposal,
        { value: ton("0.05") },
    );
    expect(missingAux).toHaveFailedTx({
        from: executor.address,
        to: governor.address,
        exitCode: GovErrors.ExecutionTargetMissing,
    });

    val invalidActionProposal = createProposal(
        governor,
        governorAdmin,
        99,
        testing.treasury("invalid-action-target").address,
        0,
        0,
        3,
        1700,
    );
    voteDirect(
        minter,
        governor,
        voter.address,
        invalidActionProposal,
        100,
        VOTE_SIDE_FOR,
    );
    testing.setNow(governor.getProposal(invalidActionProposal).votingEndsAt + 1);
    val invalidAction = governor.sendExecuteProposal(
        executor.address,
        5,
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
    testing.setNow(2801);

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
    return createExtendedProposal(
        governor,
        admin,
        actionType,
        target,
        null,
        0,
        buyFeeBps,
        sellFeeBps,
        reasonHash,
        votingEndsAt,
    );
}

fun createExtendedProposal(
    governor: TgBtcCatGovernor,
    admin: Treasury,
    actionType: uint8,
    target: address?,
    auxTarget: address?,
    flags: uint8,
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
        auxTarget,
        flags,
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

fun createRawProposal(
    governor: TgBtcCatGovernor,
    admin: Treasury,
    dest: address,
    value: coins,
    body: cell,
    reasonHash: uint256,
    votingEndsAt: uint32,
): uint64 {
    val proposalId = governor.getNextProposalId();
    val create = governor.sendCreateRawExecutionProposal(
        admin.address,
        proposalId,
        dest,
        value,
        body,
        reasonHash,
        votingEndsAt,
        { value: ton("0.05") },
    );
    expect(create).toHaveSuccessfulTx<CreateRawExecutionProposal>({
        from: admin.address,
        to: governor.address,
    });
    return proposalId;
}

fun configureRuntimeExecution(
    governor: TgBtcCatGovernor,
    admin: Treasury,
    minter: TgBtcCatJettonMaster,
    feeTreasury: address?,
) {
    val executionValue = governor.sendSetExecutionValue(
        admin.address,
        20,
        GOVERNOR_MASTER_ROUTE_VALUE,
        { value: ton("0.05") },
    );
    expect(executionValue).toHaveSuccessfulTx<SetExecutionValue>({
        from: admin.address,
        to: governor.address,
    });

    val runtime = governor.sendSetWalletRuntimeExecution(
        admin.address,
        21,
        minter.address,
        feeTreasury,
        GOVERNOR_WALLET_ROUTE_VALUE,
        { value: ton("0.05") },
    );
    expect(runtime).toHaveSuccessfulTx<SetWalletRuntimeExecution>({
        from: admin.address,
        to: governor.address,
    });

    val (
        jettonMaster,
        configuredFeeTreasury,
        walletRouteValue,
    ) = governor.getWalletRuntimeExecutionConfig();
    expect(jettonMaster).toEqual(minter.address);
    expect(configuredFeeTreasury).toEqual(feeTreasury);
    expect(walletRouteValue).toEqual(GOVERNOR_WALLET_ROUTE_VALUE);
}

fun handOffMinterAdminToGovernor(
    minter: TgBtcCatJettonMaster,
    admin: Treasury,
    governor: TgBtcCatGovernor,
    governorAdmin: Treasury,
) {
    val change = minter.sendChangeMinterAdmin(
        admin.address,
        30,
        governor.address,
        { value: ton("0.05") },
    );
    expect(change).toHaveSuccessfulTx<ChangeMinterAdmin>({
        from: admin.address,
        to: minter.address,
    });
    expect(minter.getNextAdminAddress()).toEqual(governor.address);

    val claim = governor.sendClaimJettonMasterAdmin(
        governorAdmin.address,
        31,
        minter.address,
        ton("0.05"),
        { value: ton("0.1") },
    );
    expect(claim).toHaveSuccessfulTx<ClaimJettonMasterAdmin>({
        from: governorAdmin.address,
        to: governor.address,
    });
    expect(claim).toHaveSuccessfulTx<ClaimMinterAdmin>({
        from: governor.address,
        to: minter.address,
    });
    expect(minter.getJettonData().adminAddress).toEqual(governor.address);
}

fun executePassedProposal(
    minter: TgBtcCatJettonMaster,
    governor: TgBtcCatGovernor,
    executor: Treasury,
    voter: address,
    proposalId: uint64,
    queryId: uint64,
    executeAt: uint32,
): SendResultList {
    voteDirect(
        minter,
        governor,
        voter,
        proposalId,
        100,
        VOTE_SIDE_FOR,
    );
    val proposal = governor.getProposal(proposalId);
    var executeNow = proposal.votingEndsAt + 1;
    if (executeAt > executeNow) {
        executeNow = executeAt;
    }
    testing.setNow(executeNow);
    val execute = governor.sendExecuteProposal(
        executor.address,
        queryId,
        proposalId,
        { value: ton("0.05") },
    );
    expect(execute).toHaveSuccessfulTx<ExecuteProposal>({
        from: executor.address,
        to: governor.address,
    });
    expect(governor.getProposal(proposalId).executed).toEqual(true);
    return execute;
}

fun executePassedProposalWithTargetBounce(
    minter: TgBtcCatJettonMaster,
    governor: TgBtcCatGovernor,
    executor: Treasury,
    voter: address,
    proposalId: uint64,
    queryId: uint64,
    executeAt: uint32,
): SendResultList {
    voteDirect(
        minter,
        governor,
        voter,
        proposalId,
        100,
        VOTE_SIDE_FOR,
    );
    val proposal = governor.getProposal(proposalId);
    var executeNow = proposal.votingEndsAt + 1;
    if (executeAt > executeNow) {
        executeNow = executeAt;
    }
    testing.setNow(executeNow);
    val execute = governor.sendExecuteProposal(
        executor.address,
        queryId,
        proposalId,
        { value: ton("0.05") },
    );
    expect(execute).toHaveSuccessfulTx<ExecuteProposal>({
        from: executor.address,
        to: governor.address,
    });
    expect(governor.getProposal(proposalId).executed).toEqual(false);
    return execute;
}

fun sendGovernorBouncedExecution(
    governor: TgBtcCatGovernor,
    from: address,
    opcode: uint32,
    queryId: uint64,
): SendResultList {
    val bouncedBody = beginCell()
        .storeUint(0xffffffff, 32)
        .storeUint(opcode, 32)
        .storeUint(queryId, 64)
        .endCell();
    val bouncedMsg = createMessage({
        bounce: false,
        value: ton("0.05"),
        dest: governor.address,
        body: bouncedBody,
    }).bounced();
    return net.send(from, bouncedMsg);
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
