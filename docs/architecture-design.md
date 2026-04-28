# Architecture Design — MeetBurn

## System Overview

MeetBurn is a Microsoft Teams Meeting App (tab extension) with two views:

1. **Side Panel** — opened by the organizer; polls meeting participants and lets the organizer assign a professional category to each person.
2. **Meeting Stage** — optional shared projection; shows the live cost counter driven by the organizer's local state.

Both views are served from the same React SPA. The active view is determined at runtime from Teams context or a `?view=` query parameter.

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| UI Framework | React 18 + TypeScript | Standard for Teams Toolkit tab apps |
| Build Tool | Vite 5 | Fast HMR, native ESM, smaller bundles |
| State sync (side panel → stage) | URL parameters (`?rate=&start=&count=`) | Teams desktop isolates side panel and stage in separate Electron renderer processes; localStorage and BroadcastChannel do not cross process boundaries (ADR-014) |
| Teams Integration | Teams JS SDK v2 | Frame context detection, getParticipants, shareAppContentToStage |
| Styling | Plain CSS (custom) | No external UI library dependency |
| Packaging | Teams Toolkit v5 / M365 Agents Toolkit | Manifest generation, local dev HTTPS, app upload |

## Deployment & Runtime Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        DEV LAPTOP                            │
│  M365 Agents Toolkit → Publish to Org                        │
│  git push master      → GitHub Actions → GitHub Pages        │
└──────────────────────────────────────────────────────────────┘
                    │                         │
                    ▼                         ▼
         ┌──────────────────┐   ┌─────────────────────────┐
         │  GITHUB PAGES    │   │  TEAMS DEVELOPER PORTAL │
         │  davidpcit       │   │  MeetBurn (tenant catalog│
         │  .github.io      │   │  — requires admin approval)
         │  /meetburn       │   └────────────┬────────────┘
         │  React SPA       │                │
         │  (static)        │                │ app approved
         └────────┬─────────┘                │
                  │  serves app (iframe)     ▼
                  │◄──────────────  ┌────────────────────┐
                  │                 │   TEAMS (meeting)  │
                  │                 │                    │
                  │  ORGANIZER      │  OTHER PARTICIPANTS│
                  │  ┌───────────┐  │  (no app needed)   │
                  │  │Side Panel │  │                    │
                  │  │           │  │                    │
                  │  │getParticip│  │                    │
                  │  │ants() ←───┼──┤ Teams Participants │
                  │  │           │  │ API                │
                  │  │useState   │  │                    │
                  │  │(local)    │  │                    │
                  │  └─────┬─────┘  │                    │
                  │        │ localStorage +               │
                  │        │ BroadcastChannel             │
                  │        ▼                              │
                  │  ┌───────────┐                        │
                  │  │  Stage    │  ← projected to        │
                  │  │ (optional)│    shared screen       │
                  │  └───────────┘                        │
                  └───────────────────────────────────────┘
```

**Key points:**
- GitHub Pages serves static HTML/JS — no backend logic
- State lives entirely in the organizer's browser (localStorage)
- Side panel passes `rate`, `start`, `count` to stage via URL params at share-time (ADR-014)
- Stage reads URL params on mount and calculates cost locally — no cross-context sync needed
- No Live Share, no Fluid Relay, no RSC sync permissions needed
- RSC permissions required in manifest: `MeetingStage.Write.Chat`, `OnlineMeetingParticipant.Read.Chat`

## Architectural Layers

```
┌─────────────────────────────────────────────────┐
│                  React UI Layer                  │
│   SidePanel.tsx  │  MeetingStage.tsx  │ Config   │
├─────────────────────────────────────────────────┤
│              App.tsx (View Router)               │
│  Reads Teams frame context or ?view= param       │
├─────────────────────────────────────────────────┤
│         useMeetingState Hook (State Layer)       │
│  useState + localStorage + BroadcastChannel      │
├─────────────────────────────────────────────────┤
│    Teams JS SDK v2                               │
│  app / meeting / pages                           │
└─────────────────────────────────────────────────┘
```

## Component Interactions

```
Organizer (Teams client)
┌──────────────────────────────────────────────┐
│  SidePanel                                   │
│  ┌────────────────────────────────────────┐  │
│  │ meeting.getParticipants() every 15s    │  │
│  │ → participants list                    │  │
│  │                                        │  │
│  │ organizer assigns category per person  │  │
│  │ → useMeetingState (local useState)     │  │
│  │   writes to localStorage[meetingId]    │  │
│  └───────────────────┬────────────────────┘  │
│                      │ BroadcastChannel.post  │
│                      ▼                        │
│  ┌────────────────────────────────────────┐  │
│  │  MeetingStage (projected to screen)   │  │
│  │  reads localStorage[meetingId]        │  │
│  │  subscribes to BroadcastChannel       │  │
│  │  → renders cost counter               │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## Data Flow

1. **App init**: `App.tsx` calls `app.getContext()` → detects `frameContext` → routes to Side Panel or Stage.
2. **Participant poll**: `useMeetingParticipants` calls `meeting.getParticipants()` every 15 s → returns current attendees.
3. **Self-registration**: If the organizer is alone, `app.getContext()` provides their own ID and name.
4. **Category assignment**: Organizer selects a category per participant → `useMeetingState` updates local state → serialises to `localStorage[meetingId]`.
5. **Stage sync**: When organizer clicks "Proyectar", `SidePanel` calls `shareAppContentToStage` with URL params `?rate=X&start=Y&count=N`. `MeetingStage` reads those params on mount and runs a local timer from there — no BroadcastChannel needed (ADR-014).
6. **Cost calculation**: `totalCostPerHour` = sum of active participants' `costPerHour`; `totalCost` = `totalCostPerHour × elapsedHours` since meeting start.

## Key Data Structures

```typescript
// Local state only — no network, no shared container
interface ParticipantData {
  displayName: string;   // from meeting.getParticipants() or app.getContext()
  categoryName: string;  // e.g. "Project Manager"
  costPerHour: number;   // e.g. 65
  active: boolean;       // true while participant is in the meeting
}

// localStorage key: `meetburn-${meetingId}`
// BroadcastChannel name: `meetburn-${meetingId}`
// Value: { participants: Record<userId, ParticipantData>, meetingStartMs: number }
```

## Key Constraints

- **No database**: State is stored in the organizer's localStorage, ephemeral for the browser session.
- **No backend server**: Static SPA served from GitHub Pages (or localhost:53000 during dev).
- **HTTPS required**: Teams rejects tab content served over HTTP.
- **Same-origin sync**: Side panel and stage must share the same origin for localStorage and BroadcastChannel to work. Both load from `https://davidpcit.github.io/meetburn`.
- **Single organizer**: Only one instance manages participant state. If two people open the side panel simultaneously, they have independent views.

## Project Structure

```
MeetBurn/
├── docs/                      # Product & architecture docs (this file)
│   └── decisions/             # ADRs
├── ai-specs/
│   └── changes/               # Feature specs and user stories
├── src/
│   ├── types.ts               # Shared types and CATEGORIES constant
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # View router
│   ├── App.css                # All styles (side panel + stage)
│   ├── hooks/
│   │   ├── useMeetingState.ts     # Local state + localStorage + BroadcastChannel
│   │   └── useMeetingParticipants.ts  # Teams participant polling
│   └── components/
│       ├── Config.tsx         # Teams tab configuration page
│       ├── SidePanel.tsx      # Organizer UI — participant list + category assignment
│       └── MeetingStage.tsx   # Shared cost counter (reads from BroadcastChannel)
├── appPackage/
│   └── manifest.json          # Teams app manifest
├── teamsapp.yml               # Teams Toolkit provision/deploy
└── vite.config.ts             # Build config with HTTPS
```
