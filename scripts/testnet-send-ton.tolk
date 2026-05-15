import "@acton/env"
import "@acton/io"

import "@acton/emulation/network"
import "@acton/emulation/scripts"

fun main() {
    val fromWalletName = env<string>("TGBTCAT_FROM_WALLET") ?? "deployer";
    val toAddress = env<address>("TGBTCAT_TO_ADDRESS") ??
    address("kQC820tGBtPVavhCbFZHnFavQObnCLitBKlGaEZ6-eyQTIY6");
    val amount = env<int>("TGBTCAT_SEND_AMOUNT") ?? 1000000000;
    val from = scripts.wallet(fromWalletName);

    val transferMessage = createMessage({
        bounce: false,
        value: amount,
        dest: toAddress,
        body: beginCell().endCell(),
    });
    val result = net.send(from.address, transferMessage);

    if (result.waitForFirstTransaction() == null) {
        println("send ton: no transaction was included");
        return;
    }

    println("send ton: ok");
    println("from {}", from.address);
    println("to {}", toAddress);
    println("amount {}", amount);
}
