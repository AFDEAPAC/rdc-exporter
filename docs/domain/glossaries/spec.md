# Glossary Authoring Spec

This document defines how to create and modify glossary files.

Read this file before changing any glossary content. For read-only terminology lookup, this file does not need to be loaded.

## Canonical Location

All glossary term documents must live under:

```text
docs/domain/glossaries/terms/
```

Do not place standalone term files beside `README.md`, `outline.md`, or `spec.md`.

## File Naming

Use lowercase kebab-case file names:

```text
terms/<term>.md
```

Examples:

```text
terms/gpu-metric.md
terms/field-scale.md
terms/gpu-label.md
```

Avoid vague names such as:

```text
terms/common.md
terms/misc.md
terms/model.md
```

If no precise term name is available, clarify the domain meaning before creating a file.

## Term File Format

Each glossary term file should use this structure:

```markdown
# <Term>

- Definition: The precise domain meaning of this term in this project.
- Allowed meaning: Valid usage of this term.
- Disallowed meaning: Meanings that must not be mixed with this term.
- Synonyms: Accepted synonyms; use None if there are none.
- Deprecated terms: Old names or forbidden names; use None if there are none.
- Examples: Sentences or scenarios that validate the meaning.
- Related terms: Related terms and their relationships.
- Change note: Why this definition was added or changed.
```

## Writing Rules

- Define terms by domain meaning, not by database tables, API fields, UI labels, or implementation details.
- This project is effectively a single bounded context. If the same word would later carry different meanings in more than one context, define those meanings separately.
- Prefer precise domain language over generic umbrella terms.
- Do not create `common`, `misc`, or `model` glossaries to avoid deciding context boundaries.
- If a term is only a technical implementation detail and not domain language, it usually does not belong in the glossary.
- Glossary changes that affect code names, data models, tests, or docs must be synchronized with those artifacts.
- Documentation, test names, metric names, and code names should use the primary terms from glossary files whenever practical.

## Outline Updates

When adding or renaming a term file, update [`outline.md`](outline.md).

The outline should:

- Link to the term under `terms/`.
- Include a short one-line summary.
- Keep terms grouped by topic.
- Avoid repeating full definitions that already exist in term files.

## Agent Checklist

Before modifying glossary content, an AI agent must confirm:

- It has read [`README.md`](README.md).
- It has read [`outline.md`](outline.md).
- It has read this `spec.md`.
- It knows the affected term and its domain meaning.
- It is editing only the relevant file under `terms/`.
- It will update `outline.md` if a term file is added, removed, renamed, or regrouped.
- It has checked whether the glossary change affects code, data models, tests, or other documentation.

If any item is unclear, stop and ask before editing.

