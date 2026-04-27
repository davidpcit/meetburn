# MEETBURN-6: Real participant name in Meeting Stage

## User Story

As a meeting organizer, I want to see the real name of each participant in the stage table, so I can identify who is contributing to the meeting cost.

## Acceptance Criteria

1. The Meeting Stage table shows each participant's real Teams display name.
2. Display name comes from `meeting.getParticipants()` for all participants.
3. For the organizer themselves (or when alone), name comes from `app.getContext()` — trying `displayName`, `loginHint`, `userPrincipalName` in order, then the SSO token `name` claim as final fallback.
4. The GUID is never shown when any name source is available.

## Implementation Note

Name resolution order in `useMeetingState` / `SidePanel`:
1. `ctx.user.displayName`
2. `ctx.user.loginHint` (typically the email)
3. `ctx.user.userPrincipalName`
4. SSO token `name` claim (decoded client-side, no server call)
5. GUID as last resort
