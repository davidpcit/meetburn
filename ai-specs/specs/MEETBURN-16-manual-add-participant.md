# MEETBURN-16: Manual participant entry with delete

## Problem

`meeting.getParticipants()` does not work in the Audax tenant. Only participants
who open MeetBurn self-register via Live Share. The organizer cannot add the rest
of the meeting attendees without requiring them to open the app.

## Solution

Add a manual "add participant" form in the SidePanel. Manually added participants
are stored in the SharedMap with a `manuallyAdded: true` flag, so Live Share syncs
them to all clients. Each manually added participant has a delete button.

## Data model change

```typescript
interface ParticipantData {
  displayName: string;
  categoryName: string;
  costPerHour: number;
  active: boolean;
  manuallyAdded?: boolean;   // true only for organizer-added entries
}
```

Keys for manually added entries: `manual-{Date.now()}` (unique per add action).

## Acceptance Criteria

### Add form
- Shown below the participant list
- Text input for name (placeholder "Nombre del participante")
- Category selector (same CATEGORIES list)
- "Añadir" button — disabled when name input is empty
- On submit: calls `upsertParticipant("manual-{Date.now()}", { displayName, categoryName, costPerHour, active: true, manuallyAdded: true })`
- Clears the name input after adding
- Synced to all Live Share clients via SharedMap

### Delete button
- Shown only for entries where `manuallyAdded === true`
- On click: calls `upsertParticipant(id, { ...p, active: false })` to mark inactive
  (keeps SharedMap consistency; does not hard-delete from SharedMap)
- Inactive manually-added participants are hidden from the list (unlike auto-registered
  participants which show as "desconectado")

### Auto-registered participants
- No delete button
- If someone was manually added AND opens the app, both entries appear (duplicate accepted)

## Files changed

- `src/types.ts` — add `manuallyAdded?: boolean` to `ParticipantData`
- `src/components/SidePanel.tsx` — add form + delete button
- `src/components/SidePanel.test.tsx` — new tests
