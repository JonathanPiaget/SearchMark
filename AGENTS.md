# AGENTS.md

## Project Overview

SearchMark is a cross-browser (Chrome/Firefox) web extension for efficient bookmark management with fast folder search and quick-save shortcuts. It is built with the [WXT](https://wxt.dev/) web-extension toolkit and Vue 3 + TypeScript.

Key technologies:

- **WXT** — web-extension build framework (entrypoints, manifest generation, MV3/MV2 targeting)
- **Vue 3** (Composition API, `<script setup>`) with **TypeScript**
- **Biome** — linting + formatting (tab indent, single quotes)
- **Vitest** + `wxt/testing` — unit tests with mocked extension APIs
- **fuzzysort** — fuzzy folder/bookmark search
- **@wxt-dev/i18n** — i18n (English + French)
- **unplugin-icons** with Lucide icon set
- **pnpm** — package manager (pinned via `packageManager`)

The extension surfaces are a **popup** (save + search views), a **settings** options page, and a **background** service worker (badge, quick-save command, native notifications).

## Setup Commands

- Install dependencies: `pnpm install` (runs `wxt prepare` via `postinstall`)
- Use Node `v22.15.1` (see [.nvmrc](.nvmrc)); pnpm `11.3.0` (see `packageManager` in [package.json](package.json))
- Start dev (Chrome): `pnpm run dev`
- Start dev (Firefox): `pnpm run dev:firefox`

> ⚠️ Per project convention, **do not run `pnpm run dev` yourself** — wait for the developer to start it. Agents should rely on `pnpm run check`, `pnpm run test`, `pnpm run compile`, and `pnpm run build` to validate changes.

## Development Workflow

- `pnpm run dev` / `pnpm run dev:firefox` — launch the WXT dev server with hot reload. WXT loads the extension into a browser automatically (Firefox binary configured in [web-ext.config.ts](web-ext.config.ts)).
- Source lives under `src/` (`srcDir: 'src'` in [wxt.config.ts](wxt.config.ts)); the build output goes to `.output/` (gitignored).
- A [justfile](justfile) provides shortcuts: `just chrome`, `just firefox`, `just test`, `just lint`.
- Import aliases (configured by WXT): `@/` and `~/` both map to `src/`, `@@/` and `~~/` map to the repo root. **Prefer `@/` aliases over relative imports.**

## Testing Instructions

- Run all tests: `pnpm run test` (Vitest, single run)
- Watch mode: `pnpm run test:watch`
- Focus on one test: `pnpm vitest run -t "<test name>"`
- Type-check the whole project: `pnpm run compile` (`vue-tsc --noEmit`)

Test conventions:

- Tests live in `__tests__/` folders next to the code they cover, named `*.test.ts` (e.g. [src/composables/__tests__/](src/composables/__tests__/), [src/utils/__tests__/](src/utils/__tests__/)).
- Vitest is configured via [vitest.config.ts](vitest.config.ts) using the `WxtVitest()` plugin, which mocks the `browser.*` extension APIs.
- Shared test fixtures live in [src/test-utils/](src/test-utils/) (e.g. `bookmarkFactory.ts`).
- **Add or update tests for any composable or util you change.** Business logic should be extracted into composables/utils so it is testable without a browser.

## Code Style

- **Formatter/linter: Biome** ([biome.json](biome.json)). Tab indentation, single quotes for JS/TS, organize-imports enabled.
  - Format only: `pnpm run format`
  - Lint + autofix: `pnpm run lint`
  - Both (format + lint + organize imports, autofix): `pnpm run check` — **run this after every edit and resolve all issues.**
  - `.vue` files have `noUnusedVariables` / `noUnusedImports` disabled (handled by `vue-tsc`).
- **No useless comments** — prefer clear, self-documenting code. A comment that explains *what* the code does is a signal to refactor for clarity instead.
- **Fail-fast** — throw loud errors rather than silently swallowing them or using `console.log`. Use the shared [src/utils/logger.ts](src/utils/logger.ts) where logging is appropriate.
- **DRY** — avoid duplication; extract shared logic into `src/composables/` or `src/utils/`.
- **Minimal impact** — touch only what is necessary; keep changes simple and focused (one concern per change).

## Project Structure

```
src/
├── entrypoints/
│   ├── popup/          # Main popup UI (App.vue + components/)
│   ├── settings/       # Options page
│   ├── background.ts   # Service worker: badge, quick-save command, NOTIFY → native notifications
│   ├── shared-forms.css
│   └── theme-variables.css
├── composables/        # Reusable Vue composition logic (+ __tests__/)
├── utils/              # Framework-agnostic helpers (+ __tests__/)
├── test-utils/         # Test fixtures/factories
├── locales/            # en.yml, fr.yml (@wxt-dev/i18n)
└── assets/
```

Key behaviors agents should respect (see [CLAUDE.md](CLAUDE.md) for full detail):

- **Permissions** (declared in [wxt.config.ts](wxt.config.ts)): required `bookmarks`, `tabs`, `storage`; optional `notifications`. There is **no content script and no `<all_urls>` host permission** — user feedback uses the `notifications` API, fired from the background.
- **Keyboard shortcuts**: `Ctrl/Cmd+Shift+X` opens the popup via the native browser-action command (`_execute_action` on MV3 / `_execute_browser_action` on MV2 Firefox) — no background handler. `Ctrl/Cmd+Shift+B` is the native `quick-save` command handled in `background.ts`. `Alt+←` / `Alt+→` switch popup Save/Search views (handled in `popup/App.vue`, not a browser command, not persisted).
  - Do **not** use `Ctrl/Cmd+Shift+S` (collides with Firefox screenshot).
- **Notifications**: popup actions send `{ type: 'NOTIFY', message }` over `runtime.sendMessage`; the background `showNotification` helper calls `browser.notifications.create`.

## Build and Deployment

- Production build (Chrome): `pnpm run build` → `.output/chrome-mv3/`
- Production build (Firefox): `pnpm run build:firefox` → `.output/firefox-mv2/`
- Distributable zips: `pnpm run zip` / `pnpm run zip:firefox`
- Bundle analysis: `pnpm run analyze` (writes `stats.html`)
- Manifest is generated from [wxt.config.ts](wxt.config.ts) (MV3 for Chrome, MV2 for Firefox) — never hand-edit a generated manifest.
- Release is driven by GitHub Actions ([.github/workflows/release.yml](.github/workflows/release.yml), `manual-release.yml`).

## CI / Pull Request Guidelines

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs on Node 22 and must pass before merge:

1. **pre-commit** hooks (see [.pre-commit-config.yaml](.pre-commit-config.yaml)): Biome check, trailing-whitespace/EOF fixers, YAML/JSON/TOML checks, `actionlint`, `zizmor`, private-key detection.
2. `pnpm run check` (Biome)
3. `pnpm run test` (Vitest)
4. `pnpm run build`

Before handing back a change, locally ensure these pass: `pnpm run check`, `pnpm run compile`, `pnpm run test`, and (when relevant) `pnpm run build`. `just lint` runs `pre-commit run --all-files` plus `pnpm run compile`.

Commit / PR conventions:

- **Conventional commits**, lowercase (e.g. `feat: …`, `refactor: …`, `chore: …`) — matches the existing git history.
- **The developer reviews and commits.** Hand work back in small, logical steps with a suggested commit message; do not commit or push unless asked.

## Additional Notes

- Internationalization: every user-facing string must exist in both [src/locales/en.yml](src/locales/en.yml) and [src/locales/fr.yml](src/locales/fr.yml).
- Theming uses CSS variables ([src/entrypoints/theme-variables.css](src/entrypoints/theme-variables.css)) with Auto/Light/Dark modes persisted in storage and synced across popup + settings.
- Icons come from Lucide via `unplugin-icons`; import as components (e.g. `import IconSun from '~icons/lucide/sun'`).
