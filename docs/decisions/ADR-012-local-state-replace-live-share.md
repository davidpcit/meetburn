# ADR-012: Local State + localStorage + BroadcastChannel Replace Live Share
## Status: Accepted

## Context

The original architecture (ADR-001, ADR-004) used Live Share SDK (Fluid Framework) to sync participant state across all meeting clients. This created several problems:

- Requires `LiveShareSession.ReadWrite.Chat` RSC permission in the manifest, which must be granted at install time and causes `errorCode 1000` until the app is re-added to a new meeting.
- The organizer-managed model (ADR-009) introduced a single source of truth: only the organizer's app writes state. Other participants never need to write to a shared container.
- With a single writer, cross-client sync is no longer needed. The organizer's local state *is* the authoritative state.
- The side panel and meeting stage run in separate iframes on the same origin (`meet-burn.vercel.app`). They can share data without any network hop using `localStorage` + `StorageEvent` (or `BroadcastChannel`).

## Decision

Remove `@microsoft/live-share` and `fluid-framework` entirely. Replace with:

1. **`useState` / `useReducer`** in `SidePanel` — organizer's participant map and meeting start time are pure local React state.
2. **`localStorage`** — side panel writes its state on every change; meeting stage reads it and subscribes to `storage` events for live updates.
3. **`BroadcastChannel`** (same-origin, same-tab-group) — used as a faster, same-session alternative to `storage` events for communicating between the side panel iframe and the stage iframe within the same Teams meeting window.
4. **`app.getContext()` meeting ID** — used as the `localStorage` key namespace to avoid collisions between concurrent meetings.

The `useLiveShare` hook is deleted. A new `useMeetingState` hook encapsulates local state + localStorage sync.

## Consequences

**Positive:**
- Eliminates Live Share RSC permission requirement and `errorCode 1000`.
- Removes two large dependencies (~350 kB uncompressed).
- No Fluid Relay connection latency; state is immediately consistent within the organizer's client.
- Stage update latency drops from ~200 ms (Fluid) to <16 ms (same-process BroadcastChannel).
- Works in any meeting, including ones where Live Share is not available.

**Negative:**
- Only the organizer's app shows the full picture. If a second person opens the side panel, they see their own empty state (not the organizer's). This matches the intended UX — the organizer is the single manager.
- localStorage is cleared when the browser session ends. Category assignments are lost if the organizer closes and reopens Teams entirely. Acceptable for a PoC with ephemeral-state requirements.
- `StorageEvent` only fires in other tabs/windows of the same origin, not within the same tab. BroadcastChannel covers same-tab communication between iframes.
