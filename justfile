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
