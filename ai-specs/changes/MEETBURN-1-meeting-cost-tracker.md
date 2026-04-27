# User Story: MEETBURN-1 — Meeting Cost Tracker MVP

## Original User Story

**As a** meeting participant in Microsoft Teams,
**I want to** see in real time how much the current meeting is costing,
**So that** I and my teammates can make better decisions about meeting duration and frequency.

## Description

Build a Teams Meeting App (tab extension) that:
1. Shows a **side panel** where each participant selects their professional category (with an associated hourly cost).
2. Shows a **meeting stage** (shared screen) with a live counter: elapsed time, total burn rate (€/h), and accumulated cost (€).

All state is in-memory via Live Share SDK. No backend, no database.

## Professional Categories

| Category | €/h |
|---|---|
| Analista Junior | 25 |
| Analista Senior | 45 |
| Project Manager | 65 |
| Director | 90 |
| C-Level | 130 |

## Technical Specification

See:
- `docs/product-vision.md` — goals and constraints
- `docs/architecture-design.md` — component interactions and data flow
- `docs/decisions/` — ADRs for key technical choices
- `ai-specs/specs/side-panel-spec.md` — side panel acceptance criteria
- `ai-specs/specs/meeting-stage-spec.md` — stage acceptance criteria

## Files Created

**App:**
- `src/types.ts` — `CATEGORIES`, `ParticipantData`
- `src/hooks/useLiveShare.ts` — Live Share connection and state hook
- `src/components/Config.tsx` — Teams tab configuration page
- `src/components/SidePanel.tsx` — category selector
- `src/components/MeetingStage.tsx` — live cost counter
- `src/App.tsx` — view router (config / sidePanel / stage)
- `src/App.css` — styles for both views
- `src/main.tsx` — React entry point

**Config:**
- `appPackage/manifest.json` — Teams manifest (meetingSidePanel + meetingStage)
- `teamsapp.yml` / `teamsapp.local.yml` — Teams Toolkit workflows
- `vite.config.ts` — Vite + HTTPS (port 53000)

**Tests:** (see `src/**/*.test.ts`)

## Definition of Done

- [ ] Side panel renders category list and highlights selection
- [ ] Side panel writes to `participantsMap` via `upsertParticipant`
- [ ] Stage reads `participantsMap` and displays live totals
- [ ] Stage timer uses synchronized `meetingStartMs` from `metaMap`
- [ ] App detects Teams frame context and routes correctly
- [ ] Graceful fallback when running outside Teams
- [ ] `useLiveShare` unit tests passing
- [ ] `SidePanel` component tests passing
- [ ] `MeetingStage` component tests passing
- [ ] TypeScript compiles with zero errors
- [ ] Teams manifest validates successfully

## Acceptance Criteria

See `ai-specs/specs/side-panel-spec.md` and `ai-specs/specs/meeting-stage-spec.md`.
