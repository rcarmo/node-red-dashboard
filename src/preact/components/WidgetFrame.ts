import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../state";
import { useSizes } from "../hooks/useSizes";

type WidgetFrameProps = {
  control: UiControl;
  disabled?: boolean;
  children: VNode;
};

export function WidgetFrame({ control, disabled, children }: WidgetFrameProps): VNode {
  const sizes = useSizes();
  const padding = Math.max(8, (sizes.py ?? 0) + 4);
  const gap = Math.max(4, sizes.cx ?? 6);
  const controlDisabled = (control as { disabled?: boolean }).disabled === true;
  const controlEnabled = (control as { enabled?: boolean }).enabled;
  const isDisabled = Boolean((disabled ?? controlDisabled) || controlEnabled === false);

  return html`<div
    class=${`nr-dashboard-widget-frame ${((control as { className?: string }).className ?? "").trim()}`.trim()}
    style=${{
      background: "var(--nr-dashboard-widgetBackgroundColor, transparent)",
      border: "1px solid var(--nr-dashboard-widgetBorderColor, transparent)",
      borderRadius: "8px",
      padding: `${padding}px`,
      display: "flex",
      flexDirection: "column",
      gap: `${gap}px`,
      color: "var(--nr-dashboard-widgetTextColor, inherit)",
      opacity: isDisabled ? 0.55 : 1,
      pointerEvents: isDisabled ? "none" : "auto",
    }}
    aria-disabled=${isDisabled}
  >
    ${children}
  </div>`;
}