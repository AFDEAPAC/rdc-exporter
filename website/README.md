# RDC Exporter Website

The official marketing/documentation website for **RDC Exporter** — a Prometheus
exporter for AMD GPUs. It is a modern, dark-themed single-page site with animated
SVG diagrams and a trilingual UI (English / 繁體中文 / 简体中文).

All content is derived from this repository's documentation and source
(`README.md`, `docs/configuration`, `docs/deployment`, `docs/metrics.md`,
`docs/development/architecture-spec.md`, `cmd/`, `internal/`). It is a
presentation layer only and changes no Go code.

## Tech stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first theme tokens)
- [Framer Motion](https://motion.dev/) for entrance/scroll animations
- [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile)
  to inline JS/CSS into one portable `index.html`

## Develop

```bash
cd website
npm install
npm run dev        # start the dev server on http://localhost:5180/
```

The dev server uses a fixed, dedicated port (`5180`, `strictPort`) so it never
silently shifts to another port when something else (such as an unrelated app on
the default `5173`) is already running. Always open **`http://localhost:5180/`**
— do not open `5173`, which may belong to a different project.

> Remote (SSH / Cursor): `host: true` exposes the server, but open it through the
> editor's forwarded **5180** port (or `http://<remote-ip>:5180/`), not `5173`.
> If `5180` is taken, `npm run dev` will fail with a clear port-in-use error
> instead of starting on a surprise port.

## Build

```bash
npm run build      # outputs a single, self-contained dist/index.html
npm run typecheck  # optional: strict TypeScript check
```

The build is configured with `base: "./"` and single-file inlining, so the
output is **fully portable**:

- It can be hosted at any path (root domain or a project subpath) without
  rebuilding.
- It can be opened directly from the local filesystem — just double-click
  `dist/index.html` (works on `file://` because the script is inlined, avoiding
  the cross-origin module fetch browsers block on `file://`).

## Project layout

```
website/
  index.html              # Vite entry (script is inlined at build time)
  src/
    main.tsx              # React bootstrap
    App.tsx               # page composition
    index.css             # Tailwind v4 import + theme tokens + keyframes
    i18n/                 # locale provider + useI18n hook
    content/              # types + en / zhTW / zhCN dictionaries + shared data
    components/           # Nav, Footer, Section, CodeBlock, Callout, etc.
    diagrams/             # animated SVG diagrams
    sections/             # Hero, Purpose, Architecture, Deployment, ...
```

## Internationalization

The active language is resolved from `localStorage` first, then the browser's
preferred languages (`zh-TW`/`zh-Hant`/`zh-HK`/`zh-MO` → Traditional, other `zh`
→ Simplified), defaulting to English. Use the switcher in the header to change
it. To add or change copy, edit the dictionaries in `src/content/`; the shared
`Content` type keeps all three locales structurally in sync.
