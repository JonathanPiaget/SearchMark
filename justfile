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

# Create a worktree + branch from main and install deps
@wt name:
    git worktree add ../searchmark-wt/{{name}} -b {{name}} main
    cd ../searchmark-wt/{{name}} && pnpm install
    echo "cd ../searchmark-wt/{{name}}"

# Remove a merged worktree and its branch (-D: squash merges are never seen as merged by git)
@wt-rm name:
    git worktree remove ../searchmark-wt/{{name}}
    git branch -D {{name}}

# Everything CI runs, locally
@ci:
    pnpm run check
    pnpm run compile
    pnpm run test
    pnpm run build
