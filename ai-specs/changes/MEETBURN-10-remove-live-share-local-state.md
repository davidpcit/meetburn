# MEETBURN-10: Remove Live Share — local state + localStorage + BroadcastChannel

## User Story

As a meeting organizer, I want MeetBurn to work without Live Share so that I never see RSC permission errors and the app works in any meeting from the first open.

## Context

See ADR-012 for the full architectural decision. This spec covers the implementation work.

## Acceptance Criteria

1. `@microsoft/live-share` and `fluid-framework` are removed from `package.json`.
2. `useLiveShare.ts` hook is deleted.
3. A new `useMeetingState.ts` hook provides the same API surface (`participants`, `totalCostPerHour`, `meetingStartMs`, `upsertParticipant`, `isReady`) backed by `useState` + `localStorage` + `BroadcastChannel`.
4. `SidePanel.tsx` uses `useMeetingState` instead of `useLiveShare`. Behaviour is identical from the user's perspective.
5. `MeetingStage.tsx` uses `useMeetingState` to read state. The hook subscribes to `BroadcastChannel` so the stage updates in real time when the side panel changes.
6. `localStorage` key is `meetburn-${meetingId}` (from `app.getContext().meeting.id`); fallback `meetburn-default`.
7. `BroadcastChannel` name matches the localStorage key.
8. `isReady` is `true` as soon as `app.getContext()` resolves (no network connection required).
9. The manifest no longer requires `LiveShareSession.ReadWrite.Chat` RSC permission.
10. All existing tests pass or are updated to match the new hook.
11. Build produces no TypeScript errors.

## Files changed

### Deleted
- `src/hooks/useLiveShare.ts`
- `src/hooks/useLiveShare.test.ts`
- `src/components/DebugPanel.tsx` (Live Share-specific debug info)

### New
- `src/hooks/useMeetingState.ts`
- `src/hooks/useMeetingState.test.ts`

### Modified
- `src/components/SidePanel.tsx` — swap `useLiveShare` → `useMeetingState`; remove self-registration complexity
- `src/components/MeetingStage.tsx` — swap `useLiveShare` → `useMeetingState`
- `src/components/SidePanel.test.tsx` — update mocks
- `src/components/MeetingStage.test.tsx` — update mocks
- `appPackage/manifest.json` — remove `LiveShareSession.ReadWrite.Chat` RSC permission
- `package.json` — remove `@microsoft/live-share` and `fluid-framework`

## Out of Scope

- Multi-organizer conflict resolution
- Persistent storage beyond the browser session
