# ADR-003: Vite as Build Tool

## Status: Accepted

## Context

Teams Toolkit React tab apps can be scaffolded with Create React App (CRA) or Vite. CRA is deprecated upstream (react-scripts is no longer maintained). Teams Toolkit v5 now defaults to Vite.

## Decision

Use Vite 5 with `@vitejs/plugin-react` and `@vitejs/plugin-basic-ssl` for the development and build pipeline.

- Dev server on port 53000 (Teams Toolkit default for tab apps) with HTTPS via self-signed cert.
- Production build outputs to `dist/`.

## Consequences

**Positive:**
- Fast HMR during development.
- Native ESM support aligns with modern package ecosystem.
- `@vitejs/plugin-basic-ssl` removes the need to manually manage certificates for local HTTPS.
- Active maintenance and Teams Toolkit alignment.

**Negative:**
- `react-scripts` test runner (Jest) is not available; Vitest is used instead.
- Minor config differences from CRA that must be accounted for in Teams Toolkit documentation.
