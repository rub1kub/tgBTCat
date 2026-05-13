import "governance-types"
import "messages"

contract TgBtcCatGovernor {
    author: "rub1kub"
    version: "1.0.0"
    description: "TG BTC Cat irreversible treasury-to-vote governor"
    storage: GovernorStorage
    incomingMessages: GovernorMessage
}

type GovernorMessage =
    | CreateGovernanceProposal
    | SetVoteJettonWallet
    | SetMinimumVoteAmount
    | SetExecutionTargets
    | SetGovernanceQuorum
    | SetExecutionValue
    | ExecuteProposal
    | TransferNotificationForRecipient
    | GovernanceTopUp

type ExecutionBounceMessage =
    | SetGlobalFees
    | SetWalletFees
    | ClearWalletFees
    | AddDexWallet
    | RemoveDexWallet

fun requireExecutionTarget(target: address?): address {
    assert (target != null) throw GovErrors.ExecutionTargetMissing;
    return target!;
}

fun requireProposalTarget(target: address?): address {
    assert (target != null) throw GovErrors.ExecutionTargetMissing;
    return target!;
}

fun assertProposalPassed(proposal: Proposal, minQuorumVotes: coins) {
    val totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
    assert (totalVotes >= minQuorumVotes) throw GovErrors.ProposalRejected;
    assert (proposal.forVotes > proposal.againstVotes) throw GovErrors.ProposalRejected;
}

fun parseVotePayloadCell(payload: cell): CastVotePayload {
    var payloadSlice = payload.beginParse();
    if (
        payloadSlice.remainingBitsCount() == 1 && payloadSlice.preloadUint(1) == 1 &&
        payloadSlice.remainingRefsCount() == 1
    ) {
        payloadSlice.loadUint(1);
        val nestedPayload = payloadSlice.loadRef();
        payloadSlice.assertEnd();
        return CastVotePayload.fromCell(
            nestedPayload,
            { throwIfOpcodeDoesNotMatch: GovErrors.InvalidVotePayload },
        );
    }

    return CastVotePayload.fromCell(
        payload,
        { throwIfOpcodeDoesNotMatch: GovErrors.InvalidVotePayload },
    );
}

fun parseVotePayload(forwardPayload: ForwardPayloadRemainder): CastVotePayload {
    var payloadSlice = forwardPayload;
    val payloadRef = payloadSlice.loadMaybeRef();
    if (payloadRef != null) {
        payloadSlice.assertEnd();
        return parseVotePayloadCell(payloadRef);
    }

    return CastVotePayload.fromSlice(
        payloadSlice,
        { throwIfOpcodeDoesNotMatch: GovErrors.InvalidVotePayload },
    );
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy GovernorMessage.fromSlice(in.body);

    match (msg) {
        CreateGovernanceProposal => {
            var storage = lazy GovernorStorage.load();
            assertGovernor(in.senderAddress, storage.admin);
            assertFeeBps(msg.buyFeeBps);
            assertFeeBps(msg.sellFeeBps);
            assert (msg.votingEndsAt > blockchain.now()) throw GovErrors.VotingClosed;

            val proposalId = storage.nextProposalId;
            storage.nextProposalId += 1;
            storage
                .proposals
                .set(
                    proposalId,
                    {
                        actionType: msg.actionType,
                        target: msg.target,
                        buyFeeBps: msg.buyFeeBps,
                        sellFeeBps: msg.sellFeeBps,
                        reasonHash: msg.reasonHash,
                        votingEndsAt: msg.votingEndsAt,
                        forVotes: 0,
                        againstVotes: 0,
                        abstainVotes: 0,
                        executed: false,
                    },
                );
            storage.save();
        }

        TransferNotificationForRecipient => {
            var storage = lazy GovernorStorage.load();
            assert (
                in.senderAddress == storage.voteJettonWallet
            ) throw GovErrors.NotVoteJettonWallet;
            assert (msg.jettonAmount >= storage.minVoteAmount) throw GovErrors.VoteTooSmall;

            val vote = parseVotePayload(msg.forwardPayload);
            assertVoteSide(vote.side);

            val proposalResult = storage.proposals.get(vote.proposalId);
            assert (proposalResult.isFound) throw GovErrors.UnknownProposal;
            var proposal = proposalResult.loadValue();
            assert (blockchain.now() <= proposal.votingEndsAt) throw GovErrors.VotingClosed;

            if (vote.side == VOTE_SIDE_FOR) {
                proposal.forVotes += msg.jettonAmount;
            } else if (vote.side == VOTE_SIDE_AGAINST) {
                proposal.againstVotes += msg.jettonAmount;
            } else {
                proposal.abstainVotes += msg.jettonAmount;
            }

            storage.proposals.set(vote.proposalId, proposal);
            storage.save();
        }

        SetVoteJettonWallet => {
            var storage = lazy GovernorStorage.load();
            assertGovernor(in.senderAddress, storage.admin);
            storage.voteJettonWallet = msg.voteJettonWallet;
            storage.save();
        }

        SetMinimumVoteAmount => {
            var storage = lazy GovernorStorage.load();
            assertGovernor(in.senderAddress, storage.admin);
            storage.minVoteAmount = msg.minVoteAmount;
            storage.save();
        }

        SetExecutionTargets => {
            var storage = lazy GovernorStorage.load();
            assertGovernor(in.senderAddress, storage.admin);
            var config = storage.loadExecutionConfig();
            config.targets = GovernorExecutionTargets {
                feeController: msg.feeController,
                walletFeeRegistry: msg.walletFeeRegistry,
                dexRegistry: msg.dexRegistry,
            }.toCell();
            storage.executionConfig = config.toCell();
            storage.save();
        }

        SetGovernanceQuorum => {
            var storage = lazy GovernorStorage.load();
            assertGovernor(in.senderAddress, storage.admin);
            var config = storage.loadExecutionConfig();
            config.minQuorumVotes = msg.minQuorumVotes;
            storage.executionConfig = config.toCell();
            storage.save();
        }

        SetExecutionValue => {
            var storage = lazy GovernorStorage.load();
            assertGovernor(in.senderAddress, storage.admin);
            var config = storage.loadExecutionConfig();
            config.executionValue = msg.executionValue;
            storage.executionConfig = config.toCell();
            storage.save();
        }

        ExecuteProposal => {
            var storage = lazy GovernorStorage.load();
            val config = storage.loadExecutionConfig();
            val targets = config.loadTargets();
            val proposalResult = storage.proposals.get(msg.proposalId);
            assert (proposalResult.isFound) throw GovErrors.UnknownProposal;
            var proposal = proposalResult.loadValue();
            assert (blockchain.now() > proposal.votingEndsAt) throw GovErrors.VotingOpen;
            assert (!proposal.executed) throw GovErrors.ProposalAlreadyExecuted;
            assertProposalPassed(proposal, config.minQuorumVotes);

            if (proposal.actionType == ACTION_SET_GLOBAL_FEES) {
                val feeController = requireExecutionTarget(targets.feeController);
                proposal.executed = true;
                storage.proposals.set(msg.proposalId, proposal);
                storage.save();
                val executeMsg = createMessage({
                    bounce: BounceMode.Only256BitsOfBody,
                    dest: feeController,
                    value: config.executionValue,
                    body: SetGlobalFees {
                        queryId: msg.proposalId,
                        buyFeeBps: proposal.buyFeeBps,
                        sellFeeBps: proposal.sellFeeBps,
                    },
                });
                executeMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
            } else if (proposal.actionType == ACTION_SET_WALLET_FEES) {
                val walletFeeRegistry = requireExecutionTarget(targets.walletFeeRegistry);
                val target = requireProposalTarget(proposal.target);
                proposal.executed = true;
                storage.proposals.set(msg.proposalId, proposal);
                storage.save();
                val executeMsg = createMessage({
                    bounce: BounceMode.Only256BitsOfBody,
                    dest: walletFeeRegistry,
                    value: config.executionValue,
                    body: SetWalletFees {
                        queryId: msg.proposalId,
                        target,
                        buyFeeBps: proposal.buyFeeBps,
                        sellFeeBps: proposal.sellFeeBps,
                        reasonHash: proposal.reasonHash,
                    },
                });
                executeMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
            } else if (proposal.actionType == ACTION_CLEAR_WALLET_FEES) {
                val walletFeeRegistry = requireExecutionTarget(targets.walletFeeRegistry);
                val target = requireProposalTarget(proposal.target);
                proposal.executed = true;
                storage.proposals.set(msg.proposalId, proposal);
                storage.save();
                val executeMsg = createMessage({
                    bounce: BounceMode.Only256BitsOfBody,
                    dest: walletFeeRegistry,
                    value: config.executionValue,
                    body: ClearWalletFees {
                        queryId: msg.proposalId,
                        target,
                    },
                });
                executeMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
            } else if (proposal.actionType == ACTION_ADD_DEX_WALLET) {
                val dexRegistry = requireExecutionTarget(targets.dexRegistry);
                val wallet = requireProposalTarget(proposal.target);
                proposal.executed = true;
                storage.proposals.set(msg.proposalId, proposal);
                storage.save();
                val executeMsg = createMessage({
                    bounce: BounceMode.Only256BitsOfBody,
                    dest: dexRegistry,
                    value: config.executionValue,
                    body: AddDexWallet {
                        queryId: msg.proposalId,
                        wallet,
                    },
                });
                executeMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
            } else if (proposal.actionType == ACTION_REMOVE_DEX_WALLET) {
                val dexRegistry = requireExecutionTarget(targets.dexRegistry);
                val wallet = requireProposalTarget(proposal.target);
                proposal.executed = true;
                storage.proposals.set(msg.proposalId, proposal);
                storage.save();
                val executeMsg = createMessage({
                    bounce: BounceMode.Only256BitsOfBody,
                    dest: dexRegistry,
                    value: config.executionValue,
                    body: RemoveDexWallet {
                        queryId: msg.proposalId,
                        wallet,
                    },
                });
                executeMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
            } else {
                throw GovErrors.InvalidActionType;
            }
        }

        GovernanceTopUp => {
            // accept tons
        }

        else => {
            assert (in.body.isEmpty()) throw GovErrors.InvalidMessage;
        }
    }
}

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();
    val msg = lazy ExecutionBounceMessage.fromSlice(in.bouncedBody);
    val proposalId = match (msg) {
        SetGlobalFees => msg.queryId,
        SetWalletFees => msg.queryId,
        ClearWalletFees => msg.queryId,
        AddDexWallet => msg.queryId,
        RemoveDexWallet => msg.queryId,
    };

    var storage = lazy GovernorStorage.load();
    val proposalResult = storage.proposals.get(proposalId);
    if (proposalResult.isFound) {
        var proposal = proposalResult.loadValue();
        proposal.executed = false;
        storage.proposals.set(proposalId, proposal);
        storage.save();
    }
}

get fun get_proposal(proposalId: uint64): ProposalReply {
    val storage = lazy GovernorStorage.load();
    val proposalResult = storage.proposals.get(proposalId);
    if (!proposalResult.isFound) {
        return {
            isSet: false,
            actionType: 0,
            target: null,
            buyFeeBps: 0,
            sellFeeBps: 0,
            reasonHash: 0,
            votingEndsAt: 0,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
        };
    }

    val proposal = proposalResult.loadValue();
    return {
        isSet: true,
        actionType: proposal.actionType,
        target: proposal.target,
        buyFeeBps: proposal.buyFeeBps,
        sellFeeBps: proposal.sellFeeBps,
        reasonHash: proposal.reasonHash,
        votingEndsAt: proposal.votingEndsAt,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
        executed: proposal.executed,
    };
}

get fun get_next_proposal_id(): uint64 {
    val storage = lazy GovernorStorage.load();
    return storage.nextProposalId;
}

get fun get_vote_config(): (address, coins, address) {
    val storage = lazy GovernorStorage.load();
    return (storage.voteJettonWallet, storage.minVoteAmount, storage.admin);
}

get fun get_execution_config(): (address?, address?, address?, coins, coins) {
    val storage = lazy GovernorStorage.load();
    val config = storage.loadExecutionConfig();
    val targets = config.loadTargets();
    return (
        targets.feeController,
        targets.walletFeeRegistry,
        targets.dexRegistry,
        config.minQuorumVotes,
        config.executionValue,
    );
}
