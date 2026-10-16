# Typo tier next to fuzzysort

Status: accepted (2026-10-16)

## Context

Fuzzy matching (see `GLOSSARY.md`) uses fuzzysort: it accepts skipped letters in order ("ktln" finds "kotlin", so a missing letter is already forgiven) and folds accents, but rejects a swapped, wrong or extra letter ("kotiln", "kotlen", "kotlinn"). Users expect both: skipped letters while typing fast, and tolerance for a swapped, wrong, extra or missing letter. Matched letters must be highlighted in the original title, including titles stored in decomposed Unicode ("e" + combining accent).

## Options

1. **uFuzzy**: its typo mode cannot be combined with skipped-letter matching, so switching would lose what fuzzysort already does. It also mis-highlights decomposed-Unicode titles.
2. **Fuse.js**: counts an adjacent swap ("kotiln") as 2 edits, so with a budget of 1 typo on medium words the most common typo is rejected. Same highlight problem on decomposed titles.
3. **Query variants through fuzzysort**: for each query word of 5+ letters, run fuzzysort on every variant with one letter deleted; one deletion covers a swapped, wrong or extra letter, and fuzzysort gives ranking and highlighting for free. Rejected because the shortened query scores close to the threshold, so the same typo is forgiven on "Kotlin" but not on "Spring Boot with Kotlin and PostgreSQL": the user cannot learn what the search tolerates. Lowering the threshold for variants brings noise instead.
4. **Keep fuzzysort and add a hand-rolled typo tier**: per query word, a bounded Damerau-Levenshtein distance (swap = 1 edit) against title word prefixes, with a budget by query word length (0 under 5 letters, 1 from 5, 2 from 9). No new dependency.

## Decision

Option 4. fuzzysort runs first and its results keep their order; titles only the typo tier accepts are appended after them. Every query word must match some title word, in any order. A typo-corrected word is highlighted whole, mapped back to the original title through the shared accent fold (`src/utils/foldAccents.ts`).

## Consequences

- We own about 70 lines (`src/utils/matchByTypos.ts`) and their tests instead of a dependency.
- Typo matches always rank below fuzzysort matches, regardless of how close they are.
- The typo tier scans every title not matched by fuzzysort; fine for bookmark-sized lists, to revisit if search gets slow on very large libraries.
