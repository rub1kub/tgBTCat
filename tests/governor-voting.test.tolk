import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"

import "@contracts/governance-types"
import "@contracts/messages"
import "@wrappers/TgBtcCatGovernor.gen"
import "@wrappers/TgBtcCatJettonMaster.gen"
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
