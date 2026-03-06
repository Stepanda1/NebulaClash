# Nebula Clash: 14-Day Revenue Plan

## Goal
Build a repeatable loop: `traffic -> first session -> first payment -> repeat payment`.

## North Star
- Primary: `payment_credited` count and revenue per day.
- Guardrails: `checkout_start -> payment_credited`, D1 retention, error rate in payment flow.

## Entry Criteria For Paid Scale
Start scaling paid traffic only if all are true for 3+ days:
- `landing_view -> landing_play_click` >= 25%
- `session_start -> level_1_complete` >= 35%
- `shop_open -> checkout_start` >= 10%
- `checkout_start -> payment_credited` >= 50%

---

## Days 1-3: Fix Core Monetization Reliability (P0)

### Tasks
- Replace file-based wallet/order state with transactional storage (SQLite/Postgres).
- Add idempotency for Robokassa webhook and safe balance updates.
- Extend payment confirmation polling window after return from payment.
- Ensure pack definitions are single-source (backend-driven to frontend).

### Success Criteria
- `payment_credit_pending` < 2% of `checkout_start`.
- No wallet desync incidents.
- 0 critical errors in payment endpoints.

---

## Days 4-7: Improve First-Purchase Conversion (P1)

### Product Experiments
- Experiment A: show shop right after `level_1_complete` vs current behavior.
- Experiment B: first pack offer card variant:
  - Version 1: current price/coins.
  - Version 2: stronger first-time value framing.
- Add clear “coins credited automatically” state in checkout return UI.

### Measurement
- Funnel: `level_1_complete -> shop_open -> checkout_start -> payment_credited`.
- Segment by source and language.

### Success Criteria
- +20% `shop_open -> checkout_start` vs baseline.
- +10% `checkout_start -> payment_credited` vs baseline.

---

## Days 8-10: Low-Budget Traffic Learning Sprint (P1)

### Setup
- 2-3 creatives (10-20 sec each).
- 2 audience hypotheses.
- Small fixed daily budget (learning only).

### Rules
- Optimize by `payment_credited`, not clicks/installs.
- Pause ad set after 2 days if:
  - CTR weak and no `checkout_start`, or
  - CAC to first payment clearly above target.

### Success Criteria
- At least 1 source/creative pair with acceptable CAC trend.

---

## Days 11-14: Retention and Repeat Revenue (P1)

### Tasks
- Add daily return mechanic (streak reward or daily claim).
- Add one re-engagement trigger in game economy (soft scarcity of boosters).
- Track repeat monetization events and 7-day payer behavior.

### KPIs
- D1 retention uplift.
- Share of users with second monetization action.
- Revenue per payer over 7 days.

---

## Weekly Reporting Template
- Traffic volume by source.
- Funnel conversion by stage.
- Revenue/day, payers/day, ARPPU.
- Top 3 blockers with action owner and ETA.

## Decision Rules
- If payment reliability fails: stop growth and fix backend first.
- If traffic is cheap but conversion weak: iterate onboarding/shop offer.
- If conversion is good and CAC acceptable: increase budget in steps of 20-30%.

