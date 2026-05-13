import "governance-types"

contract TgBtcCatFeeController {
    author: "rub1kub"
    version: "1.0.0"
    description: "TG BTC Cat global buy/sell fee controller"
    storage: FeeControllerStorage
    incomingMessages: FeeControllerMessage
}

type FeeControllerMessage =
    | SetGlobalFees
    | SetFeeTreasury
    | SetFeeControllerGovernor
    | GovernanceTopUp

fun onInternalMessage(in: InMessage) {
    val msg = lazy FeeControllerMessage.fromSlice(in.body);

    match (msg) {
        SetGlobalFees => {
            var storage = lazy FeeControllerStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            assertFeeBps(msg.buyFeeBps);
            assertFeeBps(msg.sellFeeBps);
            storage.globalBuyFeeBps = msg.buyFeeBps;
            storage.globalSellFeeBps = msg.sellFeeBps;
            storage.save();
        }
        SetFeeTreasury => {
            var storage = lazy FeeControllerStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            storage.feeTreasury = msg.feeTreasury;
            storage.save();
        }
        SetFeeControllerGovernor => {
            var storage = lazy FeeControllerStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            storage.governor = msg.governor;
            storage.save();
        }
        GovernanceTopUp => {
            // accept tons
        }
        else => {
            assert (in.body.isEmpty()) throw GovErrors.InvalidMessage;
        }
    }
}

fun onBouncedMessage(_in: InMessageBounced) {}

get fun get_global_fees(): FeeConfigReply {
    val storage = lazy FeeControllerStorage.load();
    return {
        buyFeeBps: storage.globalBuyFeeBps,
        sellFeeBps: storage.globalSellFeeBps,
        feeTreasury: storage.feeTreasury,
        governor: storage.governor,
    };
}
