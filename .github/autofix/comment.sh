#!/usr/bin/env bash
# Needs GH_TOKEN, GH_REPO, PR, HEAD_SHA. PUSHED and DISABLE_OUTCOME may be empty.
set -euo pipefail

run_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"

# agent.json is missing or empty when a step before the agent failed: the
# comment still goes out, with the fallback text
summary=$(jq -r '.result // empty' "$RUNNER_TEMP/agent.json" 2>/dev/null || true)
[ -n "$summary" ] || summary="The agent left no summary: see the [autofix run]($run_url)."

if [ "${PUSHED:-}" = true ]; then
	status="**CI autofix pushed a commit.** Review it before merging."
else
	status="**CI autofix pushed nothing.**"
fi
if [ "${DISABLE_OUTCOME:-}" = success ]; then
	status="$status Auto-merge is off: merge by hand."
fi

# The comment first: gate.sh reads its marker to stop a second attempt on this head
gh pr comment "$PR" --body "<!-- ci-autofix:$HEAD_SHA -->
$status

$summary

[Autofix run]($run_url)"

if [ "${PUSHED:-}" = true ]; then
	gh pr edit "$PR" --add-label agent-fixed
fi
