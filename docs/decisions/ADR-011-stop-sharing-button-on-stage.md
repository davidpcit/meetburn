# ADR-011: Stop sharing button on Meeting Stage
## Status: Accepted
## Context
Once the organizer projects MeetBurn to the shared screen there is no in-app way to stop the projection; the user must use Teams native controls.
## Decision
Add a "Dejar de compartir" button in `MeetingStage` that calls `meeting.stopSharingAppContentToStage(callback)`. The button is always visible on the stage.
## Consequences
- Organizer can stop the stage projection from within the app.
- `stopSharingAppContentToStage` is not typed in Teams JS SDK v2; cast via `(meeting as unknown as {...})`.
