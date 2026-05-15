import "@acton/env"
import "@acton/io"

import "@acton/emulation/network"
import "@acton/emulation/scripts"
import "@wrappers/TgBtcCatJettonMaster.gen"
import "@wrappers/TgBtcCatJettonWallet.gen"
import "@wrappers/utils"

fun printBalance(label: string, minter: TgBtcCatJettonMaster, owner: address) {
    val wallet = TgBtcCatJettonWallet.fromAddress(minter.getWalletAddress(owner));
    println("{} owner {}", label, owner);
    println("{} wallet {}", label, wallet.address);
    println("{} balance {}", label, wallet.getJettonBalance());
}

fun main() {
    val senderWalletName = env<string>("TGBTCAT_DEPLOYER_WALLET") ?? "tgbtcat_script_deployer";
    val jettonMasterAddress = env<address>("TGBTCAT_JETTON_MASTER_ADDRESS") ??
    address("kQA2_EY0dYE1AkLd4-Rddw-2pUuP4jMl7HFh1s4Q9uijXEkA");
    val recipient = env<address>("TGBTCAT_TRANSFER_RECIPIENT") ??
    address("kQB5PH2RRIcPSCOh1b8Hldtm5FPJnt88w72D7--6vWNcxPb7");
    val feeTreasury = env<address>("TGBTCAT_FEE_TREASURY") ??
    address("kQC2sHx4TKwlHSxCwH-CsZ0DFUzV9zZMdJIaWNTEvc1BLdp7");
    val jettonAmount = env<int>("TGBTCAT_JETTON_AMOUNT") ?? 1000000000000;
    val transferValue = env<int>("TGBTCAT_TRANSFER_VALUE") ?? 500000000;
    val forwardValue = env<int>("TGBTCAT_FORWARD_VALUE") ?? 0;

    val sender = scripts.wallet(senderWalletName);
    val minter = TgBtcCatJettonMaster.fromAddress(jettonMasterAddress);
    val senderJettonWallet = TgBtcCatJettonWallet.fromAddress(
        minter.getWalletAddress(sender.address),
    );

    printBalance("sender before", minter, sender.address);
    printBalance("recipient before", minter, recipient);
    printBalance("fee treasury before", minter, feeTreasury);

    val result = senderJettonWallet.sendTransfer(
        sender.address,
        transferValue,
        jettonAmount,
        recipient,
        sender.address,
        null,
        forwardValue,
        null,
    );

    if (result.waitForFirstTransaction() == null) {
        println("jetton transfer: no transaction was included");
        return;
    }

    println("jetton transfer: ok");
    printBalance("sender after", minter, sender.address);
    printBalance("recipient after", minter, recipient);
    printBalance("fee treasury after", minter, feeTreasury);
}
