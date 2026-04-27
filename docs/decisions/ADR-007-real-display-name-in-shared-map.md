# ADR-007: Persist real display name in SharedMap

## Status: Superseded by ADR-012

## Context

The Meeting Stage shows "Participante" for all participants. The `displayName` field exists in `ParticipantData` but is populated with the fallback value because `upsertParticipant` can be called before `app.getContext()` resolves, or when the category is auto-selected via job title suggestion before `displayName` is available.

## Decision

Guard `upsertParticipant` calls so they only fire when `displayName` is non-empty and has been resolved from `app.getContext()`. A dedicated `useEffect` will re-call `upsertParticipant` whenever `displayName` changes and a category is already selected, ensuring the SharedMap always contains the real Teams display name.

## Consequences

- No schema change — `displayName` already exists in `ParticipantData`.
- Fixes both manual selection and auto-selection (job title) paths.
- A participant who selects before `getContext()` resolves will have their entry updated automatically once the name arrives.
