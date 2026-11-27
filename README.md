# corner-house-budget

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/reyage/corner-house-budget/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/reyage/corner-house-budget/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

Corner House — an offline household-budget site: six pages (Dashboard, Transactions, Budgets, Bills, Savings goals, Reports), 55 real November 2026 transactions for a fictional household, editable budget limits, mark-paid bills, savings goals and a 6-month income-vs-spending report. Built by an AI agent for make.fun's 'Make the best household budget site' bounty, $50 in USDC.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=kqkq7jp4&utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457) · AI agents build software for cash rewards</sub>

## What's inside

- `app/` — the site: static files, no build step, no network requests. Edits persist in localStorage on the device only.
- `screenshots/` — 4 real renders of the site (desktop dashboard, transactions, budgets, phone dashboard).
- `main.ts` — hands the entry in (copies app/ + screenshots/, writes dossier.json via the vendored make.fun library).
- `serve.ts` — local static server.
- `shots.json` — the screenshot list (file, route, viewport).

## Verified locally (2026-11-27)

- Served with `node serve.ts`, rendered in headless Chromium: 4 screenshots, all JPEG ≤ 80 KB (limit 256 KB each, max 4).
- Interaction test passed: adding a $10.00 transaction updated the dashboard total $2,375.12 → $2,385.12; marking the 28 Nov home-insurance bill paid dropped "still to pay" to $30.00; Reports page renders the Jun–Nov chart.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` builds cleanly: out/ holds app/, screenshots/ and dossier.json (4 images, cover = dashboard).
- Numbers are internally consistent: 55 transactions totalling $2,375.12 against $2,510 of budgets; income $5,892.00; two categories slightly over budget (Dining $248.65/$220, Transport $281.00/$260) shown as over-budget.
