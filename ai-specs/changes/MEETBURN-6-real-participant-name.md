# MEETBURN-6: Real participant name in Meeting Stage

## User Story

As a meeting organizer, I want to see the real name of each participant in the stage table, so I can identify who is contributing to the meeting cost.

## Acceptance Criteria

1. The Meeting Stage table shows each participant's real Teams display name.
2. If `app.getContext()` resolves after category selection, the SharedMap entry is updated automatically with the real name.
3. The fallback `"Participante"` is never written to the SharedMap when a real name is available.
4. Works for both manual selection and auto-selection via job title.

## Root Cause

`upsertParticipant` was called before `app.getContext()` resolved, writing the fallback `"Participante"` to the SharedMap. The fix is a `useEffect` that re-calls `upsertParticipant` whenever `displayName` changes and a category is already selected.
