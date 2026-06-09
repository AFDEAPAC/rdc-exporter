# Glossaries

This directory holds the domain glossary for this project. `README.md` is the
main entry point for the glossary documentation and explains how to complete a
lookup or modification with the minimum required files.

The glossary is the source of the ubiquitous language. If a term's definition is
unclear, code, data models, and tests must not guess ahead of it.

## Documentation Map

- [`outline.md`](outline.md): term directory and glossary index.
- [`spec.md`](spec.md): glossary authoring and modification rules.
- [`terms/`](terms): canonical location for glossary term documents.

## Read-only Glossary Lookup

To understand existing terminology, read in order:

```text
README.md
  -> outline.md
    -> terms/<term>.md
```

Expected behavior:

1. Read this `README.md`.
2. Read [`outline.md`](outline.md) to identify the relevant term (and its
   bounded context, if the project ever grows beyond a single one).
3. Read only the required file under [`terms/`](terms).

Do not load unrelated glossary files. This keeps context usage small and
preserves domain clarity.

## Glossary Authoring or Modification

To add or modify glossary content, read in order:

```text
README.md
  -> outline.md
  -> spec.md
    -> terms/<term>.md
```

Expected behavior:

1. Read this `README.md`.
2. Read [`outline.md`](outline.md) to identify the affected term.
3. Read [`spec.md`](spec.md) before changing glossary content.
4. Create or modify only the relevant file under [`terms/`](terms).

The glossary writing specification must always be read before glossary
modification.

## Canonical Location

All glossary term documents must live under [`terms/`](terms).

Use [`outline.md`](outline.md) as the navigation index. Do not place standalone
term files beside `README.md`, `outline.md`, or `spec.md`.

## Required Agent Behavior

- For glossary lookup, read only the minimum documents required by the lookup
  flow.
- For glossary changes, read [`spec.md`](spec.md) before editing.
- Do not load unrelated term files.
- If a domain term is missing, unclear, or changing meaning, update or create
  the relevant glossary before continuing with design or implementation.
- This project is effectively a single bounded context. If a term would carry
  different meanings in more than one context, stop and ask before creating new
  glossary files.
