import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../../state";

export type ToastControl = UiControl & {
  name?: string;
  label?: string;
  message?: string;
  level?: "info" | "warn" | "error";
};

export function resolveToastToneColor(level?: "info" | "warn" | "error"): string {
  if (level === "error") return "#f87171";
  if (level === "warn") return "#facc15";
  return "#60a5fa";
}

export function ToastWidget(props: { control: UiControl; index: number }): VNode {
  const { control, index } = props;
  const c = control as ToastControl;
  const label = c.label || c.name || `Toast ${index + 1}`;
  const msg = c.message || "Toast message";
  const tone = c.level || "info";
  const toneColor = resolveToastToneColor(tone);

  return html`<div
    style=${{
      border: `1px solid ${toneColor}`,
      padding: "8px 10px",
      borderRadius: "8px",
      background: "rgba(255,255,255,0.04)",
    }}
  >
    <div style=${{ fontWeight: 600, marginBottom: "4px" }}>${label}</div>
    <div style=${{ fontSize: "13px" }}>${msg}</div>
  </div>`;
}
