@_default:
    just --list

# Run development server for Firefox (pass a port when another worktree already uses 3000)
@firefox port="3000":
    pnpm run dev:firefox --port {{port}}

# Run development server for Chrome (pass a port when another worktree already uses 3000)
@chrome port="3000":
    pnpm run dev --port {{port}}

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

# Rebuild the extension and regenerate store screenshots (pass e.g. --store chrome --scene 2, --list for options)
@screenshots *flags:
    pnpm screenshots {{flags}}

# Rebuild the extension and regenerate the Chrome Web Store promo tile + marquee
@promo:
    pnpm screenshots --scene promo

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
