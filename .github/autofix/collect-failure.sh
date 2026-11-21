#!/usr/bin/env bash
# Needs GH_TOKEN, GH_REPO, RUN_ID, PR.
# $RUNNER_TEMP/autofix is the only folder the agent may read outside the PR checkout.
set -euo pipefail

dir="$RUNNER_TEMP/autofix"
mkdir -p "$dir"
gh run view "$RUN_ID" --log-failed >"$dir/failed.log"
gh pr diff "$PR" >"$dir/pr.diff"
gh pr view "$PR" --json number,title,body >"$dir/pr.json"
