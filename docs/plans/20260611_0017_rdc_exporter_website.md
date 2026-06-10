# RDC Exporter Website — Consolidated Plan

- Consolidated: 2026-06-11 00:17
- Status: Approved, in implementation.

## 1. Purpose

Build and maintain the official RDC Exporter website: a modern, dark-themed,
trilingual static site that introduces RDC Exporter to external readers, and
keep its TypeScript source (`website/src`) aligned with the project coding-style
guide.

The website is a **presentation layer only**. Every fact it shows is sourced
verbatim from existing repository documents and source code. Neither the build
work nor the coding-style refactor changes any Go code, domain behavior, runtime
logic, or the site's rendered output.

## 2. Source Scope

This plan consolidates the following draft manuscripts from
`docs/plans/manuscripts/` (2 files; `README.md` is the consolidation spec, not a
source):

- `20260610-website.md` — RDC Exporter Official Website (the build plan:
  purpose, stack, content sections, diagrams, constraints, verification).
- `20260610-website-ts-coding-style-refactor.md` — Website TypeScript
  coding-style refactor (JSDoc, named exports, React keys; explicit scope
  exclusions).

Both target the same artifact (`website/`), so they are merged into a single
website plan rather than kept separate.

## 3. Consolidated Background

RDC Exporter is a Prometheus exporter for AMD GPUs built on ROCm RDC. The
website explains it to external readers and links back to the authoritative
in-repo Markdown docs and source. It is a single-page, anchored-nav site with an
in-page language switcher.

Two phases of planning exist: (a) standing up the site itself, and (b) a
follow-up documentation/style refactor of the site's own source code to satisfy
`docs/development/ts-coding-style.md`. The refactor manuscript is the newer of
the two; where the two disagree, the newer/more explicit decision wins (see
Architecture for the resolved Clean Architecture item).

## 4. Confirmed Decisions

Website build:

- Languages: full trilingual (English / Traditional Chinese / Simplified
  Chinese) with an in-page language switcher.
- Deployment: portable, relative-path static output that opens directly from the
  local filesystem (`file://`) and can be dropped under any subpath.
- Tech stack (author's choice, per user delegation):
  - Vite + React + TypeScript + Tailwind CSS v4.
  - `framer-motion` for entrance/scroll animations.
  - `vite-plugin-singlefile` to inline JS/CSS into a single portable
    `index.html`; `base: './'` for relative assets.
- Location: source under `website/`; build output under `website/dist/`.
- Team / footer attribution: AMD aFDE team / DCGPU System Eng TWN, AMD Inc. /
  Chen-Hao Ku <Bill.Ku@amd.com>.

Coding-style refactor (documentation/style only):

- Add maintenance-grade JSDoc to **all** top-level exports across
  `components/`, `sections/`, `diagrams/`, `i18n/`, and `content/`.
- Convert `App` from a default export to a named export and update the import in
  `main.tsx`.
- Fix array-index React keys used without justification (stable keys where
  possible; an explicit annotation where a positional key is genuinely safe).
- Upgrade existing file-head `//` notes into `/** */` on the export rather than
  duplicating them.

## 5. Architecture and Design Principles

- Single page with anchored navigation; one section per topic.
- Internationalization via a React context/provider (`I18nProvider` + `useI18n`)
  that resolves the active locale to a typed `Content` dictionary; locale choice
  is detected once, persisted, and reflected on `<html lang>`.
- All displayed facts derive from a single source of truth (the repo docs and
  source); the site never invents data.
- Animated SVG diagrams are decorative (`role="img"` + descriptive `aria-label`)
  with English proper-noun labels; localized prose lives in the surrounding
  section copy.
- High-level diagrams:
  - Overview pipeline: GPU Node -> RDC -> rdc-exporter -> /metrics -> Prometheus
    -> Grafana.
  - Runtime collection cycle: reader -> scale -> labels -> sink -> /metrics
    (fixed 5s scrape interval).
  - Kubernetes topology: device-plugin + node-labeller + kubelet pod-resources +
    rdc-exporter DaemonSet + workload Pod (workload-label attribution).
  - Configuration two-layer model: catalog (dictionary) + metric list
    (selection) -> filter -> exported series (value = raw x scale).
- Resolved conflict — Clean Architecture: the initial build manuscript listed a
  "Clean Architecture layers" content section and a layered-dependency diagram.
  The newer refactor manuscript enumerates the diagrams as exactly
  `OverviewPipeline`, `RuntimeFlow`, `ConfigModel`, `K8sTopology` (no Clean
  Architecture diagram). Per the "prefer newer" rule, that layered section/diagram
  is dropped; the section is framed as "How it works" (runtime collection flow).

## 6. Functional Scope

Single-page content sections (anchored nav):

1. Hero — tagline, CTAs, and the overview pipeline diagram.
2. Purpose / use cases.
3. How it works — runtime collection flow (replaces the original Clean
   Architecture section).
4. Deployment — Docker quickstart + Kubernetes (topology, components, DaemonSet,
   rollout steps, pod-resources socket paths, troubleshooting) + release images
   + vLLM workload-label verification.
5. Configuration — two-layer model, field-reference forms, scale/unit table,
   merge vs overwrite, catalog-entry reference, worked example, CLI flags.
6. Differences vs NVIDIA DCGM exporter — comparison table + metric mapping.
7. Metrics — full RDC field catalog with category filters and default-enabled
   toggle; telemetry vs profiling recommended sets; PMC packet caveat.
8. Building / release — make targets, ROCm versions, version overrides.
9. Footer — documentation/resource links and team attribution.

## 7. Constraints and Rules

- Do not modify Go code or domain semantics.
- Keep all metric names, field ids, scales, and behavior aligned with the docs.
- The website must build to a portable single-file dist and open from `file://`.
- The coding-style refactor must not change any UI behavior, rendered output,
  runtime logic, or domain semantics.
- JSDoc quality bar: name-restating comments are non-compliant. Each must add
  information not derivable from the name/type/JSX — usage context (section/flow),
  important prop/return semantics, data source, loading/empty/error presentation,
  side-effect lifecycle, a11y intent, or cross-document contracts.
- Prefer named exports; avoid default exports unless a tool/framework requires it.

## 8. Data Model and Format Notes

- `content/types.ts` defines the `Content` contract that every locale module
  (`en`, `zhTW`, `zhCN`) implements, so TypeScript keeps the locales structurally
  in sync; a new key must be translated everywhere before the build type-checks.
- `content/data.ts` holds strictly language-neutral data (shell/YAML snippets,
  RDC field identifiers, release images, reference tables) transcribed verbatim
  from the docs/source; it is intentionally outside the `Content` contract.
- `metricRows` is the complete RDC field catalog transcribed from
  `docs/metrics.md`; `enabled` mirrors the doc's Enable column, and `group` is a
  presentation-only UI bucket derived from the field-id range (matched to chip
  colors and locale labels).
- Plan manuscripts follow the repo convention: drafts live under
  `docs/plans/manuscripts/` as `YYYYMMDD-<short-topic>.md`; consolidated plans
  live one level up in `docs/plans/` as `yyyyMMDD_HHMM_<title>.md`.

## 9. CLI / API / Config Notes

Website project scripts (`website/package.json`):

- `npm run dev` — Vite dev server.
- `npm run build` — `vite build` (produces the single-file `dist/index.html`).
- `npm run preview` — preview the build.
- `npm run typecheck` — `tsc --noEmit`.

Exporter configuration surfaced by the site (presentation of documented
behavior, not new config): the two-layer catalog + metric-list model, the three
interchangeable field-reference forms, scale/unit conversions, merge vs
overwrite, the catalog-entry keys, and the documented `rdc-exporter` CLI flags
(`--fields`/`-e`, `--fields-file`/`-f`, `--catalog`, `--gpu-indexes`/`-i`,
`--listen-address`/`-l`, `--kubelet`/`-k`, `--debug`/`-d`, `--self-monitoring`).

## 10. Implementation Plan

Phase A — Website build:

1. Scaffold Vite + React + TS + Tailwind v4 under `website/`; configure
   `base: './'` and `vite-plugin-singlefile`.
2. Implement the i18n provider, the `Content` contract, and the three locale
   dictionaries.
3. Build the shared components, sections, and animated SVG diagrams.
4. Transcribe language-neutral reference data into `content/data.ts` from the
   source-of-truth docs.

Phase B — Content revisions:

1. Drop the Clean Architecture section/diagram; reframe as "How it works".
2. Expand Deployment (Kubernetes guide, socket paths, troubleshooting), Metrics
   (full catalog + filters), and Configuration (full reference) content.

Phase C — TypeScript coding-style refactor (by file):

1. Export form: `App.tsx` default -> named; update `main.tsx` import.
2. JSDoc — components: `Section`, `Reveal`, `Callout`, `Logo`,
   `LanguageSwitcher`, `Nav`, `Footer`, `CodeBlock`.
3. JSDoc — sections: `Hero`, `Purpose`, `Architecture`, `Deployment`,
   `Configuration`, `VsNvidia`, `Metrics`, `Building`.
4. JSDoc — diagrams: `OverviewPipeline`, `RuntimeFlow`, `ConfigModel`,
   `K8sTopology` (preserve `role="img"` / `aria-label` a11y intent).
5. JSDoc — i18n: `LANG_ORDER`, `I18nProvider`, `useI18n`, `detectInitialLang`.
6. JSDoc — content: `types.ts`, `data.ts` exports and the `en` / `zhTW` / `zhCN`
   dictionary constants.
7. Index keys: `CodeBlock` (annotate the safe positional key),
   `Metrics.caveatList` (`key={c}`), `Configuration.order` (`key={step}`).

Verification:

- `npm run build` produces `website/dist/index.html`.
- Open `dist/index.html` via `file://`; verify trilingual switch, animations,
  and diagrams render, and that it also works under an arbitrary subpath.
- For the refactor, `npm run typecheck` (tsc --noEmit) and `npm run build` must
  both pass; no behavioral or visual changes expected.

## 11. Non-goals

- No backend, no analytics, no live data fetching.
- Not a replacement for the in-repo Markdown docs; the site links to / summarizes
  them.
- Coding-style refactor explicitly excludes:
  - Broad introduction of `readonly` on props / data constants.
  - Extracting inline prop object types into named interfaces (`Logo`,
    `I18nProvider`, `RuntimeFlow`'s `Node`).
  - `T[]` <-> `Array<T>` / `ReadonlyArray<T>` normalization, `/* */` -> `//`.
  - Adding a test framework or ESLint (none configured); verification uses `tsc`
    and `vite build` only.

## 12. Open Questions

- No blocking open questions remain in the source manuscripts; the Clean
  Architecture content/diagram conflict is resolved in favor of the newer
  manuscript (dropped — see Architecture).
- Long-term sync cadence: since `content/data.ts` is transcribed verbatim from
  `docs/metrics.md` and the configuration/deployment guides, who/what keeps the
  website data in sync when those docs change? Not specified by either source.

## 13. Future Work

- Optionally adopt the currently-excluded refactor items in a later pass:
  `readonly` on props/data, extracting inline prop interfaces, and
  `T[]`/`Array<T>`/`ReadonlyArray<T>` normalization.
- Introduce a test framework and/or ESLint if a richer toolchain is added, then
  extend verification beyond `tsc` + `vite build`.
- Keep website content expanding alongside the repo docs (metrics, deployment,
  configuration) as they evolve.
