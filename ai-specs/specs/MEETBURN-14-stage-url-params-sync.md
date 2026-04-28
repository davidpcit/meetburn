# MEETBURN-14: Stage sync via URL parameters

## Problem

Teams desktop (Electron) runs the side panel and meeting stage in **separate renderer processes**. `localStorage` and `BroadcastChannel` are scoped to a single renderer process and do not cross process boundaries. As a result, the stage always shows 0 participants and 0 €/h regardless of what the organizer has configured in the side panel.

## Solution

Pass the minimal state needed to drive the stage display as URL query parameters when the organizer shares to stage.

## Acceptance Criteria

### SidePanel — `handleShareToStage`
- Builds the stage URL with `?view=stage&rate=<totalCostPerHour>&start=<meetingStartMs>&count=<activeCount>`
- `rate` is the sum of `costPerHour` for all active participants (integer or float)
- `start` is the current `meetingStartMs` value (Unix ms timestamp)
- `count` is the number of active participants

### MeetingStage — rendering
- Reads `rate`, `start`, `count` from `URLSearchParams` on mount
- If `start` is missing or zero, defaults to `Date.now()`
- If `rate` is missing or NaN, defaults to `0`
- If `count` is missing or NaN, defaults to `0`
- Timer counts up from `start`
- Accumulated cost = `rate × elapsedHours`
- Does NOT call `useMeetingState` (no BroadcastChannel dependency)
- Participant table section is hidden (no participant data available from URL params)

## Files Changed

- `src/components/SidePanel.tsx` — `handleShareToStage`
- `src/components/MeetingStage.tsx` — replace `useMeetingState` with URL param reading
- `src/components/MeetingStage.test.tsx` — new test file
- `src/components/SidePanel.test.tsx` — new/updated test for `handleShareToStage` URL format

## Out of Scope

- Live participant updates after sharing (stage is a snapshot at share-time)
- Individual participant names/categories in stage view
