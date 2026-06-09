---
name: git-commit
description: Draft a Conventional Commits message for one project's changes (core, dashboard, xclient, or root) following docs/development/commit-spec.md and, by default, commit only the already-staged content for that project; supports --no-commit (draft only), --push, --auto-add (let the agent stage relevant paths), and --date <date>. Use when the user runs /git-commit or asks to write a commit message, commit, or push changes for the repository or a submodule.
disable-model-invocation: true
---

# Git Commit — Cursor Entry

This is the Cursor-specific entry point for the `git-commit` skill. Its only job
is to wire the skill into Cursor's `/`-command discovery.

The full, IDE-neutral instructions are defined once in:

`skills/git-commit/SKILL.md` (relative to the repository root).

When this skill is invoked, read `skills/git-commit/SKILL.md` and follow it
exactly. Do not duplicate or fork the steps here — keep this file as a thin
reference so there is a single source of truth.
