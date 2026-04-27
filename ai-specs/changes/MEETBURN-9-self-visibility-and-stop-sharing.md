# MEETBURN-9: Self-visibility fix + Stop sharing button

## Problem
1. When the organizer is alone in the meeting, `meeting.getParticipants()` returns an empty list so they cannot see or select their own category.
2. There is no in-app button to stop the meeting stage projection.

## Solution

### Self-visibility (SidePanel)
- `app.getContext()` already resolves `currentUserId`.
- Extend its `.then` handler to also capture `displayName` (`ctx.user?.userPrincipalName ?? ctx.user?.id`).
- After the context resolves, and once `isReady` is true, call `upsertParticipant(currentUserId, {...})` only if the current user is not already in the SharedMap.
- Store `currentUserDisplayName` in state alongside `currentUserId`.
- The existing sync effect (`teamsParticipants → SharedMap`) handles the multi-user case; the self-registration handles the solo case.

### Stop sharing button (MeetingStage)
- Add a `handleStopSharing` function that calls `(meeting as unknown as { stopSharingAppContentToStage: (cb: (err: unknown) => void) => void }).stopSharingAppContentToStage(...)`.
- Render a "Dejar de compartir" button in the stage footer.

## Files changed
- `src/components/SidePanel.tsx` — self-registration logic
- `src/components/MeetingStage.tsx` — stop sharing button
- `src/components/SidePanel.test.tsx` — test self-registration
- `src/components/MeetingStage.test.tsx` — test stop sharing button

## Acceptance criteria
- [ ] Organizer sees themselves in the participant list when alone
- [ ] "Dejar de compartir" button appears on the stage and calls stopSharingAppContentToStage
