import "@acton/env"
import "@acton/io"

import "@acton/emulation/network"
import "@acton/emulation/scripts"
import "@wrappers/TgBtcCatFeeController.gen"
import "@wrappers/TgBtcCatGovernor.gen"
import "@wrappers/TgBtcCatWalletFeeRegistry.gen"

fun waitFor(label: string, result: SendResultList): bool {
    if (result.waitForFirstTransaction() == null) {
        println("{}: no transaction was included", label);
        return false;
    }

    println("{}: ok", label);
    return true;
}

fun main() {
    val executorWalletName = env<string>("TGBTCAT_DEPLOYER_WALLET") ?? "tgbtcat_script_deployer";
    val proposalId = env<int>("TGBTCAT_PROPOSAL_ID") ?? 0;
    val governorAddress = env<address>("TGBTCAT_GOVERNOR_ADDRESS") ??
    address("kQA1GaTDOvM36bPDcBl8j1t1XAwzxTaAuNqrr0K2fRYMm5Vc");
    val feeControllerAddress = env<address>("TGBTCAT_FEE_CONTROLLER_ADDRESS") ??
    address("kQAe6eyIysCucV94ZOE4n62Cn8_NRqRT0FwnmITXxi4_g1vu");
    val walletFeeRegistryAddress = env<address>("TGBTCAT_WALLET_FEE_REGISTRY_ADDRESS");
    val walletFeeTarget = env<address>("TGBTCAT_WALLET_FEE_TARGET");
    val executeValue = env<int>("TGBTCAT_EXECUTE_VALUE") ?? 150000000;

    val executor = scripts.wallet(executorWalletName);
    val governor = TgBtcCatGovernor.fromAddress(governorAddress);
    val feeController = TgBtcCatFeeController.fromAddress(feeControllerAddress);

    if (
        !waitFor(
            "execute proposal",
            governor.sendExecuteProposal(
                executor.address,
                1000 + proposalId,
                proposalId as uint64,
                { value: executeValue },
            ),
        )
    ) {
        return;
    }

    val proposal = governor.getProposal(proposalId as uint64);
    val fees = feeController.getGlobalFees();
    println("proposal executed {}", proposal.executed);
    println("global buy fee bps {}", fees.buyFeeBps);
    println("global sell fee bps {}", fees.sellFeeBps);

    if (walletFeeRegistryAddress != null && walletFeeTarget != null) {
        val walletFeeRegistry = TgBtcCatWalletFeeRegistry.fromAddress(
            walletFeeRegistryAddress!,
        );
        val walletFees = walletFeeRegistry.getWalletFees(walletFeeTarget!);
        println("wallet fee target {}", walletFeeTarget!);
        println("wallet fee is set {}", walletFees.isSet);
        println("wallet buy fee bps {}", walletFees.buyFeeBps);
        println("wallet sell fee bps {}", walletFees.sellFeeBps);
    }
}
