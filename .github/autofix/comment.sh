#!/usr/bin/env bash
# Comments the outcome on the PR, then labels it when a fix was pushed.
# Needs GH_TOKEN, GH_REPO, PR, HEAD_SHA. PUSHED and DISABLED may be empty.
set -euo pipefail

run_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"

summary=$(jq -r '.result // empty' "$RUNNER_TEMP/agent.json" 2>/dev/null || true)
[ -n "$summary" ] || summary="The agent left no summary: see the [autofix run]($run_url)."

if [ "${PUSHED:-}" = true ]; then
	status="**CI autofix pushed a commit.** Review it before merging."
else
	status="**CI autofix pushed nothing.**"
fi
if [ "${DISABLED:-}" = success ]; then
	status="$status Auto-merge is off: merge by hand."
fi

# The comment first: its marker is what stops a second attempt on this head
gh pr comment "$PR" --body "<!-- ci-autofix:$HEAD_SHA -->
$status

$summary

[Autofix run]($run_url)"

if [ "${PUSHED:-}" = true ]; then
	gh pr edit "$PR" --add-label agent-fixed
fi
