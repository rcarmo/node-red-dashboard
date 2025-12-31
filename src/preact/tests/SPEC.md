# Dashboard Test Flows Spec

Location: `src/preact/tests/fixtures/flows.json`

## Goals

- Exercise every dashboard widget with human-readable labels and minimal defaults.
  - Temporary exceptions: external links, audio voice id.
- Demonstrate common usage patterns: control feedback, chart/gauge data, messaging, navigation.
- Serve as a base for manual testing and future automated tests.
- One Node-RED workspace tab per scenario; one dashboard tab per scenario.
- Interactive wiring: controls feed charts/gauges/templates/toasts and UI control events.
- Ready to tweak: node names and topics are explicit for editing.

## Workspace Tabs (Node-RED)

- Flow - Controls: basic inputs and text feedback; link-out hub publisher.
- Flow - Forms: form/pickers; forwards submissions into the hub.
- Flow - Charts & Gauges: data generation, charts/gauges, and the central hub router.
- Flow - Media & Templates: toast/audio/template/link targets driven by hub traffic.
- Flow - Navigation & Control: ui_control exercises tab switching and event debugging.

## Dashboard Tabs / Groups

- Controls → Basic Controls
- Forms → Forms & Pickers
- Charts & Gauges → Charts, Gauges
- Media & Templates → Media & Messaging, Templates
- Navigation → Navigation & Control

## Message Topics / Routing

- `volume` (slider) → text display; mirrored to hub.
- `toggle` (switch) → text via function; mirrored to hub.
- `series` (dropdown) → hub (used to target chart topic slot).
- `gauge` (numeric) → hub → gauge.
- `echo` (text input) → hub → template and toast/audio.
- `toast` (button) → hub → toast.
- Form submit emits `form` topic.

## Hub Design

- Link out in Controls/Forms; hub lives on Charts flow (`linkHubIn` + `linkHubRouter`).
- Router switch by `msg.topic`:
  - `gauge` → gauge widget
  - `toast` → toast
  - `echo` → template/audio/ toast
  - `series` → chart (shares chart node for simplicity)
  - else → media/nav
- Link outs fan to Charts/Media/Nav flows.

## Scenario Notes

- Chart data: inject every 2s → function builds two-series payload with timestamp labels.
- Gauge accepts numeric from Controls via hub.
- Toast/Audo/Template receive `echo`/`toast` traffic; template echoes payload HTML.
- UI control: inject sets tab to "Charts & Gauges"; debug node shows connect/change/group events.

## Editing Guidance

- Rename tabs/groups/nodes via `name`/`label` in flows.json—kept short for readability.
- Add more series: update dropdown options and chart function payload.
- To test color/tts: send to colour picker and audio nodes; adjust voice id on `ui_audio`.
- Workspace/tab ids must be 16-hex chars (e.g., `f100000000000001`); keep each node's `z` matched to its tab id to avoid import errors.

## Expected Manual Tests

- Move slider → text updates; gauge reflects numeric when set.
- Toggle switch → text shows Enabled/Disabled.
- Dropdown → confirm hub routing (observe chart legend/topic).
- Enter text → template updates and toast shows message; audio speaks payload if string.
- Submit form → toast/debug shows payload; check validation of required fields.
- Click "Switch to Charts" inject → dashboard navigates to Charts tab; watch ui_control debug for events.
