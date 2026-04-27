# ADR-005: Teams SSO + Graph API for job title auto-selection

## Status: Accepted

## Context

The category selection is manual. Every participant must pick their professional category each time. Microsoft Graph API exposes the `jobTitle` field from the user's M365 profile, which could be used to pre-select the closest matching category automatically.

Accessing Graph API from a Teams tab requires an Azure AD app registration and a token exchange. The current architecture has no backend and no authentication (ADR-002). Two options were considered:

- **Option A — MSAL popup in browser**: No backend needed, but popups are blocked in Teams iframes.
- **Option B — Teams SSO + Vercel serverless function (OBO flow)**: Client calls `authentication.getAuthToken()` to get a Teams SSO token, sends it to a Vercel API route (`/api/me`) which exchanges it for a Graph token via the On-Behalf-Of flow and returns `jobTitle`. Requires Azure AD registration and Vercel environment variables, but no popup and no user interaction.

## Decision

Use **Option B**: Teams SSO + Vercel serverless function with OBO flow.

- New file: `api/me.ts` (Vercel serverless function)
- New manifest field: `webApplicationInfo` with the Azure AD app client ID
- New Vercel env vars: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
- Client: calls `authentication.getAuthToken()` → POST `/api/me` → receives `jobTitle`
- `jobTitle` is mapped heuristically to the closest CATEGORY and pre-selected in the SidePanel
- Selection remains manual override — the auto-selection is a suggestion, not a lock

## Consequences

- The constraint "no authentication" from ADR-002 is partially relaxed: there is now an Azure AD app registration, but the user still does not need to log in explicitly (SSO is silent).
- Adds a backend dependency (Vercel serverless function) and Azure AD configuration.
- Job title mapping is heuristic — mismatch is possible; user can always override manually.
- If `getAuthToken` fails or Graph returns no `jobTitle`, the app falls back to full manual selection silently.
- **If Azure AD env vars are not configured on the server** (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` absent), `/api/me` returns `{ jobTitle: null }` and the app behaves identically to the pre-SSO version — full manual category selection, no error shown.
