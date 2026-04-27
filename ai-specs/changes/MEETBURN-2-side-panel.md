# Feature Spec: Side Panel — Organizer Category Assignment

## Overview

The organizer opens the side panel tab inside their Teams client. They see all current meeting participants (polled from Teams API) and assign a professional category to each one. The total cost is calculated locally and can be projected to the shared stage.

## User Story

**As a** meeting organizer,
**I want to** assign a professional category to each participant in the side panel,
**So that** I can see the real-time cost of the meeting and optionally share it with the team.

## Acceptance Criteria

**AC1: Participant list is displayed**
- Given the side panel loads and `meeting.getParticipants()` returns results
- When the organizer sees the panel
- Then each participant is listed with their display name and a category dropdown

**AC2: Self-registration when alone**
- Given the organizer opens the panel before others join
- When `meeting.getParticipants()` returns an empty list
- Then the organizer's own entry is added using `app.getContext()` data

**AC3: Category assignment updates local state**
- Given the organizer changes a participant's category dropdown
- When the new value is selected
- Then `useMeetingState.setCategory(userId, category)` updates local state
- And the change is written to `localStorage[meetingId]` and broadcast via `BroadcastChannel`

**AC4: Summary reflects all active participants**
- Given participants have been assigned categories
- When the side panel is open
- Then it shows active participant count and total €/h

**AC5: Accumulated cost is shown**
- Given the meeting has been running for some time
- When the side panel is open
- Then it shows the accumulated cost = totalCostPerHour × elapsedHours

**AC6: Share to stage button**
- Given at least one participant is active
- When the organizer clicks "Proyectar en pantalla compartida"
- Then `meeting.shareAppContentToStage()` is called with the stage URL

**AC7: Category assignment persists on panel reopen**
- Given the organizer closes and reopens the side panel
- When `useMeetingState` initialises
- Then it reads from `localStorage[meetingId]` and restores all previous assignments

## Data Model

```typescript
interface ParticipantData {
  displayName: string;  // from meeting.getParticipants() or app.getContext()
  categoryName: string; // one of CATEGORIES[n].name
  costPerHour: number;  // one of CATEGORIES[n].costPerHour
  active: boolean;      // true while in the meeting
}
// Key: userId (AAD object ID)
// Stored in: localStorage key `meetburn-${meetingId}`
```

## Components Involved

- `src/components/SidePanel.tsx` — renders the UI
- `src/hooks/useMeetingState.ts` — local state + localStorage + BroadcastChannel
- `src/hooks/useMeetingParticipants.ts` — Teams participant polling
- `src/types.ts` — `CATEGORIES` constant

## Out of Scope

- Authentication / role-based access
- Multiple organizers managing the same meeting
