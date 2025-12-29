# Preact + Apache ECharts Migration Plan (Bun-only)

## Snapshot Checklist
- [ ] Confirm AngularJS 1.8 entrypoint in `src/index.html` + `main.js`, Angular Material, Chart.js + angular-chart.js, D3/JustGage, jQuery, Less theming (`main.less`, `theme.less`).
- [ ] Confirm widgets flow via `partials/main.html` and custom directives under `src/components/` + `src/directives/`, fed by Socket.IO (`src/services/events.js`).
- [ ] Confirm build tooling is gulp + Less + concatenation; npm scripts call `node` for `fixfa.js`/`fixgrid.js`; Node-RED nodes in `nodes/` serve built dashboard.
- [ ] Confirm assets: FA4, Material icons, Weather icons; i18n in `nodes/locales/`; `src/i18n.js` loader.

## Current Progress (v2 scaffold)
- [x] Bun toolchain: `bunfig`, bun scripts (`dev/build/test/lint/format`), Preact+HTM tsconfig, dependencies installed.
- [x] New `src/preact/` shell with Socket.IO bridge, tab list, connection status; builds to `dist/` via `bun run build`.
- [x] Lint/format config (ESLint/Prettier) scoped to new preact sources; tests run with `bun test`.
- [x] Layout: CSS Grid tabs/groups with theme-aware cards; hash routing for tab index and name; layout announcements dispatched.
- [x] Widgets: text, button, switch, text-input (CR/delay/blur), numeric (wrap/format), dropdown (custom with search/multi), slider (outs/all/end, invert, vertical, ticks/sign), gauge (ECharts gauge/donut/compass + wave SVG), chart (line/bar/pie/polar/radar/scatter/funnel/heatmap), form, date/colour picker, audio/TTS, toast/dialog, link, template, spacer; ui-control handlers for tab/group/control updates.
- [x] ECharts added (gauge/donut/compass/wave + all chart types); helper tests for widgets + layout utils in place.
- [x] I18n provider with locale fallback (`ui-control` lang → site lang/locale → browser → en) and localized aria/value strings across widgets; resolveLanguage unit tests added.
- [x] Full ui-control parity: tab show/hide/enable/disable, group show/hide/collapse/expand, tab navigation (+1/-1/by name), link tabs (newtab/thistab/iframe), group disp property, ui-collapse emission.
- [x] ARIA accessibility: keyboard navigation for dropdown/date-picker/colour-picker, proper roles (switch, slider, combobox), focus management, screen reader labels.
- [x] 154 tests passing across 33 test files (37 chart tests, wave gauge tests included).

## Goals & Constraints Checklist
- [x] Frontend rewritten in Preact; charts/gauges on Apache ECharts.
- [x] All tooling/scripts runnable with `bun` only (no `node`); prefer Bun bundler for dev/build.
- [x] Preserve Node-RED APIs + Socket.IO contract (`ui-controls`, `ui-replay-state`, `ui-replay-done`, `ui-change`, tab/group/control structure).
- [x] Drop legacy polyfills; target evergreen browsers.
- [x] Remove jQuery usage; replace with native DOM/utility helpers.
- [ ] Vendor all runtime deps (no CDN); bundle fonts/icons/assets locally.
- [x] Refactor client code to TypeScript (strict) using HTM templates (no JSX); configure tooling for `htm/preact`.
- [x] Align UX semantics (loading/no-tabs, navigation) with legacy Angular sources (`src/index.html`, `src/partials/main.html`, `src/main.js`) before altering behaviors.
- [x] Preact components must match legacy Angular layout and styling precisely; validate each widget against the Angular rendering for visual and UX fidelity.
- [x] Avoid self-referential/meta UI text (e.g., no "mirrors legacy" phrasing) while matching legacy behaviors.

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
- [x] Implement main area with CSS Grid groups/tabs (dense layout todo if needed).
- [x] Implement loading/no-tabs states mirroring legacy `loading.html`/`partials/main.html` behavior.
- [x] Add lightweight routing keyed by tab index/name (hash) matching `/$index` paths.

### 2) Data Layer (Socket.IO Bridge)
- [x] Port `UiEvents` to Preact hook/context: Socket bridge created with `emit/on/close` and `socketid` injection.
- [x] Handle `ui-controls` -> set state + emit `ui-replay-state`; handle `ui-replay-done`; emit `ui-change` on tab switch (selectTab emits).
- [x] Model app state: `menu`, `globals`, `site`, `selectedTab`, connection flags; preserve `msg.socketid` on emits.
- [x] Maintain `ui-collapse`, tab/group hide/show, `ui-control` messages semantics (all wired and tested).

### 3) Theme & Layout System
- [ ] Replace Less runtime with CSS variables derived from theme object (map `page-backgroundColor`, `widget-textColor`, etc.) — CSS vars mapped/applied to layout/widget frame; finish mapping remaining tokens and legacy fallbacks.
- [x] Implement runtime theme updates (CSS vars) without `less.modifyVars`; `applyThemeToRoot` in place.
- [x] Rebuild sizing logic (`sizes.js`) as Preact context/provider with resize hook; trigger on tab/group changes; dense grid toggle added.
- [x] Decide masonry/grid approach: CSS Grid groups with optional `grid-auto-flow:dense` for packing.
- [ ] Implementation strategy: keep the editor-side layout/ordering UI intact (Gridstack preview + `site.sizes` controls), and adapt the new runtime to consume the same saved tab/group/widget metadata. If a gap appears, reimplement only the runtime reader/adapter, not the editor UI, to preserve existing flows.

### 4) Widget Suite
- [x] Create `src/preact/components/` with widgets for text, button, switch, text-input, numeric, dropdown, slider, gauge, form, date-picker, colour-picker, audio, toast, link, template, spacer.
- [x] Build `ChartPanel` on ECharts covering line/bar/pie/donut/polar/radar/scatter/funnel/heatmap + streaming adapter for `values.series/labels/data`, `update/remove`, `useUTC`, `xformat`, `cutout`, `spanGaps`, `legend`, `interpolate`, `ymin/ymax`, `useOneColor`, `useDifferentColor`.
- [x] Build `Gauge` using ECharts gauge/donut/compass to replace JustGage, plus wave variant (custom SVG).
- [x] Build remaining core widgets: Form, Date/Colour picker, Audio/TTS, Toast/Dialog, Link, Template, Spacer.
- [x] Add shared `WidgetFrame` for labels, disabled state, sizing units, `className`.

### 5) Charts with Apache ECharts
- [x] Add shared ECharts loader (resize hook) and use it in gauge.
- [x] Map Chart.js options to ECharts (axes, tooltips with time formatting via `dayjs`, stacked bars, multi-series colors, `spanGaps`, smoothing/step, donut cutout).
- [x] Implement streaming updates: maintain series arrays, apply `remove`, call `setOption` with `replaceMerge` approach.
- [x] Add scatter chart type with configurable symbolSize.
- [x] Add funnel chart type with sort/align/gap options.
- [x] Add heatmap chart type with visualMap, category axes, and matrix data support.
- [x] Add dataZoom component for pan/zoom on large datasets (slider, inside, both modes).
- [x] Add markLine component for threshold/reference lines with customizable style.

#### ECharts chart panel implementation (ui_chart parity) ✅
All features implemented in `src/preact/components/widgets/chart.ts`:
- Supported looks: line, bar/horizontalBar, pie, polar-area, radar, **scatter**, **funnel**, **heatmap**
- Options: `legend`, `interpolate` (cubic/monotone/linear/bezier/step), `dot`, `useOneColor`, `useDifferentColor`, `colors`, `cutout`, `spanGaps`, `animation`, `useUTC`, `xformat`, `ymin/ymax`, className
- Scatter options: `symbolSize`
- Funnel options: `funnelSort` (ascending/descending/none), `funnelAlign` (left/center/right), `funnelGap`
- Heatmap options: `heatmapMin`, `heatmapMax`, `heatmapXLabels`, `heatmapYLabels`, matrix data as `[xIdx, yIdx, value]`
- **Data Zoom options**: `dataZoom`, `dataZoomType` (slider/inside/both), `dataZoomStart`, `dataZoomEnd`
- **Mark Line options**: `markLines` array with `value`, `label`, `color`, `lineStyle` (solid/dashed/dotted), `axis` (x/y)
- Data contract: full dataset payloads `{key,id, values:{series[], data[][], labels[]}}` and streaming `newPoint/update/remove` with timestamped points
- Tooltip/labels: format timestamps with `xformat` (fallback relative calendar) using dayjs; number formatting via locale
- Legend interaction: toggle series visibility with hidden state persistence
- Theming: CSS vars for text/grid/split-line colors; transparent background
- Performance: `useECharts` hook reuses instance; throttled resize
- Tests: 37 unit tests covering all looks, dataZoom, and markLines

#### Future ECharts Enhancements (optional)
Additional chart types and features available in ECharts that could be added:

**New Chart Types:**
- [ ] `CandlestickChart`: Financial OHLC data (stocks, crypto) — useful for trading dashboards
- [ ] `BoxplotChart`: Statistical distributions (quartiles, outliers) — useful for sensor analytics
- [ ] `TreemapChart`: Hierarchical proportions (disk usage, budgets) — useful for resource monitoring
- [ ] `SunburstChart`: Multi-level pie (org charts, file trees) — useful for hierarchical data
- [ ] `SankeyChart`: Flow relationships (energy flow, traffic) — useful for process monitoring
- [ ] `GraphChart`: Node-link diagrams (dependencies, networks) — useful for topology views
- [ ] `TreeChart`: Hierarchical tree structures (org charts) — useful for device hierarchies
- [ ] `ParallelChart`: Multivariate comparison (many dimensions) — useful for multi-sensor correlation
- [ ] `ThemeRiverChart`: Thematic evolution over time — useful for trend analysis
- [ ] `CalendarComponent` + `HeatmapChart`: Calendar-based heatmap (contributions, activity) — useful for historical patterns
- [ ] `PictorialBarChart`: Infographic-style icons as bars — useful for visual dashboards
- [ ] `MapChart` + GeoJSON: Geographic data visualization — useful for location-based IoT

**Feature Enhancements:**
- [ ] `MarkAreaComponent`: Highlight regions/ranges on charts (e.g., operating zones)
- [ ] Multiple Y-axes: Dual/triple axis for different scales (temperature + humidity)
- [ ] Mixed charts: Combine line + bar on same chart
- [ ] Waterfall bars: Show cumulative effect of sequential values
- [ ] `appendData` API: Optimized real-time streaming for high-frequency data
- [ ] Export to image: Save chart as PNG/SVG
- [ ] `BrushComponent`: Select regions to filter/highlight data

**Priority recommendations for IoT/Dashboard use:**
1. Candlestick — common for financial/trading dashboards
2. Sankey — energy/flow monitoring
3. Calendar heatmap — activity tracking (GitHub-style)
4. Multiple Y-axes — correlate different metrics
5. Mixed charts — overlay trend line on bar data
6. Mark areas — highlight operating zones/thresholds

### 6) Forms & Message Contract
- [x] Keep inbound `msg` handling identical; ensure outgoing emits include `msg.socketid` and node IDs.
- [x] Preserve tab/group hide/show storage (`th*`/`td*`/`g*`) in localStorage; trigger resize after changes.

### 7) i18n and Assets
- [ ] Reuse `nodes/locales/*` JSON with loader selecting `navigator.language` and English fallback.
- [ ] Replace Angular icon directives with plain `<i>`/SVG; keep FA/Material/Weather fonts initially; plan optional lighter set later.

### 8) Build & Packaging (Bun-only)
- [x] Add Bun scripts: dev/build/lint/test/format present; bun build to `dist/`.
- [ ] Remove gulp after parity; keep `fixfa.js`/`fixgrid.js` as Bun scripts or bake rewrites into build.
- [ ] Ensure Node-RED consumes `dist/`; update node paths if required.
- [ ] Vendor dependencies into bundle/output (no CDN fetches); include icon/font assets locally.

### 9) Testing Strategy
- [x] Add unit test setup with Bun test (Preact testing lib) for components, hooks, and data adapters (Socket bridge, ECharts adapter).
- [x] Add DOM-focused tests using @testing-library/preact for widgets (inputs, routing, theme variables).
- [x] Add contract tests for widgets (dropdown, slider, form, toast, audio) covering ui-control updates and behavior.
- [x] Add disabled behavior tests across all interactive widgets.
- [x] Add locale/intl formatting tests for international number/date display.
- [ ] Add lightweight E2E smoke via Playwright (bun test) covering tab navigation, theme switching, chart render, widget interaction.
- [ ] Add visual regression budget later (optional) once styles stabilize.
- [x] Integrate tests into Bun scripts (`bun test`) — 131 tests passing across 33 files.

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
- [x] Implement the ECharts chart panel (line/bar/hbar/pie/polar/radar/scatter/funnel/heatmap) plus streaming adapter and legend/tooltip parity.
- [x] Implement wave gauge variant using custom SVG rendering with animated wave fill.
- [ ] Finish theme variable coverage (remaining Less tokens) and apply to widget chrome hover/error states.
- [ ] Add E2E tests via Playwright for tab navigation, theme switching, and widget interactions.
- [ ] Remove gulp/legacy build once parity is acceptable; point Node-RED runtime to `dist/` by default.
- [ ] Restore remaining legacy dashboard layout behaviors: `hideToolbar`, swipe navigation (`allowSwipe`), locked menu modes.

## Widget Fit-Gap (rev4 – December 2024)

### ✅ Complete (feature parity achieved)
- **Text**: Format tokens, layout styles (row/column), tooltip support, theme-aware styling.
- **Button**: Colors, icons (FA/Material), payload types, disabled state, keyboard accessible, press feedback.
- **Switch**: On/off values with icons, passthrough mode, disabled state, ARIA switch role, keyboard toggle.
- **Text Input**: Enter/delay/blur modes, password visibility toggle, validation (required/pattern/maxlength), error states.
- **Numeric**: Wrap/clamp modes, locale-aware formatting, spinner controls, keyboard accessible.
- **Dropdown**: Custom dropdown (not native select), single/multi-select, search filter, keyboard navigation, option reset.
- **Slider**: Horizontal/vertical, invert, step with ticks, discrete mode, value display, ARIA slider role, keyboard control.
- **Gauge**: Standard/donut/compass on ECharts, segments, min/max/unit labels, theme colors, wave (animated SVG).
- **Form**: All field types (text/number/email/password/checkbox/select/radio/multiline), validation, reset, disabled state.
- **Date Picker**: Custom calendar overlay, keyboard navigation (arrows/home/end), locale formatting, min/max constraints.
- **Colour Picker**: Swatch trigger, hue bar, saturation/lightness picker, keyboard accessible, hex input.
- **Audio**: Playback controls, TTS synthesis with voice selection, reset, disabled state.
- **Toast**: Notifications and dialogs, OK/Cancel buttons, response callbacks, auto-dismiss timer, severity levels.
- **Link**: Internal/external navigation, disabled state, icon support.
- **Template**: HTML injection, dynamic `msg.template` updates, container styling.
- **Spacer**: Empty placeholder widget with aria-hidden.
- **Chart**: Line/bar/hbar/pie/polar/radar/scatter/funnel/heatmap on ECharts, streaming updates, legend/tooltips, stacked bars, donut cutout, nodata display, 28 chart tests.
- **Wave Gauge**: Animated liquid fill gauge variant with custom SVG rendering.

### ⏳ Pending
(All core widgets complete)

### Layout & Shell
- Tab navigation: ✅ Index and name-based hash routing, link tabs (newtab/thistab/iframe)
- Group cards: ✅ Collapse/expand, disp property, className, width, theme-aware surfaces
- Toolbar: ✅ Basic implementation (hideToolbar/locked menu modes pending)
- Sidebar menu: ✅ Tab icons, disabled/hidden tabs, connection status
- Theming: ✅ CSS variables from theme object, per-tab themes, derived text colors
