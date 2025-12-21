# Preact + Apache ECharts Migration Plan (Bun-only)

## Snapshot Checklist
- [ ] Confirm AngularJS 1.8 entrypoint in `src/index.html` + `main.js`, Angular Material, Chart.js + angular-chart.js, D3/JustGage, jQuery, Less theming (`main.less`, `theme.less`).
- [ ] Confirm widgets flow via `partials/main.html` and custom directives under `src/components/` + `src/directives/`, fed by Socket.IO (`src/services/events.js`).
- [ ] Confirm build tooling is gulp + Less + concatenation; npm scripts call `node` for `fixfa.js`/`fixgrid.js`; Node-RED nodes in `nodes/` serve built dashboard.
- [ ] Confirm assets: FA4, Material icons, Weather icons; i18n in `nodes/locales/`; `src/i18n.js` loader.

## Current Progress (v2 scaffold)
- [x] Bun toolchain: `bunfig`, bun scripts (`dev/build/test/lint/format`), Preact+HTM tsconfig, dependencies installed.
- [x] New `src/preact/` shell with Socket.IO bridge stub, tab list, connection status; builds to `dist/` via `bun run build`.
- [x] Lint/format config (ESLint/Prettier) scoped to new preact sources; tests run with `bun test`.

## Goals & Constraints Checklist
- [ ] Frontend rewritten in Preact; charts/gauges on Apache ECharts.
- [ ] All tooling/scripts runnable with `bun` only (no `node`); prefer Bun bundler for dev/build.
- [ ] Preserve Node-RED APIs + Socket.IO contract (`ui-controls`, `ui-replay-state`, `ui-replay-done`, `ui-change`, tab/group/control structure).
- [ ] Drop legacy polyfills; target evergreen browsers.
- [ ] Remove jQuery usage; replace with native DOM/utility helpers.
- [ ] Vendor all runtime deps (no CDN); bundle fonts/icons/assets locally.
- [ ] Refactor client code to TypeScript (strict) using HTM templates (no JSX); configure tooling for `htm/preact`.
- [ ] Align UX semantics (loading/no-tabs, navigation) with legacy Angular sources (`src/index.html`, `src/partials/main.html`, `src/main.js`) before altering behaviors.

## Phase Checklists
 [x] Add `.bun` version note and (if needed) `bunfig.toml` (min bun, registries).
 [x] Replace npm scripts with Bun equivalents (`bun run fixfa`, `bun run fixgrid`) or inline Bun scripts.
 [x] Scaffold `src/preact/` with TypeScript (tsconfig: ES2020, allow JS interop as needed) configured for HTM (`import { html } from "htm/preact"`; no JSX transform).
 [x] Decide bundling: `bun build src/preact/index.ts` (or `.tsx` if desired) --outdir dist with HTM-compatible pipeline; avoid gulp except for legacy until parity.
- [ ] Scaffold `src/preact/` with TypeScript (tsconfig: ES2020, allow JS interop as needed) configured for HTM (`import { html } from "htm/preact"`; no JSX transform).
- [ ] Decide bundling: `bun build src/preact/index.ts` (or `.tsx` if desired) --outdir dist with HTM-compatible pipeline; avoid gulp except for legacy until parity.
 [x] Rebuild `index.html` without Angular directives; mount Preact `<App />`.
 [x] Implement toolbar (title, menu toggle, selected tab name) — basic version with status.
 [x] Implement left nav respecting `lockMenu`, `allowSwipe`, `hidden/disabled` tabs/links — basic static list wired to state/select.
### 2) Data Layer (Socket.IO Bridge)
- [ ] Port `UiEvents` to Preact hook/context: `useSocket` connecting to `location.pathname + 'socket.io'` (secure on https) exposing `emit`, `on`, `id`.
 [x] Port `UiEvents` to Preact hook/context: Socket bridge created with `emit/on/close` and `socketid` injection.
 [x] Handle `ui-controls` -> set state + emit `ui-replay-state`; handle `ui-replay-done`; emit `ui-change` on tab switch (selectTab emits).
 [x] Model app state: `menu`, `globals`, `site`, `selectedTab`, connection flags; preserve `msg.socketid` on emits.
- [ ] Replace Less runtime with CSS variables derived from theme object (map `page-backgroundColor`, `widget-textColor`, etc.).
- [ ] Implement runtime theme updates (allow temp themes vs Angular theme mode) without `less.modifyVars`.
 [x] Add Bun scripts: `bun run dev` (watch build), `bun run build` (bundle to `dist/`), `bun run lint/test` (eslint/bun test), copy html helper.
- [ ] Build core widgets: Text, Text Input, Button, Switch, Slider, Numeric, Dropdown, Form with `msg.*` bindings and `className` overrides.
- [ ] Build Date/Colour picker using small deps (native date or `@zag-js` date picker; `@ctrl/tinycolor`).
 [x] Milestone 1: Bun toolchain, Preact shell, Socket.IO bridge, static tabs; feature flag `?ui=v2`.
- [ ] Add shared `WidgetFrame` for labels, disabled state, sizing units, `className`.

### 5) Charts with Apache ECharts
- [ ] Add shared ECharts loader (lazy, theme-aware) and resize hook.
- [ ] Map Chart.js options to ECharts (axes, tooltips with time formatting via `dayjs`, stacked bars, multi-series colors, `spanGaps`, smoothing/step, donut cutout).
- [ ] Implement streaming updates: maintain series arrays, apply `remove`, call `setOption({series,xAxis,yAxis},{notMerge:false,replaceMerge:['series']})`.
 [x] Add Bun toolchain scaffolding (bunfig, tsconfig, deps: `preact`, `echarts`).
 [x] Build new `index.html` + `src/preact/index.ts` with shell, nav, and Socket.IO wiring (no widgets) output to `dist/`.
- [ ] Reuse `nodes/locales/*` JSON with loader selecting `navigator.language` and English fallback.
- [ ] Replace Angular icon directives with plain `<i>`/SVG; keep FA/Material/Weather fonts initially; plan optional lighter set later.

### 8) Build & Packaging (Bun-only)
- [ ] Add Bun scripts: `bun run dev` (dev server/proxy), `bun run build` (bundle TS/JSX to `dist/` + static assets), `bun run lint/test` (eslint/vitest optional).
- [ ] Remove gulp after parity; keep `fixfa.js`/`fixgrid.js` as Bun scripts or bake rewrites into build.
- [ ] Ensure Node-RED consumes `dist/`; update node paths if required.
- [ ] Vendor dependencies into bundle/output (no CDN fetches); include icon/font assets locally.

### 9) Testing Strategy
- [ ] Add unit test setup with Vitest (Preact testing lib) for components, hooks, and data adapters (Socket bridge, ECharts adapter).
- [ ] Add DOM-focused tests using @testing-library/preact for widgets (inputs, routing, theme variables).
- [ ] Add contract tests for Socket.IO events (ui-controls, ui-replay-state, ui-change) with mocked server.
- [ ] Add lightweight E2E smoke via Playwright (bun test) covering tab navigation, theme switching, chart render, widget interaction.
- [ ] Add visual regression budget later (optional) once styles stabilize.
- [ ] Integrate tests into Bun scripts (`bun test`, `bun test:e2e`) and CI workflow.

### 10) Incremental Delivery
- [ ] Milestone 1: Bun toolchain, Preact shell, Socket.IO bridge, static tabs; feature flag `?ui=v2`.
- [ ] Milestone 2: Core widgets + theme variables parity.
- [ ] Milestone 3: Charts and gauges on ECharts; drop Chart.js/JustGage deps.
- [ ] Milestone 4: Remaining widgets (audio, toast, template, link), i18n parity, accessibility pass.
- [ ] Milestone 5: Remove Angular/Gulp, delete legacy assets, freeze API docs.

### 11) Risks / Open Questions
- [ ] Decide on grid/masonry approach (keep gridstack vs CSS Grid) to settle sizing math.
- [ ] Define migration path for `ui_template` (AngularJS HTML) — pure HTML/JS blocks or sandboxed custom element.
- [ ] Determine acceptable visual drift vs Angular Material; decide if a Material token shim is needed.
- [ ] Verify Socket.IO path/auth with Node-RED settings (custom `ui: { middleware }` compatibility).

## Immediate Next Steps
- [ ] Add Bun toolchain scaffolding (bunfig, tsconfig, deps: `preact`, `echarts`).
- [ ] Build new `index.html` + `src/preact/index.tsx` with shell, nav, and Socket.IO wiring (no widgets) output to `dist/`.
- [ ] Implement `ChartPanel` with ECharts data adapter; validate against `ui-chart-js` behaviors.
- [ ] Migrate simplest widgets and theme variables; start removing Less runtime.
- [ ] Implement loading/no-tabs states mirroring legacy `loading.html`/`partials/main.html` behavior.
