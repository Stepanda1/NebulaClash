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
