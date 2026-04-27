# Feature Spec: Side Panel — Category Selection

## Overview

Each meeting participant sees a side panel tab inside their Teams client. They select their professional category once; the selection is immediately broadcast to all other participants via Live Share.

## User Story

**As a** meeting participant,
**I want to** select my professional category in the side panel,
**So that** my hourly cost is included in the real-time meeting cost tracker visible to everyone.

## Acceptance Criteria

**AC1: Category list is displayed**
- Given the side panel loads
- When the user sees the panel
- Then all 5 categories are shown with their name and rate (€/h)

**AC2: Category selection updates Live Share state**
- Given the user selects a category
- When the selection is confirmed
- Then `participantsMap.set(userId, { displayName, categoryName, costPerHour })` is called
- And the selected button is visually highlighted

**AC3: Summary reflects all connected participants**
- Given multiple participants have selected categories
- When the side panel is open
- Then it shows the participant count and total €/h sum

**AC4: Share to stage button**
- Given at least one participant has selected a category
- When the organizer clicks "Share to stage"
- Then `meeting.shareAppContentToStage()` is called with the stage URL

**AC5: Graceful Teams context failure**
- Given the app is running outside Teams (local dev)
- When `app.getContext()` throws
- Then a local anonymous `userId` is generated and the UI remains functional

## Data Model

```typescript
interface ParticipantData {
  displayName: string;  // from Teams context or "Participante Local"
  categoryName: string; // one of CATEGORIES[n].name
  costPerHour: number;  // one of CATEGORIES[n].costPerHour
}
// Key: userId (string from Teams ctx, or "anon-<id>" locally)
```

## Components Involved

- `src/components/SidePanel.tsx` — renders the UI
- `src/hooks/useLiveShare.ts` — provides `upsertParticipant`, `participants`, `totalCostPerHour`
- `src/types.ts` — `CATEGORIES` constant

## Out of Scope

- Changing category after initial selection is allowed (upsert overwrites the key)
- Removing a participant's entry when they leave
- Authentication / role-based access
