# Nebula Clash n8n Starter

This folder adds a separate automation runtime for Nebula Clash without mixing `n8n` into the web game's own dependencies.

## Why this exists

Nebula Clash already has:

- a paid traffic tracker in `docs/marketing/week1/WEEK1_DAILY_TRACKER.csv`
- a short-form content tracker in `../../03_Marketing/Videos/reels_metrics_tracker.md`
- a reels manifest in `../../03_Marketing/Videos/output/content_reels/reels_manifest.json`

The useful automation layer is not "more AI inside the game build". The useful layer is:

1. collect operating inputs
2. generate a review
3. trigger a weekly decision cycle

## Included pieces

- `docker-compose.yml` to run `n8n` locally
- `.env.example` for local runtime values
- `npm run report:growth` in the project root
- `scripts/generate-growth-review.mjs` for a local growth report

## Start n8n

From this folder:

```bash
cp .env.example .env
docker compose up -d
```

Open:

```text
http://localhost:5678
```

## Recommended first workflow

Build this in `n8n`:

1. `Cron` every Monday morning
2. `Execute Command`
3. command:

```bash
cd /workspace && npm run report:growth
```

4. `Read File` from:

```text
/workspace/output/growth/growth-review.md
```

5. send the result to your preferred destination:

- Telegram
- email
- Notion
- Google Docs

## Good Nebula Clash automations

### 1. Weekly growth review

Use:

- `WEEK1_DAILY_TRACKER.csv`
- reels tracker
- reels manifest

Output:

- one markdown review
- top creatives by `payment_credited`
- next 3 reel candidates

### 2. Post-publication reminder

Trigger:

- a new row added to your posting tracker or a manual webhook

Action:

- remind you to fill `landing_view`, `checkout_start`, and `payment_credited`

### 3. Hypothesis review handoff

Trigger:

- weekly report generated

Action:

- create a task to update `NebulaClash_Hypothesis_Backlog.md`

## Boundary

Keep `n8n` operational and external.

Do not add it to the browser game bundle or runtime. It is an ops tool, not an app dependency.
