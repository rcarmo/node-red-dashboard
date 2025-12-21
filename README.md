# node-red-dashboard (Preact refactor)

[![platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
![License](https://img.shields.io/npm/l/node-red-dashboard)

This repository is an experimental refactor of the Node-RED Dashboard runtime to Preact + HTM, Bun, and Apache ECharts. It is not the published Angular-based dashboard. For production use today, see the legacy package at [node-red/node-red-dashboard](https://github.com/node-red/node-red-dashboard) or alternatives like [FlowFuse Dashboard](https://github.com/FlowFuse/node-red-dashboard) and [UIBUILDER](https://flows.nodered.org/node/node-red-contrib-uibuilder).

## Status

- Work in progress: replacing the Angular v1 client with a Preact runtime while keeping the existing Node-RED editor nodes and saved flows.
- Current runtime pieces: tab/nav shell, CSS Grid layout for groups, theme application via CSS variables, Socket.IO bridge, text/button/switch/text-input/numeric/dropdown/slider widgets, and an Apache ECharts gauge/donut implementation.
- Tooling: Bun scripts for dev/build/test/lint/format; strict TypeScript; HTM (no JSX); Apache ECharts vendored via bundler.
- Compatibility: editor-side configuration is unchanged; the refactor targets drop-in consumption of existing saved metadata but remains experimental until full widget/chart coverage lands. Track progress in `REFACTORING.md`.

## Quick start (dev)

1. Install Bun 1.x.
2. Install deps: `bun install`.
3. Run the dev server: `bun run dev` (serves the Preact bundle from `dist/`).
4. Lint/tests: `bun run lint` and `bun test`.
5. Build: `bun run build` (outputs to `dist/`).

## Goals

- Modern runtime: Preact + HTM, zero jQuery/Angular in the client.
- Charting on Apache ECharts (line/bar/pie/donut/radar etc.) with streaming support and theming.
- Theming via CSS variables (no runtime Less); accessible defaults; respects reduced motion.
- Lean dependencies and Bun-only scripts for development, build, and tests.

## What works today

- Shell: tab list, connection status, hash-based routing per tab index/name.
- Layout: CSS Grid for groups/cards with theme-aware surfaces; layout announcements for screen readers.
- Widgets: text, button, switch, text-input (enter/delay/blur), numeric (wrap/format), dropdown, slider (invert/vertical/ticks/signals), gauge (standard/donut) on ECharts.
- Tests: Vitest + @testing-library/preact for widgets/layout; Bun scripts wired.

## Roadmap highlights

- Chart panel on ECharts with streaming adapter matching `ui-chart` options.
- Remaining widgets (form, date/colour picker, audio, toast, link, template) and full `ui-control` parity.
- Shared ECharts loader + resize hooks; sizing context to replace legacy `sizes.js`.
- Full theme variable application and removal of runtime Less usage.
  See `REFACTORING.md` for the detailed checklist.

## Working with existing flows

- Editor nodes and saved flow metadata remain the source of truth. The Preact runtime aims to consume the same tab/group/widget definitions emitted by the existing nodes.
- Until feature parity is reached, expect gaps compared to the Angular client (especially charts/forms/media widgets). Avoid using this branch in production dashboards.

## Running inside Node-RED with Bun

- Install Bun 1.x and Node-RED in your flow directory: `bun install node-red` (or run once via `bunx --bun node-red`).
- In this repo, install deps and build the Preact runtime: `bun install` then `bun run build` (outputs to `dist/`).
- Link the dashboard into your Node-RED user dir (e.g., `~/.node-red`): `bunx --bun npm link /path/to/node-red-dashboard` (or add `"node-red-dashboard": "file:/path/to/node-red-dashboard"` to `package.json` then `bun install`).
- Start Node-RED with Bun from your flow dir: `bunx --bun node-red -s settings.js`.
- Open the UI at `http://localhost:1880/ui` (or your configured `ui` path).
- Dev loop: `bun run dev` for watch builds, `bun run build` to refresh `dist/`, then restart Node-RED to pick up changes; keep `bun run lint` / `bun test` green.

## Repository layout (new runtime)

- `src/preact/` — Preact entrypoint, Socket.IO bridge, layout, and widgets.
- `src/preact/components/` — widget and layout components (HTM templates).
- `src/preact/hooks/` — shared hooks for socket events, theme, and layout.
- `REFACTORING.md` — migration plan and status.

Legacy Angular sources remain under `src/` for reference during migration.

## Contributing

- Use Bun for all scripts (`bun run dev|build|lint|test|format`).
- Keep additions in Preact + HTM (no JSX) with strict TypeScript.
- Prefer Apache ECharts for charts/gauges; avoid adding jQuery/Chart.js/JustGage.
- Add tests alongside new code; avoid touching `dist/` in PRs.

## License

Apache-2.0 (see `LICENSE`).
