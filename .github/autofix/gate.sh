#!/usr/bin/env bash
# Needs GH_TOKEN, GH_REPO, BRANCH, HEAD_SHA. Writes pr and automerge to GITHUB_OUTPUT.
set -euo pipefail

stop() {
	echo "No autofix: $1"
	exit 0
}

pr_json=$(gh pr list --head "$BRANCH" --state open \
	--json number,headRefOid,isCrossRepository,author,autoMergeRequest \
	--jq '[.[] | select(.isCrossRepository | not)] | first // empty')
[ -n "$pr_json" ] || stop "no open PR for $BRANCH"

pr=$(jq -r .number <<<"$pr_json")
[ "$(jq -r .headRefOid <<<"$pr_json")" = "$HEAD_SHA" ] || stop "#$pr has moved past $HEAD_SHA"

# gh reports Dependabot as app/dependabot, not dependabot[bot].
# The branch is the one pre-commit-autoupdate.yml opens its PR from.
[ "$(jq -r .author.login <<<"$pr_json")" = app/dependabot ] ||
	[ "$BRANCH" = update/pre-commit-autoupdate ] ||
	stop "#$pr is not a bot PR"

# The marker comment.sh leaves on each attempt
comments=$(gh pr view "$pr" --json comments --jq '.comments[].body')
! grep -qF "<!-- ci-autofix:$HEAD_SHA -->" <<<"$comments" || stop "#$pr already had its attempt on $HEAD_SHA"

{
	echo "pr=$pr"
	echo "automerge=$(jq -r '.autoMergeRequest != null' <<<"$pr_json")"
} >>"$GITHUB_OUTPUT"
