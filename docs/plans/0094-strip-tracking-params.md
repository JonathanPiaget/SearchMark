# Plan: strip tracking parameters from the saved URL (#94)

Issue: https://github.com/JonathanPiaget/SearchMark/issues/94
Glossary term: **Tracking parameter** in [GLOSSARY.md](../../GLOSSARY.md).

## Progress

- [x] Step 1: `stripTrackingParams` util + unit tests, unwired
- [x] Step 2: setting (on by default) + wiring in `getCurrentTab` and the badge listener
- [x] Step 3: Save view note "N tracking parameters removed · Restore" + e2e
- [x] Step 4 (after review): Restore/Remove toggle + parameter names shown as tags in the note

Tick a box only when the step's checks are green and it has been handed back.
Each step is one commit the developer reviews alone. Stop after each step; do not commit or push (see AGENTS.md).

## Context for the implementing agent

Today the tab URL flows raw to three places:

- `getCurrentTab()` in `src/utils/tabs.ts` feeds the Save view (`src/entrypoints/popup/App.vue`, `loadCurrentTab`) and Quick Save (`src/utils/seeLater.ts`, `quickSave`).
- The badge listener in `src/entrypoints/background.ts` calls `updateBadgeForTab(tabId, url)` from `src/utils/badge.ts`.
- `findBookmarksByUrl` in `src/utils/bookmark.ts` compares URLs with strict equality. So the cleaned URL must be used consistently wherever the tab URL is read, or the badge and the "Existing bookmark" list stop matching a bookmark saved clean.

Decisions already taken with the developer (do not reopen them):

- **Closed list only.** Prefix `utm_` plus exact names `fbclid gclid dclid gbraid wbraid msclkid mc_cid mc_eid igshid yclid _hsenc _hsmi ref_src twclid ttclid li_fat_id`, compared lowercase. No generic query stripping, no per-domain rules (ClearURLs), no `rel=canonical` (would need a content script or `scripting` + host permission, which the extension refuses).
- **Rewrite only when something was removed.** If no tracker is present, return the original string byte-identical (the `URL` API re-encodes `%20` to `+`, which would break strict URL matching for already-saved bookmarks). Non-`http(s)` URLs and unparsable strings are returned untouched. `URL` already drops an empty `?` and keeps the `#fragment`.
- **Single point of cleaning**: where the tab URL is read, not at save time. Known trade-off: a bookmark saved earlier _with_ `?utm_…` no longer lights the badge.
- **Setting**: "Remove tracking parameters from saved URLs", on by default, in the Settings page saving section (next to See Later folder / Notifications), with a help line citing `utm_source`, `fbclid`, `gclid`. Same storage pattern as `useCachedFlag` in `src/composables/useCachedFlag.ts` (`storage.defineItem<boolean>('local:<key>', { fallback: true })`). When off, nothing is cleaned anywhere.
- **Save view transparency**: when parameters were removed, a discreet line under the URL field listing the removed parameter names as tags, with a Restore / Remove toggle. Restore puts the raw tab URL back in the URL field only (the Existing bookmark list is unchanged); Remove puts the cleaned URL back. The line disappears when the user edits the URL by hand. (Step 4 replaced the original "N tracking parameters removed · Restore" line after review.) Nothing is shown when the URL was already clean.
- **Quick Save** notification text is unchanged.
- No ADR: the decision is reversible.

Conventions: Biome (tabs, single quotes), `pnpm run check` after every edit, tests in `__tests__/` next to the code, every user-facing string in both `src/locales/en.yml` and `src/locales/fr.yml`, no useless comments, fail fast.

## Step 1: util + tests (unwired)

New `src/utils/trackingParams.ts`, same shape as the other small utils (named arrow exports, e.g. `src/utils/foldAccents.ts`):

```ts
export interface StrippedUrl {
	url: string;
	removed: string[]; // parameter names removed, in URL order
}
export const stripTrackingParams = (url: string): StrippedUrl
```

`removed` carries the names, not a boolean: step 3 needs the count, step 2 only reads `.url`.

Tests in `src/utils/__tests__/trackingParams.test.ts`:

- removes `utm_*` and listed names, keeps other params, reports names in order
- URL with only trackers → no trailing `?`
- fragment preserved
- URL without trackers returned byte-identical, including one with `%20` in the query
- `chrome://extensions?utm_source=x` and `file:` URLs untouched
- unparsable string untouched
- key matching is case-insensitive (`UTM_Source`)

Checks: `pnpm run check && pnpm run compile && pnpm run test`.
Commit: `feat(utils): add stripTrackingParams`

## Step 2: setting + wiring

- Storage flag `local:stripTrackingParams`, fallback `true`. Read it with `storage.defineItem(...).getValue()` where the URL is read; the Settings page uses `useCachedFlag` for the toggle like the existing toggles in `src/entrypoints/settings/App.vue`.
- `getCurrentTab()` returns the cleaned URL when the flag is on. It also needs to expose the raw URL and the removed names for step 3: extend its return type (e.g. `{ url, title, rawUrl, removedParams }`) and update `src/utils/__tests__/tabs.test.ts` and any caller type (`src/utils/seeLater.ts`, `src/entrypoints/popup/App.vue`).
- `background.ts` tab listeners: pass the cleaned URL to `updateBadgeForTab` when the flag is on. Put the "read flag, clean URL" logic in one shared helper used by both `tabs.ts` and the badge path, so the rule lives once.
- i18n keys (en + fr): setting label and description.
- Tests: `tabs.test.ts` with flag on/off, a badge test with a tracked tab URL matching a clean bookmark, seeLater test for a tracked tab (use `fakeBrowser` from `wxt/testing`, pattern of the existing tests).

Checks: `pnpm run check && pnpm run compile && pnpm run test`, and `pnpm run test:e2e` since `settings/App.vue` changes. Check the Settings page renders in Chrome (see AGENTS.md "Checking the popup in Chrome").
Commit: `feat(settings): remove tracking parameters from saved urls`

## Step 3: Save view note + Restore

- In `src/entrypoints/popup/App.vue` keep `rawUrl` and `removedParams` from `getCurrentTab()`. Below the URL field in `src/entrypoints/popup/components/BookmarkForm.vue` (or just under it in `App.vue`, whichever stays smaller) show, only when `removedParams.length > 0` and the field still holds the cleaned URL: "N tracking parameters removed · Restore". Restore sets `bookmarkUrl` to `rawUrl` and hides the line. Do not re-run `searchByUrl`.
- i18n keys (en + fr) with plural handling as the existing locale files do it.
- e2e in `e2e/`: seed a tab with `?utm_source=x`, open `popup.html`, assert the URL field is clean, the note is visible, click Restore, assert the raw URL and that the note is gone. Follow `e2e/fixtures.ts`.

Checks: `pnpm run check && pnpm run compile && pnpm run test && pnpm run test:e2e`; screenshot the popup in Chrome.
Commit: `feat(popup): show removed tracking parameters with restore`

## Step 4 (after review): Restore/Remove toggle + parameter names

- Replace the count with the removed parameter names shown as tags under the URL field.
- Restore keeps the line and turns the link into Remove, which puts the cleaned URL back. The line hides when the URL field holds neither the cleaned nor the raw URL.
- i18n keys `trackingParamsRemoved`, `trackingParamsKept`, `remove` (en + fr); extend the e2e test.
  Checks: `pnpm run check && pnpm run compile && pnpm run test && pnpm run test:e2e`.
  Commit: `feat(popup): toggle tracking parameters and show their names`
