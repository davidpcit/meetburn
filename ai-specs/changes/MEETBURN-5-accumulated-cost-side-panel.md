# MEETBURN-5: Accumulated cost in side panel

## User Story

As a meeting participant, I want to see the accumulated meeting cost in my side panel, so I don't need to project the stage to know how much the meeting has cost so far.

## Acceptance Criteria

1. The side panel shows an "Coste acumulado" field below "Coste total €/h".
2. The value updates every second.
3. It uses the same `meetingStartMs` from Live Share as the Meeting Stage — clocks are synchronized.
4. Shows `0.00 €` when there are no participants or cost is zero.
5. Format: two decimal places followed by `€` (e.g. `27.43 €`).
