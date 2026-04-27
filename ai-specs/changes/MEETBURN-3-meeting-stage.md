# Feature Spec: Meeting Stage — Live Cost Counter

## Overview

The meeting stage is a shared view projected to all meeting participants. It shows a live running cost counter that updates in real time as participants select their categories.

## User Story

**As a** meeting participant viewing the shared stage,
**I want to** see the accumulated cost and current burn rate of the meeting in real time,
**So that** the team has a shared sense of the financial impact and can make informed decisions about meeting duration.

## Acceptance Criteria

**AC1: Elapsed time is synchronized**
- Given the stage loads
- When `meetingStartMs` is read from `metaMap`
- Then the timer counts up from that timestamp (not from when the stage was opened)
- And all participants see the same elapsed time

**AC2: Total cost per hour reflects all participants**
- Given participants A, B, C have selected categories
- When the stage renders
- Then `totalCostPerHour` = sum of all `costPerHour` values in `participantsMap`

**AC3: Accumulated cost updates every second**
- Given `totalCostPerHour` and `elapsedHours` are known
- Then `totalCost = totalCostPerHour × elapsedHours` is recalculated every second
- And displayed prominently in the UI

**AC4: Participant table shows breakdown**
- Given participants have selected categories
- When the stage renders
- Then a table shows each participant's display name, category, and rate

**AC5: Empty state is handled**
- Given no participant has selected a category yet
- When the stage renders
- Then a waiting message is shown instead of an empty table

**AC6: Stage connects independently to Live Share**
- Given the stage runs in a separate iframe from the side panel
- When it loads
- Then it independently calls `useLiveShare` and connects to the same Fluid container
- And receives the same state as the side panel

## Displayed Values

| Value | Formula | Display |
|---|---|---|
| Elapsed time | `(now - meetingStartMs) / 1000` seconds | `HH:MM:SS` monospace |
| Burn rate | `sum(participants[*].costPerHour)` | `{n} €/hora` |
| Accumulated cost | `burnRate × (elapsedMs / 3_600_000)` | `{n.nn} €` — 2 decimal places |

## Components Involved

- `src/components/MeetingStage.tsx` — renders the UI
- `src/hooks/useLiveShare.ts` — provides `participants`, `totalCostPerHour`, `meetingStartMs`

## Non-Functional Requirements

- Timer updates every 1 second (`setInterval` with 1000ms).
- Interval is cleared on component unmount.
- Stage should be readable on a large screen projected to a room (large font sizes, high contrast).
