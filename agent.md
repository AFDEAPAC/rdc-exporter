# Agent Entry Guide

This file is the entry point for AI agents working in this repository. All paths
in this file are relative to the repository root.

## Start Here

Always read this `agent.md` first for any repository work. After this file,
choose the minimum required documents for the task.

## Always Read

Before planning, editing, reviewing, or explaining repository work, read:

1. `docs/development/architecture-spec.md` — understand the design principles
   and architecture constraints. This project uses Clean Architecture combined
   with DDD core domain principles.

Before adding or modifying any code, also read:

1. `docs/development/coding-style.md` — follow Go naming, comments, errors, and
   testing rules.

## Development Work

When the task involves implementation planning, code changes, review of code
changes, domain behavior, data models, or core flows, also read:

1. `docs/domain/glossary.md` — look up the project's domain terminology and
   keep code, metric names, and docs aligned with it.

## Coding Style Completion Gate

For any Go code addition or modification, `docs/development/coding-style.md` is
not just background reading. It is a mandatory completion gate.

Before claiming that Go work is done, agents must perform a manual coding-style
review of every changed Go file. Passing `go test`, `make build`, `gofmt`,
`go vet`, lints, or IDE diagnostics is not sufficient.

The review must specifically verify high-maintenance documentation quality:

1. Every new or changed exported package, type, interface, function, method,
   const, or var has a doc comment that explains contract, boundary, caller
   obligations, error semantics, lifecycle, concurrency, security, or
   compatibility where relevant.
2. Important unexported boundaries also have valuable comments. This includes
   use cases, repository interfaces, HTTP/gRPC adapters, config loaders,
   database adapters, token/credential code, long-running workers, goroutine
   lifecycles, stream handling, and request forwarding.
3. Comments that only restate an identifier, type, or obvious code behavior are
   treated as missing comments and must be rewritten before continuing.
4. Code involving credentials, JWTs, API/Worker tokens, internal service tokens,
   persistence, request IDs, goroutines, context cancellation, stream ownership,
   retry behavior, or resource cleanup must document the safety assumptions and
   maintenance constraints.
5. New packages must have package-level comments that explain ownership and what
   must not be placed in that package.

If any changed Go file fails this documentation gate, the task is not complete.
Fix the comments immediately before moving to the next milestone, to-do item, or
final response.

For large implementations that add or change multiple packages, agents must do a
dedicated final comment pass after the functional code works. The final response
must not describe the task as complete unless this pass has been performed.

## Plan Backup

Do not proactively read `docs/plans/` during normal development work. Plans are
historical records and should only be read when the user asks for historical
planning context, decision archaeology, or plan consolidation.

When creating or updating an implementation plan, store the project-level
manuscript under `docs/plans/manuscripts/` instead of relying only on user-level
plan storage.

## Commit Messages

When asked to draft or validate a commit message, read and follow:

- `docs/development/commit-spec.md`

Base the message on the relevant staged diff or user-provided change summary.
Use the Conventional Commits format required by the commit spec, including an
appropriate type, optional scope, concise description, optional body, and
`BREAKING CHANGE` footer when the staged changes require one.
