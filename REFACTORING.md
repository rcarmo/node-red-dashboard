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
- [ ] Avoid self-referential/meta UI text (e.g., no "mirrors legacy" phrasing) while matching legacy behaviors.

## Phase Checklists

### 0) Foundations
- [x] Add `.bun` version note and (if needed) `bunfig.toml` (min bun, registries).
- [x] Replace npm scripts with Bun equivalents (`bun run fixfa`, `bun run fixgrid`) or inline Bun scripts.
- [x] Scaffold `src/preact/` with TypeScript (tsconfig: ES2020, allow JS interop as needed) configured for HTM (`import { html } from "htm/preact"`; no JSX transform).
- [x] Decide bundling: `bun build src/preact/index.ts` (or `.tsx` if desired) --outdir dist with HTM-compatible pipeline; avoid gulp except for legacy until parity.
- [ ] Keep the Node-RED Dashboard sidebar editor fully functional while migrating runtime; prefer reuse of existing editor code and assets, only reimplementing when unavoidable.

### 1) App Shell & Routing
- [x] Rebuild `index.html` without Angular directives; mount Preact `<App />`.
- [x] Implement toolbar (title, menu toggle, selected tab name) — basic version with status.
- [x] Implement left nav respecting `lockMenu`, `allowSwipe`, `hidden/disabled` tabs/links — basic static list wired to state/select.
- [ ] Implement main area with masonry/grid (gridstack replacement or CSS Grid).
- [x] Implement loading/no-tabs states mirroring legacy `loading.html`/`partials/main.html` behavior.
- [x] Add lightweight routing keyed by tab index/name (hash or `wouter`) matching `/$index` paths.

### 2) Data Layer (Socket.IO Bridge)
- [x] Port `UiEvents` to Preact hook/context: Socket bridge created with `emit/on/close` and `socketid` injection.
- [x] Handle `ui-controls` -> set state + emit `ui-replay-state`; handle `ui-replay-done`; emit `ui-change` on tab switch (selectTab emits).
- [x] Model app state: `menu`, `globals`, `site`, `selectedTab`, connection flags; preserve `msg.socketid` on emits.
- [ ] Maintain `ui-collapse`, tab/group hide/show, `ui-control` messages semantics.

### 3) Theme & Layout System
- [ ] Replace Less runtime with CSS variables derived from theme object (map `page-backgroundColor`, `widget-textColor`, etc.).
- [ ] Implement runtime theme updates (allow temp themes vs Angular theme mode) without `less.modifyVars`.
- [ ] Rebuild sizing logic (`sizes.js`) as Preact context/provider with resize hook; trigger on tab/group changes.
- [ ] Decide masonry/grid approach: CSS Grid with `grid-auto-flow:dense` or interim gridstack wrapper.
- [ ] Implementation strategy: keep the editor-side layout/ordering UI intact (Gridstack preview + `site.sizes` controls), and adapt the new runtime to consume the same saved tab/group/widget metadata. If a gap appears, reimplement only the runtime reader/adapter, not the editor UI, to preserve existing flows.

### 4) Component Migration (Angular → Preact)
- [ ] Create `src/preact/components/` with one component per widget.
- [ ] Build `ChartPanel` on ECharts covering line/bar/pie/donut/polar/radar + streaming adapter for `values.series/labels/data`, `update/remove`, `useUTC`, `xformat`, `cutout`, `spanGaps`, `legend`, `interpolate`, `ymin/ymax`.
- [ ] Build `Gauge` using ECharts gauge/liquid-fill to replace JustGage/liquidFillGauge.
- [ ] Build core widgets: Text, Text Input, Button, Switch, Slider, Numeric, Dropdown, Form with `msg.*` bindings and `className` overrides.
- [ ] Build Date/Colour picker using small deps (native date or `@zag-js` date picker; `@ctrl/tinycolor`).
- [ ] Build Audio/Toast/Link/Template with web APIs; keep iframe/link behaviors.
- [ ] Add shared `WidgetFrame` for labels, disabled state, sizing units, `className`.

### 5) Charts with Apache ECharts
- [ ] Add shared ECharts loader (lazy, theme-aware) and resize hook.
- [ ] Map Chart.js options to ECharts (axes, tooltips with time formatting via `dayjs`, stacked bars, multi-series colors, `spanGaps`, smoothing/step, donut cutout).
- [ ] Implement streaming updates: maintain series arrays, apply `remove`, call `setOption({series,xAxis,yAxis},{notMerge:false,replaceMerge:['series']}).

### 6) Forms & Message Contract
- [ ] Keep inbound `msg` handling identical; ensure outgoing emits include `msg.socketid` and node IDs.
- [ ] Preserve tab/group hide/show storage (`th*`/`td*`/`g*`) or replace with clearer keys; trigger resize after changes.

### 7) i18n and Assets
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
- [ ] Implement main area grid/masonry and render tabs/groups in Preact.
- [ ] Implement `ChartPanel` with ECharts data adapter; validate against `ui-chart-js` behaviors.
- [ ] Migrate core widgets and theme variables; start removing Less runtime.
- [ ] Add routing-aware sizing/resizing hooks and ensure tab switches trigger layout updates.
