# MEETBURN-8: Organizer-managed participant list with polling

## User Story

As a meeting organizer, I want to see all connected participants in my side panel and assign their professional category, so the meeting cost is tracked automatically without requiring each participant to interact with the app.

## Acceptance Criteria

1. On mount and every 15 seconds, the side panel calls `meeting.getParticipants()` to get the current participant list.
2. Each new participant is added to local state with default category "Project Manager" (65€/h) and `active: true`. Existing entries are not overwritten (category preserved).
3. The side panel shows all participants (active and inactive) with name and a category dropdown.
4. Changing a dropdown updates local state → written to localStorage → broadcast to stage via BroadcastChannel.
5. When a participant leaves (absent from polled list), their entry is updated to `active: false`. Their category is preserved.
6. When a participant reconnects, their entry is updated to `active: true` with their original category.
7. Inactive participants are shown with a greyed-out style and "· desconectado" indicator.
8. Cost calculation only includes `active: true` participants.
9. The organizer appears in the list and can change their own category.
10. A debug panel is shown when `?debug=true` is in the URL.
11. If `meeting.getParticipants()` fails (local dev), the side panel shows only the current user.

## Files

- `src/hooks/useMeetingParticipants.ts` — polling hook (unchanged)
- `src/hooks/useMeetingState.ts` — replaces `useLiveShare` (local state + localStorage + BroadcastChannel)
- `src/components/SidePanel.tsx` — participant list UI
- `src/components/MeetingStage.tsx` — reads from BroadcastChannel
- `src/types.ts` — `ParticipantData` with `active: boolean`
