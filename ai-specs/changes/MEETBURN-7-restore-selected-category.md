# MEETBURN-7: Restore selected category on side panel reopen

## User Story

As a meeting participant, when I reopen the MeetBurn side panel during an ongoing meeting, I want to see my previously selected category already marked, so I don't have to reselect it.

## Acceptance Criteria

1. On load, once `isReady` is true and `userId` is known, if `participants[userId]` exists in the SharedMap, restore `selected` to that `categoryName`.
2. The restored category appears visually marked (same `active` class as a manual selection).
3. No write to the SharedMap occurs during restoration.
4. If no entry exists for the current user, the panel shows with no selection (current behaviour).
5. If Live Share takes time to connect, restoration happens as soon as `isReady` becomes true.
