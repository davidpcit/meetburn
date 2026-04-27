# Product Vision — MeetBurn

## Problem Statement

Meetings are an invisible cost center. Participants join without awareness of the financial impact of their time. A 1-hour meeting with 5 senior professionals can cost hundreds of euros — yet this cost is never visible in the moment, making it hard to justify, shorten, or question the need for the meeting at all.

## Target Users

- **Meeting organizers** who want to encourage time discipline
- **Team leads and managers** accountable for team budget
- **Participants** who want to make meetings more purposeful
- **Agile teams** running retrospectives, planning sessions, or stand-ups where cost visibility drives efficiency

## Core Value Proposition

MeetBurn surfaces the real-time monetary cost of a meeting directly inside Microsoft Teams, making the invisible visible. Every participant selects their professional category once; the shared stage shows a live running total that creates a shared sense of urgency.

## Key Features

| Feature | Description |
|---|---|
| **Category selection** | Each participant picks their role (Analista Junior → C-Level) with an associated hourly rate |
| **Live cost counter** | Meeting stage shows total cost/hour, elapsed time, and accumulated cost — updated in real time |
| **Participant breakdown** | Stage lists every participant's name, category, and rate |
| **No setup required** | No database, no backend, no authentication — everything lives in Live Share memory for the duration of the meeting |

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
- Participants select their category within the first 30 seconds of joining
- Stage view is displayed in >50% of meetings where the app is added
- Zero backend infrastructure costs (no database, no server)

## Constraints

- Runs exclusively inside Microsoft Teams meetings
- All state is ephemeral — lost when the meeting ends
- Requires Teams Toolkit for packaging and deployment
- Real-time sync depends on Microsoft Live Share availability
