# ADR-010: Self-registration via app.getContext fallback
## Status: Accepted
## Context
`meeting.getParticipants()` does not return the current user when they are alone in the meeting. As a result the organizer cannot see or select their own category in the side panel.
## Decision
After resolving `app.getContext()` in `SidePanel`, if the current user's `aadObjectId` is not present in the `teamsParticipants` list, inject them directly into the SharedMap using their `userDisplayName` from the context. This ensures the organizer is always visible and selectable regardless of meeting size.
## Consequences
- Organizer is always registered with a default category even when alone.
- `app.getContext()` is already called; we only extend its handler to also call `upsertParticipant` when `isReady` and the user is not yet in the map.
