# node-red-dashboard (Preact refactor)

[![platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
![License](https://img.shields.io/npm/l/node-red-dashboard)

This repository is an experimental refactor of the Node-RED Dashboard runtime to Preact + HTM, Bun, and Apache ECharts. It is not the published Angular-based dashboard. For production use today, see the legacy package at [node-red/node-red-dashboard](https://github.com/node-red/node-red-dashboard) or alternatives like [FlowFuse Dashboard](https://github.com/FlowFuse/node-red-dashboard) and [UIBUILDER](https://flows.nodered.org/node/node-red-contrib-uibuilder).

## Status

- **Active development**: replacing the Angular v1 client with a Preact runtime while keeping the existing Node-RED editor nodes and saved flows.
- **131 tests passing** across 33 test files covering widgets, layout, state, socket, and i18n.

### Current Runtime Features

| Category | Status |
|----------|--------|
| **App Shell** | Tab navigation, sidebar menu, toolbar, connection status, hash-based routing (`#/0`, `#/TabName`) |
| **Layout** | CSS Grid for groups with dense mode, masonry layout support, group collapse/expand, theme-aware cards |
| **Socket.IO** | Full bridge with `ui-controls`, `ui-replay-state`, `ui-replay-done`, `ui-change`, `ui-collapse`, `update-value` |
| **Tab/Group Control** | Show/hide/enable/disable tabs, show/hide/collapse/expand groups, tab navigation (+1/-1/by name), link tabs (newtab/thistab/iframe), `disp` property |
| **Theming** | CSS variables from theme object, per-tab themes, derived text colors, no runtime Less |
| **i18n** | Locale bundles with fallback (`ui-control` lang → site → browser → `en`), localized aria labels |
| **Accessibility** | ARIA roles, keyboard navigation, focus management, screen reader announcements |

### Widgets Implemented

| Widget | Status | Notes |
|--------|--------|-------|
| **Text** | ✅ Complete | Format tokens, layout styles, tooltip |
| **Button** | ✅ Complete | Colors, icons, payloads, disabled state, keyboard support |
| **Switch** | ✅ Complete | On/off values, colors, icons, passthrough, ARIA switch role |
| **Text Input** | ✅ Complete | Enter/delay/blur modes, validation, password toggle |
| **Numeric** | ✅ Complete | Wrap/clamp, format, locale, spinner controls |
| **Dropdown** | ✅ Complete | Custom dropdown (not native select), multi-select, search, keyboard navigation |
| **Slider** | ✅ Complete | Vertical, invert, ticks, step, discrete mode, ARIA slider |
| **Gauge** | ✅ Complete | Standard/donut/compass on ECharts (wave pending) |
| **Form** | ✅ Complete | All field types, validation, reset, dynamic fields |
| **Date Picker** | ✅ Complete | Custom calendar, keyboard navigation, locale formatting |
| **Colour Picker** | ✅ Complete | Swatch, hue/saturation picker, keyboard accessible |
| **Audio** | ✅ Complete | Playback, TTS synthesis, reset |
| **Toast** | ✅ Complete | Notifications, dialogs, response callbacks, auto-dismiss |
| **Link** | ✅ Complete | Internal/external links, disabled state |
| **Template** | ✅ Complete | HTML injection, dynamic updates |
| **Spacer** | ✅ Complete | Empty placeholder widget |
| **Chart** | ✅ Complete | Line/bar/horizontalBar/pie/polar/radar via ECharts, streaming updates, time windowing, stacking, legend interaction |

### Pending Work

- **Wave Gauge**: Animated wave fill gauge variant
- **E2E Tests**: Playwright integration tests
- **Legacy Cleanup**: Remove gulp/Angular after full parity

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

## Internationalization

- Locale selection uses `resolveLanguage` (precedence: runtime `ui-control` lang → site lang/locale → `navigator.language` → `en`).
- Strings come from the existing Node-RED locale bundles (`nodes/locales/`).
- Widget aria labels and value displays use translated strings when available.

## Running inside Node-RED with Bun

- Install Bun 1.x and Node-RED in your flow directory: `bun install node-red` (or run once via `bunx --bun node-red`).
- In this repo, install deps and build the Preact runtime: `bun install` then `bun run build` (outputs to `dist/`).
- Link the dashboard into your Node-RED user dir (e.g., `~/.node-red`): `bunx --bun npm link /path/to/node-red-dashboard` (or add `"node-red-dashboard": "file:/path/to/node-red-dashboard"` to `package.json` then `bun install`).
- Start Node-RED with Bun from your flow dir: `bunx --bun node-red -s settings.js`.
- Open the UI at `http://localhost:1880/ui` (or your configured `ui` path).
- Dev loop: `bun run dev` for watch builds, `bun run build` to refresh `dist/`, then restart Node-RED to pick up changes; keep `bun run lint` / `bun test` green.

## Repository layout (new runtime)

```
src/preact/
├── index.ts          # App shell, routing, theme application
├── state.ts          # Dashboard state, ui-control handlers
├── socket.ts         # Socket.IO bridge
├── types.ts          # TypeScript definitions
├── components/
│   ├── layout/       # TabNav, GroupGrid, GroupCard
│   ├── widgets/      # All widget implementations
│   ├── styles/       # Shared style objects
│   ├── ToastOverlay.ts
│   ├── WidgetFrame.ts
│   └── widget-renderer.ts
├── hooks/            # useSizes, useElementSize
└── lib/              # i18n, echarts, format, tts, payload helpers
```

Legacy Angular sources remain under `src/` for reference during migration.

## Test Coverage

- **131 tests** across **33 test files**
- Unit tests for all widgets, layout components, state handlers, socket bridge, and i18n
- Contract tests for dropdown, slider, form, toast, audio behaviors
- Disabled behavior tests across all interactive widgets
- Locale formatting tests for international number/date display

## Contributing

- Use Bun for all scripts (`bun run dev|build|lint|test|format`).
- Keep additions in Preact + HTM (no JSX) with strict TypeScript.
- Prefer Apache ECharts for charts/gauges; avoid adding jQuery/Chart.js/JustGage.
- Add tests alongside new code; avoid touching `dist/` in PRs.

## License

Apache-2.0 (see `LICENSE`).
