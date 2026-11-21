#!/usr/bin/env bash
# Saves what the agent reads about the failure, in the only folder it may read
# outside the PR checkout. Needs GH_TOKEN, GH_REPO, RUN_ID, PR.
set -euo pipefail

dir="$RUNNER_TEMP/autofix"
mkdir -p "$dir"
gh run view "$RUN_ID" --log-failed >"$dir/failed.log"
gh pr diff "$PR" >"$dir/pr.diff"
gh pr view "$PR" --json number,title,body >"$dir/pr.json"
