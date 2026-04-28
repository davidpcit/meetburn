# ADR-015: Revert to Live Share for Participant State Sync
## Status: Accepted

## Context

ADR-012 replaced Live Share with `localStorage + BroadcastChannel` to eliminate the `LiveShareSession.ReadWrite.Chat` RSC admin-approval requirement.

The MEETBURN-10 implementation introduced two regressions in production:

1. **Participant list shows only the organizer.** The new approach relies on `meeting.getParticipants()` to discover who is in the meeting. In the Audax tenant (production), this API silently returns an empty list — the `OnlineMeetingParticipant.Read.Chat` RSC permission is not granted or the API is not available in the meeting context. Only the organizer appears (via self-registration from `app.getContext()`).

2. **Stage sync does not work.** Teams desktop runs the side panel and the meeting stage in separate Electron renderer processes. `localStorage` and `BroadcastChannel` are scoped to a single renderer process and cannot cross process boundaries. A workaround using URL params (`ADR-014`) was attempted but it only allows a static snapshot at share-time — no live updates.

With Live Share, both problems were absent:
- Participant state is stored in a shared Fluid container that all meeting clients (side panel and stage) connect to independently — no need for `getParticipants()`.
- The stage reads from the same SharedMap as the side panel; updates propagate in near-real-time.

The `LiveShareSession.ReadWrite.Chat` RSC permission was working in the Audax tenant throughout development and testing.

## Decision

Revert to `useLiveShare` (Live Share SDK + Fluid Framework) for participant state sync. Specifically:

- Restore `src/hooks/useLiveShare.ts`
- `SidePanel` and `MeetingStage` use `useLiveShare`
- Restore `LiveShareSession.ReadWrite.Chat` in the manifest
- Keep GitHub Pages hosting (MEETBURN-11) — no Vercel dependency
- Keep `import.meta.env.BASE_URL` in `handleShareToStage` URL
- Keep version number in stage title for cache debugging
- Keep no-cache headers in `index.html`
- `useMeetingState` (localStorage hook) remains in the codebase but is no longer used by any component

## Consequences

**Positive:**
- Participant list works correctly (each client self-registers in the SharedMap).
- Stage sync works in real time (Fluid Framework handles cross-process state).
- Reverting restores the known-working behavior from before MEETBURN-10.

**Negative:**
- Re-introduces `LiveShareSession.ReadWrite.Chat` RSC requirement.
- In tenants where this permission is not admin-approved, Live Share will fail with `errorCode 1000`. The error is surfaced visibly in the UI (`liveShareError` state).
- Dead code: `useMeetingState` hook and its tests remain but are not used.

## Supersedes

ADR-012, ADR-014
