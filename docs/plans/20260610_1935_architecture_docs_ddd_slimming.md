# Consolidated Plan: Architecture Docs DDD Slimming

## 1. Purpose

Right-size the project's architecture and domain documentation to the actual
scale of this single-binary Prometheus exporter. Concretely: reduce the DDD
ceremony in `docs/development/architecture-spec.md` while preserving the
load-bearing Clean Architecture, and collapse the over-engineered multi-file
glossary subsystem into a single flat glossary. Documentation only; no code
behavior changes.

## 2. Source Scope

Consolidated from the manuscripts under `docs/plans/manuscripts/`
(`README.md` excluded as the consolidation spec):

- `20260610-architecture-spec-ddd-slimming.md` — covers three related efforts:
  the architecture-spec DDD slimming, the glossary collapse, and a source-code
  review that decided which domain terms to record.

One source manuscript processed.

## 3. Consolidated Background

`architecture-spec.md` was a long architecture constitution mandating Clean
Architecture combined with DDD core-domain principles (Distillation and
Ubiquitous Language), including a formal core / supporting / generic subdomain
classification with mandatory process steps. Relative to a single Go module that
exposes no public API and whose domain is thin (collect raw GPU fields, apply
scale, attach labels, produce metrics), that ceremony was disproportionate, and
the subdomain classification largely restated what the Dependency Rule already
enforces.

In parallel, `docs/domain/glossaries/` was a three-document process subsystem
(`README.md`, `outline.md`, `spec.md`) describing a
`README -> outline -> spec -> terms/` authoring flow. It contained zero actual
terms and no `terms/` directory, while the real domain vocabulary already lived
in the Go doc comments. The flow was pure scaffolding with negative ROI at the
current scale.

## 4. Confirmed Decisions

- Keep Clean Architecture (Dependency Rule + layering) as the primary,
  load-bearing architecture.
- Keep the Ubiquitous Language principle, but collapse its storage from the
  multi-file glossary flow into a single `docs/domain/glossary.md`.
- Weaken Distillation: demote the formal core / supporting / generic subdomain
  classification from a mandatory process to a short "where to spend attention"
  reminder.
- Do not introduce tactical DDD (Aggregate, Repository, Domain Event, Factory,
  Bounded Context); the domain is too small and they are already absent.
- Glossary content rule: record only domain language with disambiguation or
  contract value; defer full contracts to Go doc comments.
- Recorded terms after a full source review: added `Workload label (dynamic
  label)` and `GPU attribution`, enriched `GPUIndex` with the host-vs-RDC index
  alignment invariant; excluded implementation/infrastructure terms.

## 5. Architecture and Design Principles

- Clean Architecture always wins: it decides where code lives and the direction
  of dependency. DDD is a thin overlay that only guides attention and naming and
  never moves a layer boundary or reverses the Dependency Rule.
- Distillation as a lens, not a process: the value-creating rules (collect raw
  GPU fields, convert by configured scale, attach labels, produce consumable
  metrics) deserve the modeling and review effort and live in the inner layers
  (Entities, Use Cases). Generic infrastructure (cgo/RDC bindings, Prometheus
  client, HTTP server, CLI parsing, config reading, logging) stays thin in the
  outer layers — which the Dependency Rule already enforces.
- Ubiquitous Language: keep one consistent vocabulary across documentation,
  tests, exported metric names, and code; the single `docs/domain/glossary.md`
  is its source.
- Glossary spirit: capture only genuinely overloaded or contract-bearing domain
  terms; technical/implementation details do not belong.

## 6. Functional Scope

Changes carried out (documentation only):

- `docs/development/architecture-spec.md`:
  1. Intro reframed: Clean Architecture primary/load-bearing; DDD a thin overlay.
  2. "DDD: Core Domain Principles" replaced by a slimmer "DDD: Lightweight
     Overlay" (compress Distillation, keep Ubiquitous Language, drop the
     orthogonality lecture and the formal three-bucket rules).
  3. Prohibitions reworded from "generic subdomain / core domain" to "generic
     infrastructure / value-creating rules".
  4. Pre-Development Checklist: dropped the mandatory subdomain-classification
     bullet.
  5. Agent Execution Rules: removed repeated subdomain mandates; kept dependency,
     naming, testing, and review-intensity guidance in plain terms.
- Glossary collapse:
  1. Added `docs/domain/glossary.md` (single flat term table).
  2. Deleted `docs/domain/glossaries/README.md`, `outline.md`, and `spec.md`.
  3. Repointed references: `agent.md` Development Work section and the Ubiquitous
     Language link in `architecture-spec.md` now target `docs/domain/glossary.md`.
  4. Added/enriched terms per the source review.

## 7. Constraints and Rules

- No `.go` files are modified.
- Do not touch historical plans under `docs/plans/` (e.g. the 20260609 refactor
  plan); they are records.
- Keep `coding-style.md` cross-references valid.
- Keep `agent.md` consistent (its "DDD core domain principles" phrasing still
  holds because Ubiquitous Language is retained).
- The project is effectively a single bounded context; the glossary is a single
  flat file, not a multi-context subsystem.
- Glossary excludes implementation/infrastructure terms: ports
  (`FieldReader`/`MetricSink`/`LabelProvider`), RDC session/handler/GPU
  group/field group/field watch, catalog merge/overwrite/disabled loading
  behavior, self-monitoring, and the `RDC` acronym (already covered by the
  README/config docs).

## 8. Data Model and Format Notes

- `docs/domain/glossary.md` format: a single Markdown table with columns
  `Term | Meaning in this project | Watch out`, rows sorted alphabetically by
  Term. Full contracts remain in the Go doc comments.
- Recorded terms: Catalog, Definition, Entity, Field / FieldID, GPU attribution,
  GPUIndex / gpu_index, Metric (catalog key), Point, PromName, Sample, Scale,
  Workload label (dynamic label).
- Key disambiguations captured: the catalog `metric` key is the RDC field enum
  name, not the Prometheus metric name (which is `PromName` / `prom_name`); the
  host discovery index must align with the RDC-reported GPU index or workload
  attribution mislabels series; "dynamic labels" (code) and "workload labels"
  (docs) are the same `pod`/`namespace`/`container` labels.

## 9. CLI / API / Config Notes

- No CLI, API, or config behavior was changed by this effort.
- The glossary references existing external/config contracts but does not alter
  them: exported label names (`gpu_index`, and `pod`/`namespace`/`container`
  under Kubernetes) and catalog YAML keys (`metric`, `prom_name`, `field`,
  `scale`). These remain the source of truth in the configuration/deployment
  docs.

## 10. Implementation Plan

Status: completed. Executed in this order:

1. Slim `architecture-spec.md` (the five edits in Functional Scope).
2. Create `docs/domain/glossary.md` with the seeded flat term table.
3. Delete the three `docs/domain/glossaries/` process files.
4. Repoint references in `agent.md` and `architecture-spec.md`.
5. Review all packages and add only spirit-compliant terms (Workload label, GPU
   attribution) plus the GPUIndex alignment invariant.
6. Sort the glossary table alphabetically by Term.

## 11. Non-goals

- No change to Clean Architecture rules, layer responsibilities, or the
  Dependency Rule.
- No change to the Ubiquitous Language principle itself; only the storage of the
  vocabulary was simplified.
- No introduction of tactical DDD patterns.
- No code changes and no changes to runtime behavior, metrics, or configuration.

## 12. Open Questions

- Whether `agent.md` line 16-17 wording ("Clean Architecture combined with DDD
  core domain principles") should also be softened. Left unchanged for now to
  keep scope tight; it remains accurate because Ubiquitous Language is retained.

## 13. Future Work

- Revisit the glossary's weight only if the project grows beyond a single
  bounded context or contributor onboarding needs increase; a richer per-term
  format could then be reconsidered. Not warranted at the current scale.
- Optionally align the `agent.md` framing with the slimmed overlay wording if the
  open question above is resolved in favor of softening it.
