# ADR-008: Restore selected category from SharedMap on reconnect

## Status: Accepted

## Context

The `selected` state in SidePanel is local React state and is lost when Teams unmounts the iframe on side panel close. The user's category is already persisted in the SharedMap under their `userId`, so the data is available on reconnect.

## Decision

After Live Share connects (`isReady` becomes true) and `userId` is known, read `participants[userId]` from the SharedMap. If an entry exists, restore `selected` to that `categoryName`. No write to the SharedMap — the data is already there.

## Consequences

- No schema change, no new shared state.
- Restoration is read-only — avoids unnecessary SharedMap writes and `valueChanged` events.
- Depends on both `isReady` and `userId` being available; restoration fires via `useEffect` when both are set.
