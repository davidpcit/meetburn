# Product Vision — MeetBurn

## Problem Statement

Meetings are an invisible cost center. Participants join without awareness of the financial impact of their time. A 1-hour meeting with 5 senior professionals can cost hundreds of euros — yet this cost is never visible in the moment, making it hard to justify, shorten, or question the need for the meeting at all.

## Target Users

- **Meeting organizers** who want to encourage time discipline
- **Team leads and managers** accountable for team budget
- **Agile teams** running retrospectives, planning sessions, or stand-ups where cost visibility drives efficiency

## Core Value Proposition

MeetBurn surfaces the real-time monetary cost of a meeting directly inside Microsoft Teams. The organizer opens the app, assigns a professional category to each participant, and sees a live running total. The cost counter can be projected to the shared screen so all attendees see it.

## Key Features

| Feature | Description |
|---|---|
| **Organizer-driven** | One person manages the meeting cost; no action required from other participants |
| **Participant list** | Organizer sees all meeting participants via Teams API and assigns each a professional category |
| **Live cost counter** | Shows total cost/hour, elapsed time, and accumulated cost — updated in real time |
| **Project to stage** | Organizer can share the cost view to the meeting stage so all attendees see it |
| **No setup required** | No database, no backend, no authentication — state lives in the organizer's app for the duration of the meeting |

## Professional Categories & Rates

| Category | Rate (€/h) |
|---|---|
| Analista Junior | 25 |
| Analista Senior | 45 |
| Project Manager | 65 |
| Director | 90 |
| C-Level | 130 |

## Success Metrics

- Meeting organizers report shorter, more focused meetings
- Organizer assigns all participant categories within the first 60 seconds
- Stage view is displayed in >50% of meetings where the app is added
- Zero backend infrastructure costs (no database, no server)

## Constraints

- Runs exclusively inside Microsoft Teams meetings
- All state is ephemeral — lost when the organizer closes Teams
- Requires Teams Toolkit for packaging and deployment
- Only the organizer's view is authoritative; other participants opening the app see their own independent instance
