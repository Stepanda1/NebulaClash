# Nebula Clash Docs - Agent Context

Last updated: 2026-03-09
Repo path: `NebulaClashRelease v1.0.0`
Current branch: `main`
Current HEAD (at time of writing): `354cbb7`

## 1. What this project is
Nebula Clash is a web match-3 game (React + TypeScript + Vite) with:
- gameplay progression (60 levels, multiple goal types, boss levels)
- roadmap/map screen for level selection
- in-game economy (Space Coins)
- payment flow (Robokassa via backend)
- legal/guide/feedback/admin UI modules
- analytics + monitoring (GTM/GA/Yandex/PostHog + Sentry)
- rewards/meta systems (daily rewards, level completion rewards, leaderboard)

This folder also includes marketing docs for content/traffic operations (`docs/marketing/week1`).

## 1.1 Task execution rule

When handling any non-trivial request in this project, Codex should decompose the task into small concrete steps before making changes.

Preferred decomposition pattern:

1. inspect current state
2. identify the smallest safe implementation slices
3. implement one slice at a time
4. verify each slice
5. summarize what remains and then continue

Do not treat large multi-part requests as one opaque task when they can be split into smaller executable units.

## 2. High-level architecture

### Frontend
- Framework: React 19 + TypeScript
- Build: Vite 6
- Styling: Tailwind CSS 4 + custom CSS (`src/index.css`)
- Animation/UI motion: Framer Motion
- Main entry: `src/main.tsx`
- Main screen orchestrator: `src/App.tsx`
- Core game state machine: `src/hooks/useGame.ts`
- Wallet/payment/rewards client: `src/hooks/useWallet.ts`

### Backend
- Runtime: Node.js ESM (`server/index.mjs`)
- HTTP server: native `node:http`
- Storage: SQLite (`data/wallet-state.sqlite`) via `node:sqlite` (`DatabaseSync`)
- API prefix: `/api/*`
- Auth: signed bearer session token (`API_AUTH_SECRET`)

### Data model (SQLite)
Tables in `server/index.mjs`:
- `wallets`
- `orders`
- `reward_claims`
- `daily_rewards`
- `leaderboard_profiles`

## 3. Important directories and files

### Root
- `package.json` - scripts and dependencies
- `vite.config.ts` - Vite config + `/api` dev proxy
- `deploy-per.ps1` - main deployment script (frontend and optional backend)
- `.env.example` - canonical env template
- `.env.production` - production env values (contains real keys in current state)
- `progress.md` - chronological implementation log and production notes

### Frontend (`src`)
- `App.tsx` - app-level state, screen switching, modals, analytics hooks
- `hooks/useGame.ts` - board processing loop, goal checks, level transitions
- `hooks/useWallet.ts` - wallet init, spend, payments, rewards, leaderboard API calls
- `logic/boardUtils.ts` - board generation, match detection, special effects, gravity
- `logic/levelProgress.ts` - level config generator + goal reach rules
- `components/*` - UI modules (roadmap, pause menu, shop, admin, legal, etc.)
- `analytics.ts` - event routing (GTM/GA/YM/PostHog) + funnel normalization
- `monitoring.ts` - Sentry init + long task observer
- `config/appConfig.ts` - gameplay constants and env-driven helpers
- `i18n.ts` - RU/EN copy dictionary

### Backend (`server`)
- `index.mjs` - full API implementation
- `reset-state.mjs` - resets legacy JSON wallet state (kept for compatibility)

### Assets (`public`)
- audio: `bgm.mp3`, `bgm.ogg`
- visual assets: `sprites.png`, `gems_new.png`, roadmap background SVG
- server hardening/static behavior: `.htaccess`

### Operations docs (`docs/marketing/week1`)
- growth plan / execution runbook / UTM and caption CSVs

## 4. Frontend app flow

Primary states in `App.tsx`:
- marketing landing (`isMarketingLandingOpen`)
- roadmap/map (`isMapOpen`)
- gameplay view (default after map start)

Map screen (`SpaceRoadmap`):
- level selection and start
- map settings (language/sound/legal/share)
- pinned left buttons for Daily and Top widgets
- Daily + Leaderboard interfaces are shown as map-level modals in `App.tsx`

Gameplay screen:
- board + HUD + boosters + shop access
- pause menu (`PauseMenu`)
- game over / level up / legal/guide/shop/admin overlays

## 5. Game mechanics summary

Board:
- 8x8 (`ROWS`, `COLS` in `boardUtils.ts`)
- starter board generated without immediate matches and with at least one valid move

Special mechanics supported:
- `bomb`
- `lightning`
- `cross`
- `pulse`
- `nova`
- plus chain expansion logic for combo effects

Goal types (`logic/levelProgress.ts`):
- `collect`
- `collect_multi`
- `bombs`
- `lightning`
- `special`
- `combo_x5`
- `trash`
- `boss`

Levels:
- 60-level pattern with onboarding overrides for first levels
- second sector after level 30
- boss levels in cycle

Performance handling:
- low-performance mode in `App.tsx` (uses reduced motion / hardware heuristics)
- simplified visuals/animations when enabled

## 6. Economy, rewards, leaderboard

### Wallet / coins
`useWallet.ts` handles:
- session bootstrap `/api/session/init`
- read wallet `/api/wallet`
- spend coins `/api/wallet/spend`

### Payments
- invoice creation: `/api/payments/robokassa/create-invoice`
- status polling: `/api/payments/order-status`
- webhook/result endpoint: `/api/payments/robokassa/result`
- frontend confirms credit after return flow before showing success

### Rewards
- daily status: `/api/rewards/daily-status`
- daily claim: `/api/rewards/daily-claim`
- level completion reward: `/api/rewards/level-complete`

### Leaderboard
- submit profile/progress: `/api/leaderboard/submit`
- read top list: `/api/leaderboard/top?limit=...`

## 7. Backend API map

Public/light:
- `GET /api/health`

Session/auth:
- `POST /api/session/init`
- `POST /api/admin/session`

Wallet/auth-protected:
- `GET /api/wallet`
- `POST /api/wallet/spend`

Rewards/auth-protected:
- `GET /api/rewards/daily-status`
- `POST /api/rewards/daily-claim`
- `POST /api/rewards/level-complete`

Leaderboard:
- `GET /api/leaderboard/top` (no auth)
- `POST /api/leaderboard/submit` (auth)

Payments:
- `POST /api/payments/robokassa/create-invoice` (auth)
- `GET /api/payments/order-status` (auth)
- `GET|POST /api/payments/robokassa/result` (provider callback)

Admin:
- `POST /api/admin/grant-coins` (admin token)

Security/rate limits:
- per-endpoint rate limiting (`enforceRateLimit`)
- CORS allowlist + host checks
- signed bearer tokens (HMAC)
- security headers applied globally

## 8. Environment and secrets

Main template: `.env.example`.

Key groups:
- analytics/monitoring: `VITE_GTM_CONTAINER_ID`, `VITE_GA_MEASUREMENT_ID`, `VITE_YM_COUNTER_ID`, `VITE_POSTHOG_*`, `VITE_SENTRY_*`
- backend/auth/payments: `API_AUTH_SECRET`, `ROBOKASSA_*`, `SHOP_PACKS_JSON`, `PUBLIC_BASE_URL`, `CORS_ALLOWED_ORIGINS`
- contacts/legal display: `VITE_CONTACT_*`, seller identity vars

Important note:
- `.env.production` currently contains real production values (including monitoring keys). Treat this as sensitive operational data.

## 9. Build, run, test

Scripts (`package.json`):
- `npm run dev` - Vite dev server
- `npm run server` - backend server
- `npm run build` - `tsc -b && vite build`
- `npm run preview` - preview build
- `npm run lint` - eslint

Local dev typical flow:
1. `npm run server`
2. `npm run dev`
3. open app and test with backend proxy (`/api` -> `localhost:8787`)

Known environment caveat in this workspace:
- sandbox runs often fail with `spawn EPERM` for Vite/esbuild and Playwright browser startup; build/preview/tests often need elevated execution.

## 10. Deployment model

Main deploy script: `deploy-per.ps1`
- always builds frontend first
- uploads `dist` to production path
- can optionally upload backend (`-UploadBackend`)
- can optionally reset backend state (`-ResetBackendState`, default true only when backend upload path used)

Operational details from script:
- host: `37.140.192.43`
- user: `u3426655`
- site path: `/var/www/u3426655/data/www/nebulaclash.com`
- backend path: `/var/www/u3426655/data/nebulaclash-backend`
- supports PuTTY (`pscp/plink`) with `NEBULACLASH_DEPLOY_PASSWORD`

Current practice in this repo history:
- frontend often deployed via `deploy-per.ps1`
- backend uploaded only when server changes are needed

## 11. Analytics + monitoring behavior

`analytics.ts`:
- initializes GTM by default (`GTM-54KD4D8H` fallback)
- dispatches events to `window.dataLayer`
- supports direct GA fallback when GTM disabled
- optional Yandex Metrica + PostHog
- adds session_id and UTM attribution
- emits unified `funnel_step` events from core gameplay/commercial events

`monitoring.ts`:
- Sentry init from env
- long-task observer -> analytics event + Sentry warning

## 12. Current feature status snapshot (based on recent commits + progress.md)

Implemented and live:
- roadmap screen redesign and settings
- pause/settings redesign with share button
- coin widget and booster UX improvements
- level completion rewards
- daily rewards
- leaderboard submission/view
- share game flow with Web Share + clipboard fallback
- pinned Daily/Top controls on roadmap
- roadmap Daily/Top tap opening fixed and validated via Playwright (`rank=1`, `daily=1`)

Recent UX-sensitive area:
- roadmap scroll and pinned buttons were adjusted multiple times; keep regression checks on mobile scroll + tap behavior mandatory after changes.

## 13. Open risks / TODOs inherited from progress log

Still relevant from `progress.md`:
- run full payment e2e validation on real production flow after changes touching wallet/payment paths
- verify visual correctness after major UI edits on low-end phones
- monitor CSP interactions for external scripts (consent/cmp references noted historically)

## 14. Agent working agreement for this repo

When touching this project:
1. Read `progress.md` first for historical context and known pitfalls.
2. If editing roadmap/pause/UI overlays, verify both:
   - map scroll still works
   - taps on pinned UI elements still open expected interface
3. For reward/leaderboard/payment changes, test auth/session + backend responses, not only frontend state.
4. Run `npm run build` before commit.
5. For deploy requests:
   - push to `main`
   - run `deploy-per.ps1` (frontend-only unless backend changed)
6. Never commit secrets from local memory files; keep sensitive deployment values outside git where possible.

## 15. Quick restore checklist (for a new agent)

Minimal context restore sequence:
1. Open `progress.md` (latest state + deploy history).
2. Open `src/App.tsx` (screen routing + all major overlays).
3. Open `src/hooks/useGame.ts` and `src/logic/boardUtils.ts` (core mechanics).
4. Open `src/hooks/useWallet.ts` + `server/index.mjs` (economy/payment/rewards APIs).
5. Confirm env setup via `.env.example`.
6. Validate build: `npm run build`.
7. If requested: deploy with `deploy-per.ps1`.
