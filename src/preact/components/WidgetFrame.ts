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
  const padding = Math.max(8, sizes.py ?? 8);
  const gap = Math.max(6, sizes.cx ?? 6);
  const controlDisabled = (control as { disabled?: boolean }).disabled === true;
  const controlEnabled = (control as { enabled?: boolean }).enabled;
  const isDisabled = Boolean((disabled ?? controlDisabled) || controlEnabled === false);

  const frameClass = `nr-dashboard-widget-frame${isDisabled ? " is-disabled" : ""} ${((control as { className?: string }).className ?? "").trim()}`.trim();

  return html`<div
    class=${frameClass}
    style=${{
      "--nr-widget-padding": `${padding}px`,
      "--nr-widget-gap": `${gap}px`,
    }}
    aria-disabled=${isDisabled}
  >
    ${children}
  </div>`;
}