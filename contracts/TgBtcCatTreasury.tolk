import "governance-types"
import "messages"

contract TgBtcCatTreasury {
    author: "rub1kub"
    version: "1.0.0"
    description: "TG BTC Cat DAO-controlled treasury"
    storage: TreasuryStorage
    incomingMessages: TreasuryMessage
}

type TreasuryMessage =
    | SendTreasuryTon
    | SendTreasuryJettons
    | SetTreasuryGovernor
    | SetTreasuryPrimaryJettonWallet
    | GovernanceTopUp

fun treasuryBounceMode(shouldBounce: bool): BounceMode {
    return shouldBounce ? BounceMode.Only256BitsOfBody : BounceMode.NoBounce;
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy TreasuryMessage.fromSlice(in.body);

    match (msg) {
        SendTreasuryTon => {
            val storage = lazy TreasuryStorage.load();
            assertGovernor(in.senderAddress, storage.governor);

            val tonMsg = createMessage({
                bounce: treasuryBounceMode(msg.bounce),
                dest: msg.recipient,
                value: msg.amount,
                body: TopUpTons {},
            });
            tonMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }

        SendTreasuryJettons => {
            msg.forwardPayload.checkIsCorrectTlbEither();
            val storage = lazy TreasuryStorage.load();
            assertGovernor(in.senderAddress, storage.governor);

            val transferMsg = createMessage({
                bounce: BounceMode.Only256BitsOfBody,
                dest: msg.jettonWallet,
                value: msg.walletTonAmount,
                body: AskToTransfer {
                    queryId: msg.queryId,
                    jettonAmount: msg.jettonAmount,
                    transferRecipient: msg.transferRecipient,
                    sendExcessesTo: msg.sendExcessesTo,
                    customPayload: null,
                    forwardTonAmount: msg.forwardTonAmount,
                    forwardPayload: msg.forwardPayload,
                },
            });
            transferMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }

        SetTreasuryGovernor => {
            var storage = lazy TreasuryStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            storage.governor = msg.governor;
            storage.save();
        }

        SetTreasuryPrimaryJettonWallet => {
            var storage = lazy TreasuryStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            storage.primaryJettonWallet = msg.primaryJettonWallet;
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

get fun get_treasury_config(): TreasuryConfigReply {
    val storage = lazy TreasuryStorage.load();
    return { governor: storage.governor, primaryJettonWallet: storage.primaryJettonWallet };
}
