# Copilot Project Guidelines

## Stack and Tooling
- Use Bun only for scripts, dev server, tests, and builds (no `node`).
- Target Preact + TypeScript (strict) with HTM (no JSX); use `htm/preact` tagged templates instead of JSX and configure tooling accordingly.
- Charts/gauges should use Apache ECharts; no Chart.js/JustGage in new code.
- Remove/avoid jQuery and large utility deps; prefer native DOM and small helpers.
- Vendor dependencies and assets (no CDN); keep fonts/icons local in the bundle.

## Coding Style
- TypeScript strict, no implicit anys; prefer explicit return types on exported functions/components.
- Use HTM tagged templates (`html
` via `htm/preact`) instead of JSX; ensure lint/format respects HTM.
- Functional, composable components with hooks; avoid classes and legacy Angular patterns.
- Keep components small and stateful logic in hooks; lift side-effects to effects with cleanup.
- Prefer immutable data updates; avoid in-place mutation except for performance-critical code.
- Use modern syntax: optional chaining, nullish coalescing, template literals; avoid legacy polyfills.
- Accessibility: label form controls, manage focus on dialogs/toasts, and respect reduced motion where applicable.
- Theming: consume CSS variables; do not reintroduce runtime Less. No inline colors when a token/variable exists.
- Networking/events: use the Socket.IO bridge/hook; always include `socketid` when emitting messages.
- When reproducing behaviors (loading states, UX), reference the legacy Angular sources (`src/index.html`, `src/partials/main.html`, `src/main.js`) to preserve semantics and states before changing behavior.
- Avoid self-referential or meta descriptions in UI text/comments (e.g., no "mirrors legacy loading state" in user-facing copy); keep labels descriptive and user-focused.

## Project Structure (new code)
- Place new Preact code under `src/preact/` with `components/`, `hooks/`, `lib/`, `styles/` as needed.
- Shared UI chrome goes in layout components; widget-specific logic in widget components; cross-cutting utilities in `lib/`.
- Keep ECharts adapters in a dedicated module; isolate data-shape translation from rendering.

## Testing Approach
- Unit and hook/component tests: Vitest + @testing-library/preact.
- Socket contract tests: mock Socket.IO client; cover `ui-controls`, `ui-replay-state`, `ui-change` flows.
- E2E smoke: Playwright (via Bun) for tab navigation, theme switch, chart render, and basic widget interactions.
- Add tests alongside code (`*.test.ts[x]`); prefer fast, deterministic tests.

## Build and Scripts
- Scripts should be runnable with `bun run ...`; prefer `bun build` for bundling.
- No new gulp/Grunt/Webpack usage; keep the pipeline minimal.
- Keep outputs in `dist/` for Node-RED to serve.

## Dependencies
- Keep dependencies lean; favor tree-shakeable ESM packages.
- Avoid moment/lodash-style heavy deps; prefer `dayjs`-sized utilities when needed.

## Review Checklist (for PRs)
- Bun scripts pass (build/test/lint if present).
- No new jQuery/Angular/Chart.js/JustGage usage.
- Components typed and adhere to strict TS; props validated via interfaces/types.
- Accessibility and theming respected; no hard-coded colors where tokens exist.
- Tests added/updated for changed behavior; E2E added for new flows when practical.
