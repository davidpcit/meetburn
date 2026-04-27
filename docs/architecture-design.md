# Architecture Design — MeetBurn

## System Overview

MeetBurn is a Microsoft Teams Meeting App (tab extension) with two views:

1. **Side Panel** — per-participant, rendered in each user's Teams client; used to select a professional category.
2. **Meeting Stage** — shared projection via "share to stage"; shows the live cost counter to all attendees.

Both views are served from the same React Single Page Application. The active view is determined at runtime from Teams context or a `?view=` query parameter.

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| UI Framework | React 18 + TypeScript | Standard for Teams Toolkit tab apps |
| Build Tool | Vite 5 | Fast HMR, native ESM, smaller bundles than CRA |
| Real-time Sync | Live Share SDK v1 + Fluid Framework v1 | Native Teams meeting sync, no backend required |
| Teams Integration | Teams JS SDK v2 | Frame context detection, shareAppContentToStage |
| Styling | Plain CSS (custom) | No external UI library dependency for this PoC |
| Packaging | Teams Toolkit v5 | Manifest generation, local dev HTTPS, app upload |

## Deployment & Runtime Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEV LAPTOP                               │
│                                                                 │
│  VS Code                                                        │
│  ├── M365 Agents Toolkit  ──────────────────────────────────┐  │
│  │   └── Publish to Org                                     │  │
│  └── vercel --prod  ────────────────────────────────────┐   │  │
└────────────────────────────────────────────────────────│───│──┘
                                                         │   │
                    ┌────────────────────────────────────┘   │
                    │                                         │
                    ▼                                         ▼
         ┌──────────────────┐                   ┌─────────────────────────┐
         │     VERCEL       │                   │  TEAMS DEVELOPER PORTAL │
         │                  │                   │  (admin.teams.microsoft) │
         │  meet-burn       │                   │                         │
         │  .vercel.app     │                   │  MeetBurn (tenant catalog│
         │                  │                   │  — requires admin approval)
         │  React SPA       │                   └────────────┬────────────┘
         │  (static)        │                                │ app approved
         └────────┬─────────┘                                │
                  │                                          ▼
                  │  serves app (iframe)    ┌────────────────────────────┐
                  │◄────────────────────────│     TEAMS (meeting)        │
                  │                         │                            │
                  │   PC Participant 1      │        PC Participant 2    │
                  │  ┌──────────────────┐   │       ┌──────────────────┐ │
                  │  │  Side Panel      │   │       │  Side Panel      │ │
                  │  │  iframe →        │   │       │  iframe →        │ │
                  │  │  meet-burn       │   │       │  meet-burn       │ │
                  │  │  .vercel.app     │   │       │  .vercel.app     │ │
                  │  │                  │   │       │                  │ │
                  │  │  Select category │   │       │  Select category │ │
                  │  └────────┬─────────┘   │       └────────┬─────────┘ │
                  │           │             │                │           │
                  │           └──────────┬──┴────────────────┘           │
                  │                      │ SharedMap (set / valueChanged) │
                  │                      ▼                               │
                  │           ┌─────────────────────┐                   │
                  │           │   LIVE SHARE SDK    │                   │
                  │           │  (Fluid Framework)  │◄── Microsoft      │
                  │           │                     │    Fluid Relay     │
                  │           │  participantsMap    │    (Microsoft cloud│
                  │           │  metaMap            │    — no cost)      │
                  │           └──────────┬──────────┘                   │
                  │                      │ real-time sync                │
                  │                      ▼                               │
                  │           ┌─────────────────────┐                   │
                  │           │  Meeting Stage      │                   │
                  │           │  (shared screen)    │                   │
                  │           │                     │                   │
                  │           │  0.00 € counter     │                   │
                  │           │  participants table  │                   │
                  │           └─────────────────────┘                   │
                  │                                                      │
                  └──────────────────────────────────────────────────────┘
```

**Key points:**
- Vercel only serves static HTML/JS — no backend logic
- State sync happens entirely between Teams clients ↔ Microsoft Fluid Relay
- The dev laptop is only needed to publish new versions; participants need nothing installed
- RSC permissions required in manifest: `MeetingStage.Write.Chat`, `OnlineMeetingParticipant.Read.Chat`, `LiveShareSession.ReadWrite.Chat`

## Architectural Layers

```
┌─────────────────────────────────────────────────┐
│                  React UI Layer                  │
│   SidePanel.tsx  │  MeetingStage.tsx  │ Config   │
├─────────────────────────────────────────────────┤
│              App.tsx (View Router)               │
│  Reads Teams frame context or ?view= param       │
├─────────────────────────────────────────────────┤
│         useLiveShare Hook (State Layer)          │
│  SharedMap (participants) + SharedMap (meta)     │
├─────────────────────────────────────────────────┤
│    Live Share SDK   │   Teams JS SDK v2          │
│  Fluid Framework   │  app / meeting / pages      │
└─────────────────────────────────────────────────┘
```

## Component Interactions

```
Participant A (Teams client)          Participant B (Teams client)
┌─────────────────────┐               ┌─────────────────────┐
│  SidePanel          │               │  SidePanel          │
│  → selects category │               │  → selects category │
│  → upsertParticipant│               │  → upsertParticipant│
└────────┬────────────┘               └──────────┬──────────┘
         │ SharedMap.set(userId, data)            │
         ▼                                        ▼
    ┌─────────────────────────────────────────────────┐
    │           Live Share / Fluid Container           │
    │   participantsMap: SharedMap<userId, Data>       │
    │   metaMap: SharedMap<"meetingStart", timestamp>  │
    └──────────────────────┬──────────────────────────┘
                           │ valueChanged events
                           ▼
              ┌─────────────────────────┐
              │  MeetingStage (shared)  │
              │  reads all entries      │
              │  sums costPerHour       │
              │  calculates total cost  │
              └─────────────────────────┘
```

## Data Flow

1. **App init**: `App.tsx` calls `app.getContext()` to detect `frameContext` → routes to correct view.
2. **Live Share connect**: `useLiveShare` hook calls `client.joinContainer(schema)` → connects to Fluid container scoped to the meeting.
3. **Category selection**: `SidePanel` calls `upsertParticipant(userId, data)` → writes to `participantsMap` SharedMap.
4. **Real-time update**: Fluid emits `valueChanged` on `participantsMap` → all connected clients re-render with new state.
5. **Cost calculation**: `totalCostPerHour` = sum of all `costPerHour` values in the map; `totalCost` = `totalCostPerHour × elapsedHours`.
6. **Meeting clock**: `meetingStartMs` is set once (first writer wins) in `metaMap`; all clients read it for a synchronized elapsed time.

## Key Data Structures

```typescript
// In-memory only (Fluid SharedMap), no persistence
interface ParticipantData {
  displayName: string;   // Teams display name
  categoryName: string;  // e.g. "Project Manager"
  costPerHour: number;   // e.g. 65
}

// participantsMap: Map<userId: string, ParticipantData>
// metaMap:        Map<"meetingStart", timestamp: number>
```

## Key Constraints

- **No database**: All state is stored in Live Share (Fluid) containers, ephemeral for the meeting session.
- **No backend server**: Static SPA served from any HTTPS host (or localhost:53000 during dev).
- **HTTPS required**: Teams rejects tab content served over HTTP. `@vitejs/plugin-basic-ssl` provides self-signed cert for local dev.
- **iframe isolation**: Side panel and stage run in separate iframes; they share state only via Live Share.
- **Teams-only sync**: `LiveShareClient` requires Teams context. Outside Teams, `TestLiveShareHost` is used (no cross-client sync).

## Project Structure

```
MeetBurn/
├── docs/                      # Product & architecture docs (this file)
│   └── decisions/             # ADRs
├── ai-specs/
│   └── specs/                 # Feature specifications
│   └── changes/               # User stories
├── src/
│   ├── types.ts               # Shared types and CATEGORIES constant
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # View router
│   ├── App.css                # All styles (side panel + stage)
│   ├── hooks/
│   │   └── useLiveShare.ts    # Live Share state hook
│   └── components/
│       ├── Config.tsx         # Teams tab configuration page
│       ├── SidePanel.tsx      # Per-participant category selector
│       └── MeetingStage.tsx   # Shared cost counter
├── appPackage/
│   └── manifest.json          # Teams app manifest
├── teamsapp.yml               # Teams Toolkit provision/deploy
├── teamsapp.local.yml         # Local dev workflow
└── vite.config.ts             # Build config with HTTPS
```
