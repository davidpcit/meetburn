# MEETBURN-8: Organizer-managed participant list with polling

## User Story

As a meeting organizer, I want to see all connected participants in my side panel and assign their professional category, so the meeting cost is tracked automatically without requiring each participant to interact with the app.

## Acceptance Criteria

1. On mount and every 15 seconds, the side panel calls `meeting.getParticipants()` to get the current participant list.
2. Each new participant is added to the SharedMap with default category "Project Manager" (65€/h) and `active: true`. Existing entries are not overwritten.
3. The side panel shows all participants (active and inactive) with name and a category dropdown.
4. Changing a dropdown updates the SharedMap → stage updates in real time.
5. When a participant leaves (absent from polled list), their SharedMap entry is updated to `active: false`. Their category and rate are preserved.
6. When a participant reconnects, their entry is updated to `active: true` with their original category.
7. Inactive participants are shown in the list with a greyed-out style and "· desconectado" indicator.
8. Cost calculation (stage and side panel accumulated cost) only includes `active: true` participants.
9. The organizer appears in the list as a regular participant and can change their own category via the dropdown.
10. A debug panel is shown when `?debug=true` is in the URL, displaying per-participant cost breakdown (name, category, rate, elapsed hours, subtotal, active status) updated every second.
11. If `meeting.getParticipants()` fails (e.g. local dev), the side panel falls back to showing only the current user with manual category selection.

## New files

- `src/hooks/useMeetingParticipants.ts` — polling hook
- `src/components/DebugPanel.tsx` — debug cost breakdown

## Modified files

- `src/types.ts` — add `active: boolean` to `ParticipantData`
- `src/components/SidePanel.tsx` — replace category picker with participant list
- `src/components/MeetingStage.tsx` — filter active participants for cost sums
