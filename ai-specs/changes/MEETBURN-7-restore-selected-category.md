# MEETBURN-7: Restore category assignments on side panel reopen

## User Story

**As a** meeting organizer,
**I want** the category assignments I made to be preserved when I close and reopen the side panel,
**So that** I don't lose my work if Teams unmounts the iframe.

## Solution

`useMeetingState` initialises by reading from `localStorage[meetingId]`. All category assignments written during the session are restored automatically. No user action required.

## Acceptance Criteria

- [ ] On side panel reopen, all previously assigned categories are shown for each participant
- [ ] No unnecessary state writes on restore

## Implementation Note

`localStorage` key is `meetburn-${meetingId}` where `meetingId` comes from `app.getContext().meeting.id`. Fallback: `meetburn-default` when outside Teams.
