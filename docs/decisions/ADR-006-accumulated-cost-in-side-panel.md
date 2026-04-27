# ADR-006: Show accumulated cost in side panel

## Status: Accepted

## Context

The accumulated meeting cost is only visible in the Meeting Stage (shared screen). Participants who have not projected the stage cannot see the running total from their side panel.

## Decision

Reuse `meetingStartMs` from `useLiveShare` and add a `setInterval(1000)` in `SidePanel` to calculate and display `totalCostPerHour × elapsedHours` as accumulated cost in euros.

## Consequences

- No new shared state or dependencies — the calculation already exists identically in `MeetingStage`.
- The side panel clock is driven by local `Date.now()` ticks, same as the stage. Both are anchored to the shared `meetingStartMs` from `metaMap`, so they stay synchronized across clients.
