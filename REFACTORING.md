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
- [x] Layout: CSS Grid tabs/groups with theme-aware cards; hash routing for tab index; layout announcements dispatched.
- [x] Widgets: text, button, switch, text-input (CR/delay/blur), numeric (wrap/format), dropdown, slider (outs/all/end, invert, vertical, ticks/sign), gauge (ECharts gauge/donut), form, date/colour picker, audio, toast, link, template; ui-control handlers for tab/group/control updates.
- [x] ECharts added (gauge); helper tests for widgets + layout utils in place.
- [x] I18n provider with locale fallback (`ui-control` lang → site lang/locale → browser → en) and localized aria/value strings across widgets; resolveLanguage unit tests added.

## Goals & Constraints Checklist
- [ ] Frontend rewritten in Preact; charts/gauges on Apache ECharts.
- [ ] All tooling/scripts runnable with `bun` only (no `node`); prefer Bun bundler for dev/build.
- [ ] Preserve Node-RED APIs + Socket.IO contract (`ui-controls`, `ui-replay-state`, `ui-replay-done`, `ui-change`, tab/group/control structure).
- [ ] Drop legacy polyfills; target evergreen browsers.
- [ ] Remove jQuery usage; replace with native DOM/utility helpers.
- [ ] Vendor all runtime deps (no CDN); bundle fonts/icons/assets locally.
- [ ] Refactor client code to TypeScript (strict) using HTM templates (no JSX); configure tooling for `htm/preact`.
- [ ] Align UX semantics (loading/no-tabs, navigation) with legacy Angular sources (`src/index.html`, `src/partials/main.html`, `src/main.js`) before altering behaviors.
- [ ] Preact components must match legacy Angular layout and styling precisely; validate each widget against the Angular rendering for visual and UX fidelity.
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
- [x] Implement main area with CSS Grid groups/tabs (dense layout todo if needed).
- [x] Implement loading/no-tabs states mirroring legacy `loading.html`/`partials/main.html` behavior.
- [x] Add lightweight routing keyed by tab index/name (hash) matching `/$index` paths.

### 2) Data Layer (Socket.IO Bridge)
- [x] Port `UiEvents` to Preact hook/context: Socket bridge created with `emit/on/close` and `socketid` injection.
- [x] Handle `ui-controls` -> set state + emit `ui-replay-state`; handle `ui-replay-done`; emit `ui-change` on tab switch (selectTab emits).
- [x] Model app state: `menu`, `globals`, `site`, `selectedTab`, connection flags; preserve `msg.socketid` on emits.
- [ ] Maintain `ui-collapse`, tab/group hide/show, `ui-control` messages semantics (tab/group toggles wired; ui-collapse pending).

### 3) Theme & Layout System
- [ ] Replace Less runtime with CSS variables derived from theme object (map `page-backgroundColor`, `widget-textColor`, etc.) — CSS vars mapped/applied to layout/widget frame; finish mapping remaining tokens and legacy fallbacks.
- [x] Implement runtime theme updates (CSS vars) without `less.modifyVars`; `applyThemeToRoot` in place.
- [x] Rebuild sizing logic (`sizes.js`) as Preact context/provider with resize hook; trigger on tab/group changes; dense grid toggle added.
- [x] Decide masonry/grid approach: CSS Grid groups with optional `grid-auto-flow:dense` for packing.
- [ ] Implementation strategy: keep the editor-side layout/ordering UI intact (Gridstack preview + `site.sizes` controls), and adapt the new runtime to consume the same saved tab/group/widget metadata. If a gap appears, reimplement only the runtime reader/adapter, not the editor UI, to preserve existing flows.

- [x] Create `src/preact/components/` with widgets for text, button, switch, text-input, numeric, dropdown, slider, gauge.
- [ ] Build `ChartPanel` on ECharts covering line/bar/pie/donut/polar/radar + streaming adapter for `values.series/labels/data`, `update/remove`, `useUTC`, `xformat`, `cutout`, `spanGaps`, `legend`, `interpolate`, `ymin/ymax`.
- [x] Build `Gauge` using ECharts gauge/donut to replace JustGage (wave/compass pending).
- [x] Build remaining core widgets: Form, Date/Colour picker, Audio, Toast, Link, Template.
- [x] Add shared `WidgetFrame` for labels, disabled state, sizing units, `className`.

### 5) Charts with Apache ECharts
- [x] Add shared ECharts loader (resize hook) and use it in gauge.
- [ ] Map Chart.js options to ECharts (axes, tooltips with time formatting via `dayjs`, stacked bars, multi-series colors, `spanGaps`, smoothing/step, donut cutout).
- [ ] Implement streaming updates: maintain series arrays, apply `remove`, call `setOption({series,xAxis,yAxis},{notMerge:false,replaceMerge:['series']}).

#### ECharts chart panel plan (ui_chart parity)
- Supported looks: line (time/number x-axis), bar/horizontalBar, pie, polar-area, radar; respect `legend`, `interpolate` (cubic/monotone/linear/bezier/step), `dot`, `useOneColor`, `useDifferentColor`, `colors`, `cutout`, `spanGaps`, `animation`, `useUTC`, `xformat`, `ymin/ymax`, className.
- Data contract: handle full dataset payloads `{key,id, values:{series[], data[][], labels[]}}` and streaming `newPoint/update/remove` records with timestamped points for line charts; reset on empty array.
- Tooltip/labels: format timestamps with `xformat` (fallback relative calendar) using dayjs; number formatting via locale; show series/label for pie/polar.
- Legend interaction: toggle series visibility and persist hidden state per series in `replaceMerge`.
- Theming: use CSS vars for text/grid colors; adopt widget text color for axes/legend; background transparent.
- Performance: reuse chart instance via `useECharts`; throttle resize via existing hook; avoid `setOption` churn by keeping series state in a reducer and applying `replaceMerge` on `series`.
- Tests: unit test option mapping for each look, streaming update behavior (append, remove), `useUTC`/`xformat` formatting, spanGaps, legend toggle state, and pie/bar data shape mapping.

### 6) Forms & Message Contract
- [ ] Keep inbound `msg` handling identical; ensure outgoing emits include `msg.socketid` and node IDs.
- [ ] Preserve tab/group hide/show storage (`th*`/`td*`/`g*`) or replace with clearer keys; trigger resize after changes.

### 7) i18n and Assets
- [ ] Reuse `nodes/locales/*` JSON with loader selecting `navigator.language` and English fallback.
- [ ] Replace Angular icon directives with plain `<i>`/SVG; keep FA/Material/Weather fonts initially; plan optional lighter set later.

### 8) Build & Packaging (Bun-only)
- [x] Add Bun scripts: dev/build/lint/test/format present; bun build to `dist/`.
- [ ] Remove gulp after parity; keep `fixfa.js`/`fixgrid.js` as Bun scripts or bake rewrites into build.
- [ ] Ensure Node-RED consumes `dist/`; update node paths if required.
- [ ] Vendor dependencies into bundle/output (no CDN fetches); include icon/font assets locally.

### 9) Testing Strategy
- [x] Add unit test setup with Vitest (Preact testing lib) for components, hooks, and data adapters (Socket bridge, ECharts adapter).
- [x] Add DOM-focused tests using @testing-library/preact for widgets (inputs, routing, theme variables).
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
- [ ] Implement the ECharts chart panel (line/bar/hbar/pie/polar/radar) plus streaming adapter and legend/tooltip parity.
- [ ] Finish theme variable coverage (Less tokens) and apply to the refreshed widget chrome, including disabled/error/hover states.
- [ ] Harden `ui-control` parity (ui-collapse coverage, socket contract tests) and validate toast/audio overlays against legacy flows.
- [ ] Expand i18n coverage to layout chrome (toolbar/menu/system messages) and ensure locale bundles are reused end-to-end.
- [ ] Remove gulp/legacy build once parity is acceptable; point Node-RED runtime to `dist/` by default.
- [ ] Restore legacy dashboard layout behaviors: honor `hideToolbar`, reuse site/tab titles in the toolbar, gate menu toggle/nav on tab count, auto-close the nav on tab select when unlocked, render real tab icons (not letter-only), and add swipe handling that respects `allowSwipe` (`menu` to open/close nav; `true`/`mouse` to switch tabs; disable mouse swipes unless explicitly allowed).

## Widget Fit-Gap (rev2)
- Button: now taller with stronger elevation and focus ring; still missing ripple/ink feedback, legacy pillier radius option, and disabled token contrast. Needs optional left icon spacing tokens and loading/active states to mirror Angular MD.
- Switch: track/knob enlarged and focus shadow improved; still lacks ripple, alternate label placement (left), and themed disabled tint. Keyboard focus outline could be more visible against dark themes.
- Slider: track/thumb thickened and vertical height raised; ticks/step markers still absent, value chip only simple text, no min/max captions, and no legend for discrete steps. Styling differs from legacy MD bubble and tick marks.
- Numeric: boxed field now; still no +/- spinner buttons, helper/error text spacing, or dedicated value display separate from label. Border/fill tokens should respond to error/disabled more clearly.
- Text Input: boxed with helper text and optional color swatch; still missing prefix/suffix icon support, clear button, and filled vs outlined style toggle. Required/helper spacing could match legacy MD rhythm more tightly.
- Dropdown: boxed with chevron; still native select (no custom menu surface, elevation, or multi-select chips). Placeholder is a disabled option; lacks search/filter and consistent option padding vs legacy.
- Date Picker: boxed native inputs only; no calendar/time overlay, no inline calendar icon affordance, and limited locale formatting/validation hints compared to legacy picker.
- Colour Picker: boxed with swatch + hex label; still just `<input type=color>` (no hue/lightness/alpha sliders, no popover). Disabled state uses native UI; value display lacks contrast token.
- Text: supports configurable weight; still lacks two-line/secondary text styling, per-layout spacing presets, and optional label hiding when not needed. Font tokens per theme not fully mapped.
- Link: now padded tile with focus ring; still lacks visited/pressed states and toolbar-aligned spacing presets. No inline external indicator beyond icon.
- Toast: added tone stripe, padding, larger dismiss; still missing per-corner spacing logic, action buttons, and max-visible stack behavior tuning vs legacy.
- Gauge: thicker strokes/pointer; wave look not implemented, compass/wave visuals simplified, and label/unit typography still lighter than JustGage. Needs card padding toggle and legacy pointer cap styles.
- Form: base controls styled but helper/error spacing and grid rhythm diverge from legacy MD. No numeric spinners, select menu styling remains native, and submit button lacks ripple/raised states matching other buttons.
- Audio: now has padded header row; still missing status text/timecode, play-state icon change, and disabled visual overlay.
- Template: padded container added; still no sandboxing or legacy Angular interpolation; users must supply own padding/background for custom content consistency.
- Chart: ECharts panel still pending; legacy Chart.js looks (legends, tooltips, stacked bars, polar/radar, cutout, gradients, spanGaps) and streaming behaviors need full parity implementation.
