# Own t() over the @wxt-dev/i18n runtime

Status: accepted (2026-10-17)

Users can pick SearchMark's language (see **Language** in `GLOSSARY.md`), but the `#i18n` runtime of @wxt-dev/i18n calls `browser.i18n.getMessage`, which always follows the browser's language and cannot be switched at runtime. So we replace that runtime with our own `t()`, which keeps the same call signature. At startup it fetches the `_locales/<lang>/messages.json` that WXT already generates from `src/locales/*.yml`, and it resolves "Auto" from `browser.i18n.getUILanguage()`. The @wxt-dev/i18n build module stays: it still generates the manifest's `_locales` and the key types.

## Considered Options

- **Bundle the .yml files** (`import.meta.glob` + a YAML parser): no async load, but it needs a new dependency and puts every language in every bundle. Fetching the generated files needs neither.
- **Keep `getMessage` for "Auto"**: no change for "Auto" users, but two code paths to maintain for one feature.

## Consequences

- `t()` is synchronous, so popup and settings must await the message load before `mount()`, and the background awaits it before each notification.
- The extension's name and its shortcut labels come from the manifest, so they still follow the browser's language.
