---
name: worktree
description: Start a feature or fix in its own git worktree — derive a branch name from the task, create the worktree with deps installed, write the task file, open VS Code on it. Use when asked to start a task in a worktree, work on something in parallel, or "/worktree <task>".
---

# Start a task in a worktree

The main checkout stays untouched (it may hold uncommitted work). The new worktree lives in `../searchmark-wt/<branch>`, with its own `node_modules`, `.output/` and Chrome profile, so two features can run side by side. This skill only **sets up** the worktree — the task itself is done by the Claude session in the new VS Code window.

## Steps

1. **Derive the branch name** from the task: `<type>/<kebab-slug>`, English, 2–4 words, `feat/` for a feature, `fix/` for a bug, `chore/` otherwise (e.g. `feat/theme-auto-toggle`). Show it to the user and confirm with AskUserQuestion if the task is ambiguous.

2. **Check it is free:**

   ```bash
   git branch --list '<branch>'; git worktree list | grep '<branch>'
   ```

   If taken, say so and stop.

3. **Create the worktree** (branch from `main`, `pnpm install` included):

   ```bash
   just wt <branch>
   ```

4. **Write the task file** `../searchmark-wt/<branch>/tasks/<slug>.md` (gitignored) with the user's task description verbatim, plus a `## Plan` section left empty. The session in the new window fills it in.

5. **Open VS Code** and hand back:

   ```bash
   code ../searchmark-wt/<branch>
   ```

   Tell the user: in the new window, run `just chrome 3001` (or another free port when 3001 is also in use) to test, and start Claude Code there with `tasks/<slug>.md` as the brief.

## Gotchas

- Do not start `pnpm run dev` yourself — it belongs to the new window's terminal.
- Port 3000 is taken by the main checkout's dev server; every worktree needs its own port.
- Done with the branch (after the squash merge): `git pull` on main, then `just wt-rm <branch>`.
