#!/usr/bin/env bash
# Runs the agent in the PR checkout (the working directory): file tools only,
# no shell, nothing writable under .github/. Needs CLAUDE_CODE_OAUTH_TOKEN.
set -euo pipefail

inputs="$RUNNER_TEMP/autofix"
prompt="$(cat "$(dirname "$0")/prompt.md")

Inputs folder: $inputs"

# The prompt goes after --: the variadic --allowedTools would swallow it
status=0
claude -p --restricted --strict-mcp-config --permission-mode dontAsk \
	--max-turns 30 --output-format json --add-dir "$inputs" \
	--tools 'Read,Edit,Write,Glob,Grep' \
	--disallowedTools 'Edit(.github/**)' 'Write(.github/**)' \
	--allowedTools Edit Write \
	-- "$prompt" </dev/null >"$RUNNER_TEMP/agent.json" || status=$?

# Names and targets only: this repo's run logs are public
jq -c '{subtype, num_turns, denied: [.permission_denials[]? | {tool_name, target: (.tool_input.file_path // .tool_input.command)}]}' \
	"$RUNNER_TEMP/agent.json" || true
exit "$status"
