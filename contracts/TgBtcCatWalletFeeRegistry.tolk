import "governance-types"

contract TgBtcCatWalletFeeRegistry {
    author: "rub1kub"
    version: "1.0.0"
    description: "TG BTC Cat wallet-specific buy/sell fee registry"
    storage: WalletFeeRegistryStorage
    incomingMessages: WalletFeeRegistryMessage
}

type WalletFeeRegistryMessage =
    | SetWalletFees
    | ClearWalletFees
    | SetProtectedWallet
    | SetWalletFeeRegistryGovernor
    | GovernanceTopUp

fun onInternalMessage(in: InMessage) {
    val msg = lazy WalletFeeRegistryMessage.fromSlice(in.body);

    match (msg) {
        SetWalletFees => {
            var storage = lazy WalletFeeRegistryStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            assert (!storage.protectedWallets.exists(msg.target)) throw GovErrors.ProtectedWallet;
            assertFeeBps(msg.buyFeeBps);
            assertFeeBps(msg.sellFeeBps);
            storage
                .rules
                .set(
                    msg.target,
                    {
                        buyFeeBps: msg.buyFeeBps,
                        sellFeeBps: msg.sellFeeBps,
                        reasonHash: msg.reasonHash,
                    },
                );
            storage.save();
        }
        ClearWalletFees => {
            var storage = lazy WalletFeeRegistryStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            assert (!storage.protectedWallets.exists(msg.target)) throw GovErrors.ProtectedWallet;
            storage.rules.delete(msg.target);
            storage.save();
        }
        SetProtectedWallet => {
            var storage = lazy WalletFeeRegistryStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            if (msg.isProtected) {
                storage.protectedWallets.set(msg.target, true);
                storage.rules.delete(msg.target);
            } else {
                storage.protectedWallets.delete(msg.target);
            }
            storage.save();
        }
        SetWalletFeeRegistryGovernor => {
            var storage = lazy WalletFeeRegistryStorage.load();
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

get fun get_wallet_fees(target: address): WalletFeeRuleReply {
    val storage = lazy WalletFeeRegistryStorage.load();
    val rule = storage.rules.get(target);
    if (!rule.isFound) {
        return {
            isSet: false,
            buyFeeBps: 0,
            sellFeeBps: 0,
            reasonHash: 0,
        };
    }

    val value = rule.loadValue();
    return {
        isSet: true,
        buyFeeBps: value.buyFeeBps,
        sellFeeBps: value.sellFeeBps,
        reasonHash: value.reasonHash,
    };
}

get fun is_wallet_protected(target: address): bool {
    val storage = lazy WalletFeeRegistryStorage.load();
    return storage.protectedWallets.exists(target);
}
