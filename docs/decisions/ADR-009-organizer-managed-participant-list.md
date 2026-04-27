# ADR-009: Organizer-managed participant list with polling

## Status: Accepted

## Context

The current model is self-service: each participant opens the side panel and selects their own category. This requires all participants to actively engage with the app. The new model shifts control to the organizer: one person manages categories for everyone from their side panel.

## Decision

- Use `meeting.getParticipants()` from Teams JS SDK to fetch the connected participant list, polled every 15 seconds.
- On detecting a new participant, write them to the SharedMap with default category "Project Manager" (65€/h) and `active: true`. Do not overwrite if an entry already exists.
- On detecting a participant has left (absent from the polled list), set `active: false` in the SharedMap. Their `costPerHour` is preserved for reconnection.
- The side panel shows all participants (active and inactive) with a dropdown per row. Inactive participants show a visual indicator.
- Cost calculation (stage and side panel) only sums participants where `active: true`.
- A debug panel (visible at `?debug=true`) shows per-participant cost breakdown updated every second.

## Data model change

`ParticipantData` gains an `active: boolean` field:
```typescript
interface ParticipantData {
  displayName: string;
  categoryName: string;
  costPerHour: number;
  active: boolean;
}
```

## Consequences

- Side panel UX changes completely: from individual category picker to organizer-managed list.
- The `selected` local state in SidePanel is removed — state lives entirely in SharedMap.
- `MeetingStage` must filter `active: true` participants for cost sums.
- Polling introduces a 0–15s lag for detecting joins/leaves — acceptable for a cost tracker.
- `meeting.getParticipants()` only works inside a Teams meeting context (not in local dev with TestLiveShareHost).
