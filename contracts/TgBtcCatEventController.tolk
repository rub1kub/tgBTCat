import "governance-types"

contract TgBtcCatEventController {
    author: "rub1kub"
    version: "1.0.0"
    description: "TG BTC Cat DAO community event controller"
    storage: EventControllerStorage
    incomingMessages: EventControllerMessage
}

type EventControllerMessage =
    | CreateCommunityEvent
    | UpdateCommunityEvent
    | SetCommunityEventStatus
    | SetEventControllerGovernor
    | GovernanceTopUp

fun onInternalMessage(in: InMessage) {
    val msg = lazy EventControllerMessage.fromSlice(in.body);

    match (msg) {
        CreateCommunityEvent => {
            var storage = lazy EventControllerStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            assertEventKind(msg.eventKind);
            assertEventTimeRange(msg.startsAt, msg.endsAt);

            val eventId = storage.nextEventId;
            storage.nextEventId += 1;
            storage
                .events
                .set(
                    eventId,
                    {
                        eventKind: msg.eventKind,
                        status: EVENT_STATUS_DRAFT,
                        metadataHash: msg.metadataHash,
                        metadata: msg.metadata,
                        startsAt: msg.startsAt,
                        endsAt: msg.endsAt,
                        createdAt: blockchain.now(),
                        updatedAt: blockchain.now(),
                    },
                );
            storage.save();
        }

        UpdateCommunityEvent => {
            var storage = lazy EventControllerStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            assertEventKind(msg.eventKind);
            assertEventTimeRange(msg.startsAt, msg.endsAt);
            val eventResult = storage.events.get(msg.eventId);
            assert (eventResult.isFound) throw GovErrors.UnknownEvent;
            var event = eventResult.loadValue();
            event.eventKind = msg.eventKind;
            event.metadataHash = msg.metadataHash;
            event.metadata = msg.metadata;
            event.startsAt = msg.startsAt;
            event.endsAt = msg.endsAt;
            event.updatedAt = blockchain.now();
            storage.events.set(msg.eventId, event);
            storage.save();
        }

        SetCommunityEventStatus => {
            var storage = lazy EventControllerStorage.load();
            assertGovernor(in.senderAddress, storage.governor);
            assertEventStatus(msg.status);
            val eventResult = storage.events.get(msg.eventId);
            assert (eventResult.isFound) throw GovErrors.UnknownEvent;
            var event = eventResult.loadValue();
            event.status = msg.status;
            event.updatedAt = blockchain.now();
            storage.events.set(msg.eventId, event);
            storage.save();
        }

        SetEventControllerGovernor => {
            var storage = lazy EventControllerStorage.load();
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

get fun get_event(eventId: uint64): CommunityEventReply {
    val storage = lazy EventControllerStorage.load();
    val eventResult = storage.events.get(eventId);
    if (!eventResult.isFound) {
        return {
            isSet: false,
            eventId,
            eventKind: 0,
            status: 0,
            metadataHash: 0,
            metadata: null,
            startsAt: 0,
            endsAt: 0,
            createdAt: 0,
            updatedAt: 0,
            governor: storage.governor,
        };
    }

    val event = eventResult.loadValue();
    return {
        isSet: true,
        eventId,
        eventKind: event.eventKind,
        status: event.status,
        metadataHash: event.metadataHash,
        metadata: event.metadata,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        governor: storage.governor,
    };
}

get fun get_next_event_id(): uint64 {
    val storage = lazy EventControllerStorage.load();
    return storage.nextEventId;
}

get fun get_event_controller_governor(): address {
    val storage = lazy EventControllerStorage.load();
    return storage.governor;
}
