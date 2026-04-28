# ADR-014: URL Parameters for Side Panel → Stage State Transfer
## Status: Accepted

## Context

ADR-012 assumed that the side panel and meeting stage iframes run in the same browser tab group and can therefore share state via `BroadcastChannel` and `localStorage`.

Empirical testing on Teams desktop (Electron) revealed that the side panel and the meeting stage are loaded in **separate renderer processes**. `BroadcastChannel` and `localStorage` are process-scoped in Electron — they do not cross renderer process boundaries. As a result, the stage always starts with zero participants and never receives updates from the side panel.

An attempt to encode full participant state as a `?state=` URL parameter also failed: the serialized JSON grows large enough that Teams may truncate or reject the URL, and the data is stale the moment it is set (no live updates).

## Decision

Replace the BroadcastChannel-based stage sync with a **minimal URL parameter approach**:

When the organizer clicks "Proyectar en pantalla compartida", `SidePanel` calls `meeting.shareAppContentToStage` with a URL containing three query parameters:

| Param | Type | Description |
|---|---|---|
| `rate` | number | Active cost per hour at the moment of sharing (€/h) |
| `start` | number | Meeting start timestamp in milliseconds (Unix epoch) |
| `count` | number | Number of active participants at the moment of sharing |

Example:
```
https://davidpcit.github.io/meetburn/index.html?view=stage&rate=155&start=1714300000000&count=3
```

`MeetingStage` reads these three params directly from `URLSearchParams` on mount. It does **not** use `useMeetingState` or attempt any BroadcastChannel subscription. The timer and accumulated cost are derived locally from `start` and `rate`.

## Consequences

**Positive:**
- Completely bypasses the renderer-process isolation problem — no cross-context communication needed.
- Stage URL is small and always valid.
- Stage works immediately on first render without waiting for any sync.
- No regression risk on web/mobile Teams (where BroadcastChannel may work — the URL param approach works everywhere).
- Fixes the stale `meetingStartMs` bug: `start` always reflects the value at share-time.

**Negative:**
- Stage shows a **snapshot** of the state at the moment of sharing, not live updates. If the organizer changes a category after sharing, the stage does not reflect the change unless the organizer stops and re-shares.
- The participant table (individual names and categories) is **not shown** in the stage — only aggregate metrics (timer, accumulated cost, €/h, count).
- This is acceptable for the PoC scope: the stage is a "cost clock for the room", not a detailed breakdown.

## Alternatives Considered

- **Full `?state=` JSON blob** — tried and failed (URL length, stale data).
- **Server-Sent Events / WebSocket backend** — violates the zero-backend constraint (ADR-002).
- **Revert to Live Share** — re-introduces the RSC admin permission blocker (ADR-012 context).
