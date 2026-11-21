#!/usr/bin/env bash
# Commits what the agent left changed in the PR checkout (the working
# directory) and pushes it to the PR branch. Needs PR_TOKEN, PR, BRANCH.
# Writes pushed to GITHUB_OUTPUT.
set -euo pipefail

if [ -z "$(git status --porcelain)" ]; then
	echo "pushed=false" >>"$GITHUB_OUTPUT"
	exit 0
fi

# The ci-autofix author is the loop guard: the gate skips a run on its commits
git add -A
git -c user.name=ci-autofix -c user.email=ci-autofix@users.noreply.github.com \
	-c core.hooksPath=/dev/null \
	commit -m "fix: autofix failing ci for #$PR"
git -c core.hooksPath=/dev/null \
	push "https://x-access-token:${PR_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" "HEAD:refs/heads/$BRANCH"
echo "pushed=true" >>"$GITHUB_OUTPUT"
