import "@stdlib/strings"
import "@acton/io"

import "@acton/emulation/network"
import "@acton/emulation/scripts"
import "@contracts/governance-types"
import "@contracts/storage"
import "@wrappers/TgBtcCatDexRegistry.gen"
import "@wrappers/TgBtcCatEventController.gen"
import "@wrappers/TgBtcCatFeeController.gen"
import "@wrappers/TgBtcCatGovernor.gen"
import "@wrappers/TgBtcCatJettonMaster.gen"
import "@wrappers/TgBtcCatTreasury.gen"
import "@wrappers/TgBtcCatWalletFeeRegistry.gen"
import "@wrappers/utils"

const DEFAULT_GOVERNOR_EXECUTION_VALUE = 500000000
const DEFAULT_WALLET_ROUTE_VALUE = 120000000

fun buildMetadata(metadataUri: string): cell {
    var metadata: OnchainMetadataReply = { contentDict: [] };
    metadata.contentDict.set("uri".sha256(), metadataUri.prefixWith00());
    return metadata.toCell();
}

fun waitFor(label: string, result: SendResultList): bool {
    if (result.waitForFirstTransaction() == null) {
        println("{}: no transaction was included", label);
        return false;
    }

    println("{}: ok", label);
    return true;
}

fun main() {
    val metadataUri = "https://tgbtcat.fun/metadata/jetton.json";
    val initialSupply = 0;
    val minVoteAmount = 1;
    val minQuorumVotes = 0;
    val handoffMinterAdmin = false;

    val deployer = scripts.wallet("tgbtcat_ops_admin");
    val feeTreasury = scripts.wallet("tgbtcat_fee_treasury");

    val governor = TgBtcCatGovernor.fromStorage({
        admin: deployer.address,
        voteJettonWallet: deployer.address,
        minVoteAmount,
        nextProposalId: 0,
    });
    val minter = TgBtcCatJettonMaster.fromStorage({
        totalSupply: 0,
        adminAddress: deployer.address,
        nextAdminAddress: null,
        metadata: buildMetadata(metadataUri),
    });
    val feeController = TgBtcCatFeeController.fromStorage({
        governor: governor.address,
        feeTreasury: feeTreasury.address,
        globalBuyFeeBps: 0,
        globalSellFeeBps: 0,
    });
    val walletFeeRegistry = TgBtcCatWalletFeeRegistry.fromStorage({
        governor: governor.address,
    });
    val dexRegistry = TgBtcCatDexRegistry.fromStorage({
        governor: governor.address,
    });
    val treasury = TgBtcCatTreasury.fromStorage({
        governor: governor.address,
        primaryJettonWallet: null,
    });
    val eventController = TgBtcCatEventController.fromStorage({
        governor: governor.address,
        nextEventId: 0,
    });

    println("TG BTC Cat deployer {}", deployer.address);
    println("fee treasury {}", feeTreasury.address);
    println("metadata uri {}", metadataUri);

    if (!scripts.isContractDeployed(governor.address)) {
        if (!waitFor("deploy governor", governor.deploy(deployer.address, { value: ton("0.1") }))) {
            return;
        }
    } else {
        println("deploy governor: already deployed");
    }

    if (!scripts.isContractDeployed(minter.address)) {
        if (
            !waitFor(
                "deploy jetton master",
                minter.sendDeploy(deployer.address, { value: ton("0.2") }),
            )
        ) {
            return;
        }
    } else {
        println("deploy jetton master: already deployed");
    }

    if (!scripts.isContractDeployed(feeController.address)) {
        if (
            !waitFor(
                "deploy fee controller",
                feeController.deploy(deployer.address, { value: ton("0.05") }),
            )
        ) {
            return;
        }
    } else {
        println("deploy fee controller: already deployed");
    }

    if (!scripts.isContractDeployed(walletFeeRegistry.address)) {
        if (
            !waitFor(
                "deploy wallet fee registry",
                walletFeeRegistry.deploy(deployer.address, { value: ton("0.05") }),
            )
        ) {
            return;
        }
    } else {
        println("deploy wallet fee registry: already deployed");
    }

    if (!scripts.isContractDeployed(dexRegistry.address)) {
        if (
            !waitFor(
                "deploy dex registry",
                dexRegistry.deploy(deployer.address, { value: ton("0.05") }),
            )
        ) {
            return;
        }
    } else {
        println("deploy dex registry: already deployed");
    }

    if (!scripts.isContractDeployed(treasury.address)) {
        if (
            !waitFor(
                "deploy treasury",
                treasury.deploy(deployer.address, { value: ton("0.2") }),
            )
        ) {
            return;
        }
    } else {
        println("deploy treasury: already deployed");
    }

    if (!scripts.isContractDeployed(eventController.address)) {
        if (
            !waitFor(
                "deploy event controller",
                eventController.deploy(deployer.address, { value: ton("0.05") }),
            )
        ) {
            return;
        }
    } else {
        println("deploy event controller: already deployed");
    }

    val voteJettonWallet = minter.getWalletAddress(governor.address);
    if (
        !waitFor(
            "configure governor vote wallet",
            governor.sendSetVoteJettonWallet(
                deployer.address,
                1,
                voteJettonWallet,
                { value: ton("0.05") },
            ),
        )
    ) {
        return;
    }

    if (
        !waitFor(
            "configure governor execution targets",
            governor.sendSetExecutionTargets(
                deployer.address,
                2,
                feeController.address,
                walletFeeRegistry.address,
                dexRegistry.address,
                { value: ton("0.05") },
            ),
        )
    ) {
        return;
    }

    if (
        !waitFor(
            "configure governor quorum",
            governor.sendSetGovernanceQuorum(
                deployer.address,
                3,
                minQuorumVotes,
                { value: ton("0.05") },
            ),
        )
    ) {
        return;
    }

    if (
        !waitFor(
            "configure governor execution value",
            governor.sendSetExecutionValue(
                deployer.address,
                4,
                DEFAULT_GOVERNOR_EXECUTION_VALUE,
                { value: ton("0.05") },
            ),
        )
    ) {
        return;
    }

    if (
        !waitFor(
            "configure governor wallet runtime execution",
            governor.sendSetWalletRuntimeExecution(
                deployer.address,
                5,
                minter.address,
                feeTreasury.address,
                DEFAULT_WALLET_ROUTE_VALUE,
                { value: ton("0.05") },
            ),
        )
    ) {
        return;
    }

    if (
        !waitFor(
            "top up governor execution balance",
            governor.sendGovernanceTopUp(deployer.address, { value: ton("2") }),
        )
    ) {
        return;
    }

    if (initialSupply != 0) {
        if (
            !waitFor(
                "mint initial supply to deployer",
                minter.sendMint(
                    deployer.address,
                    deployer.address,
                    initialSupply,
                    0,
                    ton("0.3"),
                ),
            )
        ) {
            return;
        }
    }

    if (handoffMinterAdmin) {
        if (
            !waitFor(
                "set governor as next minter admin",
                minter.sendChangeMinterAdmin(
                    deployer.address,
                    6,
                    governor.address,
                    { value: ton("0.05") },
                ),
            )
        ) {
            return;
        }

        if (
            !waitFor(
                "governor claims minter admin",
                governor.sendClaimJettonMasterAdmin(
                    deployer.address,
                    7,
                    minter.address,
                    ton("0.05"),
                    { value: ton("0.1") },
                ),
            )
        ) {
            return;
        }
    }

    println("governor {}", governor.address);
    println("jetton master {}", minter.address);
    println("governor vote jetton wallet {}", voteJettonWallet);
    println("fee controller {}", feeController.address);
    println("wallet fee registry {}", walletFeeRegistry.address);
    println("dex registry {}", dexRegistry.address);
    println("treasury {}", treasury.address);
    println("event controller {}", eventController.address);
    println("minter admin {}", minter.getAdminAddress());
    println("total supply {}", minter.getTotalSupply());
}
