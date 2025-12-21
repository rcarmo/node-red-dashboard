import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../state";

function widgetLabel(control: UiControl, idx: number): string {
  const asAny = control as { type?: string; id?: string | number; name?: string; label?: string };
  if (asAny.label) return String(asAny.label);
  if (asAny.name) return String(asAny.name);
  if (asAny.type) return String(asAny.type);
  if (asAny.id) return `Widget ${asAny.id}`;
  return `Widget ${idx + 1}`;
}

export function WidgetPreview(props: { control: UiControl; index: number }): VNode {
  const { control, index } = props;
  const asAny = control as { type?: string; value?: unknown; text?: unknown; label?: string };
  const type = (asAny.type || "widget").toString();
  const label = widgetLabel(control, index);
  const value = (asAny.value ?? asAny.text ?? "").toString();

  if (type === "text" || type === "ui_text") {
    return html`<div style=${{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <strong>${label}</strong>
      <span style=${{ opacity: 0.9 }}>${value || "(no value yet)"}</span>
    </div>`;
  }

  return html`<div style=${{ display: "flex", justifyContent: "space-between", gap: "6px" }}>
    <span>${label}</span>
    <span style=${{ opacity: 0.65, fontSize: "11px" }}>${type}</span>
  </div>`;
}
