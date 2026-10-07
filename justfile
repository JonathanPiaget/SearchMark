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

# Check Chrome Web Store credentials from .env.submit without uploading
@submit-chrome-dry:
    pnpm zip
    pnpm wxt submit --chrome-zip .output/searchmark-$(jq -r .version package.json)-chrome.zip --dry-run

# Submit the Chrome zip to the Chrome Web Store (credentials from .env.submit)
@submit-chrome:
    pnpm zip
    pnpm wxt submit --chrome-zip .output/searchmark-$(jq -r .version package.json)-chrome.zip
