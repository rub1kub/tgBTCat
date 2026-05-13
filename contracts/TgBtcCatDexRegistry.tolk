import "governance-types"

contract TgBtcCatDexRegistry {
    author: "rub1kub"
    version: "1.0.0"
    description: "TG BTC Cat DEX wallet registry for buy/sell classification"
    storage: DexRegistryStorage
    incomingMessages: DexRegistryMessage
}

type DexRegistryMessage =
    | AddDexWallet
    | RemoveDexWallet
    | SetDexRegistryGovernor
    | GovernanceTopUp

fun onInternalMessage(in: InMessage) {
    val msg = lazy DexRegistryMessage.fromSlice(in.body);

    match (msg) {
        AddDexWallet => {
            var storage = lazy DexRegistryStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            storage.dexWallets.set(msg.wallet, true);
            storage.save();
        }
        RemoveDexWallet => {
            var storage = lazy DexRegistryStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            storage.dexWallets.delete(msg.wallet);
            storage.save();
        }
        SetDexRegistryGovernor => {
            var storage = lazy DexRegistryStorage.load();
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

get fun is_dex_wallet(wallet: address): bool {
    val storage = lazy DexRegistryStorage.load();
    return storage.dexWallets.exists(wallet);
}
