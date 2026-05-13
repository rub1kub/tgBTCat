import "types"

contract TgBtcCatDao {
    author: "rub1kub"
    version: "0.1.0"
    description: "TG BTC Cat DAO governance controller scaffold"
    storage: Storage
    incomingMessages: AllowedMessage
}

type AllowedMessage = ChangeOwner

fun onInternalMessage(in: InMessage) {
    val msg = lazy AllowedMessage.fromSlice(in.body);

    match (msg) {
        ChangeOwner => {
            var storage = lazy Storage.load();
            assert (in.senderAddress == storage.owner) throw Errors.NotOwner;
            storage.owner = msg.newOwner;
            storage.save();
        }
        else => {
            assert (in.body.isEmpty()) throw Errors.InvalidMessage;
        }
    }
}

fun onBouncedMessage(_in: InMessageBounced) {}

get fun owner(): address {
    val storage = lazy Storage.load();
    return storage.owner;
}
