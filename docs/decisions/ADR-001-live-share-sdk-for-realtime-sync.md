# ADR-001: Use Live Share SDK for Real-Time State Synchronization

## Status: Superseded by ADR-012

## Context

The meeting stage must show each participant's category and the running cost total in real time across all clients. Several options exist for real-time sync inside a Teams meeting:

- **Live Share SDK (Fluid Framework)**: Native Microsoft SDK for Teams meeting apps. Uses Fluid Framework's SharedMap under the hood. Scoped to the meeting session automatically.
- **Azure SignalR / WebSockets**: Requires a backend server and connection management.
- **Azure Fluid Relay (standalone)**: Requires provisioning and authentication outside of Teams.
- **Polling a shared API**: Adds backend dependency, introduces latency, poor UX.

## Decision

Use `@microsoft/live-share` v1 with `fluid-framework` v1 (SharedMap) as the sole mechanism for real-time state synchronization.

The hook `useLiveShare` wraps the connection lifecycle and exposes a typed state API. Outside Teams (local dev), it falls back to `TestLiveShareHost` which creates an in-memory container for UI development.

## Consequences

**Positive:**
- No backend server required.
- Container is automatically scoped to the Teams meeting — no session management.
- Sub-second propagation latency for SharedMap writes.
- Works with Microsoft's official Teams meeting extensibility model.

**Negative:**
- State is lost when the meeting ends (no persistence). This is acceptable per requirements.
- `TestLiveShareHost` does not sync across browser windows; local multi-client testing requires the Teams Test Tool or actual Teams.
- Tied to Microsoft's SDK versioning and Live Share availability.
