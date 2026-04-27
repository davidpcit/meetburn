# MEETBURN-4: Job title auto-selection via Microsoft Graph

## User Story

As a meeting participant, I want MeetBurn to automatically suggest my professional category based on my M365 job title, so I don't have to select it manually every time.

## Acceptance Criteria

1. On load, SidePanel calls `authentication.getAuthToken()` silently.
2. The token is sent to `GET /api/me` (Vercel serverless function).
3. `/api/me` exchanges the token for a Graph token via OBO and calls `GET https://graph.microsoft.com/v1.0/me?$select=jobTitle`.
4. The returned `jobTitle` is mapped to the closest CATEGORY using keyword matching (case-insensitive).
5. The matched category is pre-selected in the UI (same visual state as manual selection).
6. The participant is registered in Live Share with the auto-selected category immediately.
7. If Azure AD env vars are not set on the server, `/api/me` returns `{ jobTitle: null }` and the app behaves identically to pre-SSO: full manual category selection, no error shown.
8. If `getAuthToken` fails, Graph returns no `jobTitle`, or no keyword matches — the app shows the normal manual selector with no pre-selection.
8. The user can always override the auto-selected category by clicking another option.

## Job Title → Category Mapping

| Keywords in jobTitle (case-insensitive) | Category |
|---|---|
| junior, trainee, intern, becario | Analista Junior |
| senior, especialista, specialist, lead, tech lead | Analista Senior |
| manager, jefe, responsable, coordinator, coordinador | Project Manager |
| director, head of, vp, vice president | Director |
| ceo, cto, cfo, coo, ciso, c-level, chief | C-Level |
| (no match) | no pre-selection |

## Technical Notes

- Azure AD app registration required (user must provide CLIENT_ID, CLIENT_SECRET, TENANT_ID).
- Vercel env vars: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`.
- Manifest requires `webApplicationInfo.id` = Azure AD app client ID.
- OBO flow: SSO token → `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` → Graph token.
- Fallback is always silent — no error shown to the user for this feature.
