# ADR-004: SharedMap for Participant State (vs LiveState / LivePresence)

## Status: Accepted

## Context

Live Share SDK v1 offers several collaborative data structures:

- **SharedMap** (Fluid Framework): Key-value store, any client can read/write any key, eventually consistent.
- **LiveState**: Typed state object managed by one "local" client, broadcast to others. Good for single-owner state.
- **LivePresence**: Designed for presence signals (who is online, cursor position). Ephemeral, best-effort delivery.

Participant category selections need to be:
- Keyed by `userId` (each participant owns their own entry)
- Readable by all participants (including the stage view)
- Persistent for the meeting duration (not ephemeral like LivePresence)

## Decision

Use two `SharedMap` instances:

1. `participantsMap`: `Map<userId, ParticipantData>` — each participant writes their own entry; all clients read the full map.
2. `metaMap`: `Map<"meetingStart", number>` — stores the meeting start timestamp; set once by the first participant to connect.

## Consequences

**Positive:**
- `SharedMap` is the most flexible and battle-tested Fluid structure.
- Natural keying by `userId` prevents accidental overwriting of other participants' data (each user only writes their own key).
- Both side panel and stage share the same container schema — no duplication of connection logic.

**Negative:**
- No automatic cleanup when a participant leaves — their entry remains in the map for the meeting duration. Acceptable for a PoC with in-memory-only requirements.
- `SharedMap` allows any client to write any key; there is no per-key ownership enforcement at the SDK level.
