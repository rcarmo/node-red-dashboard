import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../state";
import { useSizes } from "../hooks/useSizes";

type WidgetFrameProps = {
  control: UiControl;
  children: VNode;
};

export function WidgetFrame({ control, children }: WidgetFrameProps): VNode {
  const sizes = useSizes();
  const padding = Math.max(8, (sizes.py ?? 0) + 4);
  const gap = Math.max(4, sizes.cx ?? 6);

  return html`<div
    class=${`nr-dashboard-widget-frame ${((control as { className?: string }).className ?? "").trim()}`.trim()}
    style=${{
      background: "var(--nr-dashboard-widgetBackgroundColor, #14171d)",
      border: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.08))",
      borderRadius: "8px",
      padding: `${padding}px`,
      display: "flex",
      flexDirection: "column",
      gap: `${gap}px`,
      color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
    }}
  >
    ${children}
  </div>`;
}