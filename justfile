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

# Run linter
@lint:
    pre-commit run --all-files
