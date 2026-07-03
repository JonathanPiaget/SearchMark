---
name: release
description: Prepare a SearchMark release — bump the version in package.json, draft the CHANGELOG.md section from commits since the last tag, and hand back for the user to commit. Use when asked to release, cut a release, bump the version, or update the changelog for a release.
---

# Release SearchMark

Pushing a version bump to main triggers `.github/workflows/release.yml`: CI, store submission (Chrome + Firefox), and a GitHub release whose notes are the matching `## [x.y.z]` section of CHANGELOG.md. This skill only **prepares** the release commit — the user reviews, commits, and pushes.

## Steps

1. **Collect changes since the last release:**

   ```bash
   LAST=$(git tag --sort=-v:refname | head -1)
   git log --oneline "$LAST"..HEAD
   ```

   If there are no releasable commits (only chores/deps/CI), say so and stop.

2. **Infer the bump** from conventional commit prefixes, then **confirm with the user** (AskUserQuestion) before writing anything:
   - breaking change → major
   - any `feat:` → minor
   - otherwise (`fix:` etc.) → patch

3. **Draft the changelog section** and prepend it to CHANGELOG.md right after the intro (above the previous `## [x.y.z]`):

   ```markdown
   ## [x.y.z]

   ### Added
   - ...

   ### Changed
   - ...

   ### Fixed
   - ...
   ```

   Rules (match the existing file):
   - **User-facing wording**, not commit messages — describe what the user notices, read the diff if a commit subject is unclear.
   - Only include `### Added` / `### Changed` / `### Fixed` / `### Removed` headings that have entries.
   - **Skip** chores, deps bumps, CI, tests, docs, refactors with no visible effect.
   - No dates, no links — the file doesn't use them.

4. **Bump the version** in `package.json` (`"version"` field only — nothing else references the version; the manifest gets it from there at build time).

5. **Hand back.** Show the drafted section and suggest the commit message (matches history):

   ```
   chore(release): bump version to x.y.z
   ```

   The commit should touch only `package.json` and `CHANGELOG.md`. Do not commit or push. Remind that pushing to main submits to both stores.

## Gotchas

- The workflow only fires when `v<package.json version>` has **no existing tag** — a push without a bump does nothing; a wrong version already tagged silently skips release.
- Release notes are extracted by `changelog-reader-action` matching `## [x.y.z]` exactly — keep the bracketed heading format.
