# Feature Spec: Meeting Stage — Live Cost Counter

## Overview

The meeting stage is an optional shared view the organizer projects to all attendees. It shows a live running cost counter driven by the organizer's local state, communicated to the stage via BroadcastChannel (no network hop).

## User Story

**As a** meeting organizer,
**I want to** project the accumulated cost counter to the shared screen,
**So that** all attendees see the financial impact of the meeting in real time.

## Acceptance Criteria

**AC1: Stage reads state from BroadcastChannel / localStorage**
- Given the organizer's side panel has participant data
- When the stage loads
- Then it reads the latest state from `localStorage[meetingId]`
- And subscribes to `BroadcastChannel(meetingId)` for live updates

**AC2: Elapsed time starts from meeting start**
- Given `meetingStartMs` is stored in the organizer's state
- When the stage renders
- Then the timer counts up from that timestamp

**AC3: Total cost per hour reflects active participants**
- Given the organizer has assigned categories to participants
- When the stage renders
- Then `totalCostPerHour` = sum of active participants' `costPerHour`

**AC4: Accumulated cost updates every second**
- Given `totalCostPerHour` and `elapsedHours` are known
- Then `totalCost = totalCostPerHour × elapsedHours` is recalculated every second

**AC5: Participant table shows breakdown**
- Given participants have been assigned categories
- When the stage renders
- Then a table shows each participant's display name, category, and rate

**AC6: Empty state is handled**
- Given no participant has been assigned a category yet
- When the stage renders
- Then a waiting message is shown

**AC7: Stop sharing button**
- Given the stage is projected
- When the organizer clicks "Dejar de compartir"
- Then `meeting.stopSharingAppContentToStage()` is called

## Displayed Values

| Value | Formula | Display |
|---|---|---|
| Elapsed time | `(now - meetingStartMs) / 1000` seconds | `HH:MM:SS` monospace |
| Burn rate | `sum(active participants costPerHour)` | `{n} €/h` |
| Accumulated cost | `burnRate × (elapsedMs / 3_600_000)` | `{n.nn} €` — 2 decimal places |

## Components Involved

- `src/components/MeetingStage.tsx` — renders the UI
- `src/hooks/useMeetingState.ts` — reads state from BroadcastChannel / localStorage

## Non-Functional Requirements

- Timer updates every 1 second.
- Stage should be readable on a large projected screen (large fonts, high contrast).
