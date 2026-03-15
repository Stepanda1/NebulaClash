# Dev Tooling

This project now includes a small tooling layer focused on faster product iteration, safer mobile UI changes, and bundle control.

## Installed tools

- `@playwright/test`
  - repeatable smoke tests for mobile flows instead of manual browser clicking
- `@axe-core/playwright`
  - quick accessibility checks for landing and UI states
- `rollup-plugin-visualizer`
  - bundle inspection when a new feature starts inflating JS payload
- `cross-env`
  - cross-platform environment variables for Windows-friendly scripts

## Scripts

- `npm run test:smoke:mobile`
  - runs the iPhone 12 smoke pass for landing, map, and core modals
- `npm run test:a11y:landing`
  - runs a focused accessibility scan of the landing
- `npm run build:analyze`
  - builds production bundle and writes bundle report to `output/bundle-analysis/stats.html`

## Why these matter for Nebula Clash

- Mobile UI regressions are one of the fastest ways to hurt retention and conversion.
- Landing accessibility and layout quality directly affect paid traffic efficiency.
- Bundle drift hurts first-load feel, especially on mobile traffic from ads and short-form content.

## Recommended usage

Run these before shipping UI-heavy changes:

1. `npm run build`
2. `npm run test:smoke:mobile`
3. `npm run test:a11y:landing`

Run this after larger feature cycles:

1. `npm run build:analyze`
