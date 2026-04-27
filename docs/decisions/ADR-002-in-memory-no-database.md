# ADR-002: In-Memory State Only — No Database

## Status: Accepted

## Context

Participant categories and cost data need to be accessible to all meeting attendees in real time. Options considered:

- **Persist to a database** (SQL, Cosmos DB, etc.): Enables history, analytics, post-meeting reports.
- **In-memory via Live Share only**: State lives in the Fluid container for the meeting duration and is discarded afterward.

## Decision

All state is stored exclusively in the Live Share Fluid container. No database, no external storage, no backend API.

## Consequences

**Positive:**
- Zero infrastructure cost and complexity.
- No data privacy concerns — no PII leaves the Teams session boundary.
- No authentication or authorization layer needed for data access.
- Deployable as a pure static SPA.

**Negative:**
- No meeting history or cost reports available after the meeting ends.
- No analytics on meeting costs over time.

These trade-offs are explicitly acceptable for this PoC. A future ADR should revisit persistence if post-meeting reports become a requirement.
