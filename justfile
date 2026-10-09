@_default:
    just --list

# Run development server for Firefox
@firefox:
    pnpm run dev:firefox

# Run development server for Chrome
@chrome:
    pnpm run dev

# Run tests
@test:
    pnpm run test

# Run end-to-end tests (Playwright, built extension)
@e2e:
    pnpm run test:e2e

# Run end-to-end tests in the Playwright UI
@e2e-ui:
    pnpm run test:e2e:ui

# Run linter
@lint:
    pre-commit run --all-files
    pnpm run compile

# Submit the Chrome zip to the Chrome Web Store (credentials from .env.submit). Pass --dry-run to only check credentials
@submit-chrome *flags:
    pnpm zip
    pnpm wxt submit {{flags}} --chrome-zip .output/searchmark-$(jq -r .version package.json)-chrome.zip

# Submit the Firefox zip to the Firefox Add-ons store (credentials from .env.submit). Pass --dry-run to only check credentials
@submit-firefox *flags:
    pnpm zip:firefox
    pnpm wxt submit {{flags}} --firefox-zip .output/searchmark-$(jq -r .version package.json)-firefox.zip --firefox-sources-zip .output/searchmark-$(jq -r .version package.json)-sources.zip
