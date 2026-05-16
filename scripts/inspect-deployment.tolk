import "@acton/env"
import "@acton/io"

import "@wrappers/TgBtcCatFeeController.gen"
import "@wrappers/TgBtcCatGovernor.gen"
import "@wrappers/TgBtcCatJettonMaster.gen"
import "@wrappers/TgBtcCatJettonWallet.gen"
import "@wrappers/utils"

fun printWalletBalance(label: string, minter: TgBtcCatJettonMaster, owner: address) {
    val wallet = TgBtcCatJettonWallet.fromAddress(minter.getWalletAddress(owner));
    println("{} owner {}", label, owner);
    println("{} wallet {}", label, wallet.address);
    println("{} balance {}", label, wallet.getJettonBalance());
}

fun main() {
    val governorAddress = env<address>("TGBTCAT_GOVERNOR_ADDRESS");
    val jettonMasterAddress = env<address>("TGBTCAT_JETTON_MASTER_ADDRESS");
    val feeControllerAddress = env<address>("TGBTCAT_FEE_CONTROLLER_ADDRESS");
    val deployerAddress = env<address>("TGBTCAT_DEPLOYER_ADDRESS");
    val feeTreasuryAddress = env<address>("TGBTCAT_FEE_TREASURY_ADDRESS");

    val governor = TgBtcCatGovernor.fromAddress(governorAddress!);
    val minter = TgBtcCatJettonMaster.fromAddress(jettonMasterAddress!);
    val feeController = TgBtcCatFeeController.fromAddress(feeControllerAddress!);

    val (voteJettonWallet, minVoteAmount, governorAdmin) = governor.getVoteConfig();
    val (
        walletRuntimeMaster,
        walletRuntimeTreasury,
        walletRouteValue,
    ) = governor.getWalletRuntimeExecutionConfig();
    val fees = feeController.getGlobalFees();

    println("governor {}", governorAddress!);
    println("jetton master {}", jettonMasterAddress!);
    println("total supply {}", minter.getTotalSupply());
    println("minter admin {}", minter.getAdminAddress());
    println("next proposal id {}", governor.getNextProposalId());
    println("vote jetton wallet {}", voteJettonWallet);
    println("minimum vote amount {}", minVoteAmount);
    println("governor admin {}", governorAdmin);
    println("wallet runtime master {}", walletRuntimeMaster);
    println("wallet runtime treasury {}", walletRuntimeTreasury);
    println("wallet runtime route value {}", walletRouteValue);
    println("global buy fee bps {}", fees.buyFeeBps);
    println("global sell fee bps {}", fees.sellFeeBps);
    println("fee treasury {}", fees.feeTreasury);

    printWalletBalance("deployer", minter, deployerAddress!);
    printWalletBalance("fee treasury", minter, feeTreasuryAddress!);
}
