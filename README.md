# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Analytics

The game now supports analytics providers via Vite env vars:

- `VITE_GA_MEASUREMENT_ID` - Google Analytics 4 measurement ID (for example `G-XXXXXXXXXX`)
- `VITE_YM_COUNTER_ID` - Yandex Metrica counter ID

If one or both variables are set, the app automatically initializes the provider(s) and sends gameplay events such as:

- `session_start`
- `level_start`
- `pause_open` / `pause_close`
- `restart_click`
- `exit_click`
- `level_complete`
- `game_over`
- `moves_checkpoint`
- `bomb_activation`
- `lightning_swap`
- `language_change`
- `sound_toggle`
- `next_level_click`

Session-level correlation is sent via `session_id` (stored in `sessionStorage`).

### PostHog

Set these env vars to enable PostHog product analytics:

- `VITE_POSTHOG_KEY` - project API key
- `VITE_POSTHOG_HOST` - optional, defaults to `https://us.i.posthog.com`

When enabled, game events are sent to PostHog via `posthog.capture(...)`.

### Sentry

Set these env vars to enable Sentry error/performance monitoring:

- `VITE_SENTRY_DSN` - your Sentry DSN
- `VITE_SENTRY_ENVIRONMENT` - optional environment name
- `VITE_SENTRY_TRACES_SAMPLE_RATE` - optional, defaults to `0.2`

Long tasks (UI lag spikes) are monitored with `PerformanceObserver` and reported as:

- analytics event: `long_task_detected`
- Sentry warning message: `long_task_detected`

Optional tuning:

- `VITE_LONG_TASK_THRESHOLD_MS` (default `200`)
- `VITE_LONG_TASK_MAX_PER_SESSION` (default `30`)

## Shop / Space Coins

The game has an in-game currency called Space Coins:

- Spend coins on extra moves (`+5`) in move-based levels
- Spend coins on extra time (`+30s`) in time-based levels

Shop supports backend-driven payments and auto top-up through Lava webhook.

### Frontend env vars

- `VITE_SHOP_PACK_SMALL_URL`
- `VITE_SHOP_PACK_MEDIUM_URL`
- `VITE_SHOP_PACK_LARGE_URL`
- `VITE_DEV_API_PROXY_TARGET` (default `http://localhost:8787`)

Frontend links are optional fallback. For automatic top-up, configure backend vars and run `server/index.mjs`.

### Backend env vars (`server/index.mjs`)

- `PORT` (default `8787`)
- `PUBLIC_BASE_URL` (public URL of backend, used in Lava `hookUrl`)
- `LAVA_SHOP_ID`
- `LAVA_SECRET_KEY`
- `LAVA_SECRET_KEY_2` (webhook verification key)
- `LAVA_CREATE_INVOICE_URL` (default `https://api.lava.ru/business/invoice/create`)
- `LAVA_SUCCESS_URL`
- `LAVA_FAIL_URL`
- `SHOP_PACKS_JSON` (optional pack config)

### Local run

1. Start backend: `npm run server`
2. Start frontend in second terminal: `npm run dev`
3. Open shop, buy a pack, complete payment, webhook credits coins automatically.

### Payout to Sber

To receive money to your own Sber card/account:

1. Use your own Lava merchant account and keys in backend env vars.
2. In Lava dashboard open `Balance -> Payout details` and add payout details.
3. Choose payout method `SBP` and select `Sberbank`.
