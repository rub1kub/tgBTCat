import "@acton/env"
import "@acton/io"

import "@acton/emulation/network"
import "@acton/emulation/scripts"
import "@contracts/governance-types"
import "@wrappers/TgBtcCatGovernor.gen"
import "@wrappers/TgBtcCatJettonMaster.gen"
import "@wrappers/TgBtcCatJettonWallet.gen"
import "@wrappers/utils"

const CREATE_FEE = 1000000000000
const VOTE_AMOUNT = 100000000000

fun waitFor(label: string, result: SendResultList): bool {
    if (result.waitForFirstTransaction() == null) {
        println("{}: no transaction was included", label);
        return false;
    }

    println("{}: ok", label);
    return true;
}

fun main() {
    val voterWalletName = env<string>("TGBTCAT_DEPLOYER_WALLET") ?? "tgbtcat_script_deployer";
    val governorAddress = env<address>("TGBTCAT_GOVERNOR_ADDRESS") ??
    address("kQA1GaTDOvM36bPDcBl8j1t1XAwzxTaAuNqrr0K2fRYMm5Vc");
    val jettonMasterAddress = env<address>("TGBTCAT_JETTON_MASTER_ADDRESS") ??
    address("kQBmTqJHA8NBgpBu4tNXHwcOSEQKSTiPsDKZoZ0HVOR0xZlo");
    val actionType = env<int>("TGBTCAT_ACTION_TYPE") ?? ACTION_SET_GLOBAL_FEES;
    val proposalTarget = env<address>("TGBTCAT_PROPOSAL_TARGET");
    val proposalAuxTarget = env<address>("TGBTCAT_PROPOSAL_AUX_TARGET");
    val buyFeeBps = env<int>("TGBTCAT_TEST_BUY_FEE_BPS") ?? 111;
    val sellFeeBps = env<int>("TGBTCAT_TEST_SELL_FEE_BPS") ?? 222;
    val voteWalletTopUp = env<int>("TGBTCAT_VOTE_WALLET_TOP_UP") ?? 200000000;
    val transferValue = env<int>("TGBTCAT_TRANSFER_VALUE") ?? 700000000;
    val forwardValue = env<int>("TGBTCAT_FORWARD_VALUE") ?? 100000000;

    val voter = scripts.wallet(voterWalletName);
    val governor = TgBtcCatGovernor.fromAddress(governorAddress);
    val jettonMaster = TgBtcCatJettonMaster.fromAddress(jettonMasterAddress);
    val (voteJettonWalletAddress, _, _) = governor.getVoteConfig();
    val voteJettonWallet = TgBtcCatJettonWallet.fromAddress(voteJettonWalletAddress);
    val voterJettonWallet = TgBtcCatJettonWallet.fromAddress(
        jettonMaster.getWalletAddress(voter.address),
    );
    val proposalId = governor.getNextProposalId();
    val votingEndsAt = blockchain.now() + FIXED_VOTING_DURATION_SECONDS;

    println("voter {}", voter.address);
    println("voter jetton wallet {}", voterJettonWallet.address);
    println("governor vote jetton wallet {}", voteJettonWallet.address);
    println("proposal id {}", proposalId);
    println("fixed voting duration seconds {}", FIXED_VOTING_DURATION_SECONDS);
    println("voting ends at {}", votingEndsAt);

    if (
        !waitFor(
            "top up governor vote jetton wallet",
            voteJettonWallet.sendTopUpTons(voter.address, { value: voteWalletTopUp }),
        )
    ) {
        return;
    }

    val createPayload = CreateGovernanceProposal {
        queryId: proposalId,
        actionType: actionType as uint8,
        target: proposalTarget,
        auxTarget: proposalAuxTarget,
        flags: 0,
        buyFeeBps: buyFeeBps as uint16,
        sellFeeBps: sellFeeBps as uint16,
        reasonHash: 0,
        votingEndsAt: votingEndsAt as uint32,
    }.toCell();

    if (
        !waitFor(
            "create proposal by jetton transfer",
            voterJettonWallet.sendTransfer(
                voter.address,
                transferValue,
                CREATE_FEE,
                governor.address,
                voter.address,
                null,
                forwardValue,
                createPayload,
            ),
        )
    ) {
        return;
    }

    val votePayload = CastVotePayload {
        proposalId,
        side: VOTE_SIDE_FOR,
        commentHash: 0,
    }.toCell();

    if (
        !waitFor(
            "cast vote by jetton transfer",
            voterJettonWallet.sendTransfer(
                voter.address,
                transferValue,
                VOTE_AMOUNT,
                governor.address,
                voter.address,
                null,
                forwardValue,
                votePayload,
            ),
        )
    ) {
        return;
    }

    val proposal = governor.getProposal(proposalId);
    println("proposal is set {}", proposal.isSet);
    println("proposal buy fee bps {}", proposal.buyFeeBps);
    println("proposal sell fee bps {}", proposal.sellFeeBps);
    println("proposal for votes {}", proposal.forVotes);
    println("proposal against votes {}", proposal.againstVotes);
}
