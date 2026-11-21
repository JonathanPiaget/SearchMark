#!/usr/bin/env bash
# Working directory: the PR checkout. Needs PR_TOKEN, PR, BRANCH.
# Writes pushed to GITHUB_OUTPUT.
set -euo pipefail

if [ -z "$(git status --porcelain)" ]; then
	echo "pushed=false" >>"$GITHUB_OUTPUT"
	exit 0
fi

# The ci-autofix author is the loop guard: the gate job's `if` in
# ci-autofix.yml skips a run on a commit with that author name
git add -A
git -c user.name=ci-autofix -c user.email=ci-autofix@users.noreply.github.com \
	-c core.hooksPath=/dev/null \
	commit -m "fix: autofix failing ci for #$PR"
git -c core.hooksPath=/dev/null \
	push "https://x-access-token:${PR_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" "HEAD:refs/heads/$BRANCH"
echo "pushed=true" >>"$GITHUB_OUTPUT"
