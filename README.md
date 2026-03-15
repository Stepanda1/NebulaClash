# Nebula Clash

Nebula Clash is a browser match-3 game with a marketing landing page, in-game economy, payments, daily rewards, leaderboard, and short-form content workflow around `https://nebulaclash.com`.

This repository is the main release project for the playable product.

## Product Snapshot

- Genre: `cosmic match-3 puzzle`
- Platform: `web`
- Public site: `https://nebulaclash.com`
- Frontend: `React 19 + TypeScript + Vite`
- Backend: `Node.js HTTP server + SQLite`
- Payments: `Robokassa`
- Analytics: `GTM`, optional `GA4`, optional `PostHog`
- Monitoring: `Sentry`

## Current Product Surface

The live product already includes:

- marketing landing page
- playable level flow
- roadmap screen
- wallet and paid coin packs
- continue flow for coins after failure
- daily rewards
- leaderboard
- share action
- legal docs and contact sections

## Core Loop

1. User lands on `nebulaclash.com`.
2. User starts a session and enters gameplay.
3. User completes levels, earns coins, and spends coins on recovery/boost actions.
4. User can buy coin packs through Robokassa.
5. User returns through daily rewards, leaderboard comparison, and progression.

## Economy Snapshot

Current economy values in code:

- starting balance: `50` coins
- continue / booster cost: `15` coins
- extra moves value: `+5`
- extra time value: `+30s`

Default coin packs:

- `pack-120`: `60` coins for `99 RUB`
- `pack-300`: `150` coins for `199 RUB`
- `pack-800`: `420` coins for `499 RUB`

Current reward systems:

- level-completion reward
- daily reward streak
- paid pack top-up

Strategy docs for metrics, economy goals, and hypotheses live in:

- `../../02_Strategy/NebulaClashHypotheses/README.md`

## Funnel And Key Events

Main funnel events already tracked in the app:

- `landing_view`
- `landing_play_click`
- `session_start`
- `level_start`
- `level_complete`
- `shop_open`
- `checkout_start`
- `payment_credited`

The current operating rule is to evaluate growth and content by movement deeper into the funnel, not by views alone.

## Project Map

- `src/`: React app, game UI, analytics integration
- `server/`: wallet, rewards, leaderboard, payment endpoints
- `public/`: static assets
- `docs/marketing/week1/`: early paid traffic and execution docs
- `progress.md`: running implementation log
- `RELEASE_AUDIT_2026-02-27.md`: release risk audit
- `ROBOKASSA_SETUP.md`: payment setup notes

## Local Development

Prerequisites:

- `Node.js 22+` recommended
- `npm`

Install:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Run backend:

```bash
npm run server
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Environment

Important frontend env vars:

- `VITE_GTM_CONTAINER_ID`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_YM_COUNTER_ID`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_SENTRY_DSN`
- `VITE_DEV_API_PROXY_TARGET`
- `VITE_CONTACT_EMAIL`
- `VITE_CONTACT_TELEGRAM`
- `VITE_CONTACT_FACEBOOK`
- `VITE_CONTACT_INSTAGRAM`

Important backend env vars:

- `API_AUTH_SECRET`
- `PUBLIC_BASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `INITIAL_COINS`
- `ROBOKASSA_MERCHANT_LOGIN`
- `ROBOKASSA_PASSWORD1`
- `ROBOKASSA_PASSWORD2`
- `ROBOKASSA_SUCCESS_URL`
- `ROBOKASSA_FAIL_URL`
- `SHOP_PACKS_JSON`

Reference values and setup details:

- `.env.example`
- `ROBOKASSA_SETUP.md`

## Payments And Persistence

- Wallet state is stored in `data/wallet-state.sqlite`.
- Orders are stored in SQLite and credited through Robokassa Result URL handling.
- The backend uses signed player sessions via `API_AUTH_SECRET`.
- Legacy JSON wallet state can be migrated into SQLite on first run.

## Documentation Sources Of Truth

Use these files as the main control layer for the product:

- product strategy hub: `../../02_Strategy/NebulaClashHypotheses/README.md`
- master metrics: `../../02_Strategy/NebulaClashHypotheses/Product/NebulaClash_Master_Metrics.md`
- economy and goals: `../../02_Strategy/NebulaClashHypotheses/Product/NebulaClash_Economy_And_Goals.md`
- hypothesis backlog: `../../02_Strategy/NebulaClashHypotheses/Product/NebulaClash_Hypothesis_Backlog.md`

## Current Priorities

- grow reliable traffic from short-form content and paid tests
- improve first-session conversion into `checkout_start`
- improve repeat play and return behavior
- keep monetization flow stable and measurable

## Notes

- `progress.md` is the best implementation changelog.
- This README is intentionally product-oriented, not a generic Vite template.
