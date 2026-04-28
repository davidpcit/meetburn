# ADR-013: Migrate hosting from Vercel to GitHub Pages

## Status: Accepted

## Context

MeetBurn is a 100% static SPA (no server-side logic). After removing Live Share in MEETBURN-10, there is no backend dependency whatsoever. Vercel was being used purely as a static file host, but the Git integration was never properly connected, requiring manual deploys. GitHub Pages offers equivalent static hosting with zero additional accounts, native GitHub Actions integration, and automatic deploys on push to `master`.

## Decision

Host the production build on **GitHub Pages** at `https://davidpcit.github.io/meetburn/`.

- Build via GitHub Actions on every push to `master`
- Deploy to the `gh-pages` branch using `actions/deploy-pages`
- Vite `base` set to `/meetburn/` so asset paths resolve correctly under the sub-path
- `env/.env.dev` updated: `TAB_DOMAIN=davidpcit.github.io`, `TAB_ENDPOINT=https://davidpcit.github.io/meetburn`
- Manifest uses `${{TAB_ENDPOINT}}` for full URLs and `${{TAB_DOMAIN}}` only for `validDomains`
- `@vercel/node` removed from `package.json`

## Consequences

- **Positive**: Zero additional accounts or config; deploy is fully automatic on push; free indefinitely.
- **Positive**: Eliminates Vercel dashboard dependency and manual deploy step.
- **Neutral**: URL changes from `meet-burn.vercel.app` to `davidpcit.github.io/meetburn` — Teams app manifest and `env/.env.dev` must be updated accordingly.
- **Neutral**: `basicSsl` plugin remains for local dev only; production build has no HTTPS plugin (GitHub Pages provides HTTPS natively).
