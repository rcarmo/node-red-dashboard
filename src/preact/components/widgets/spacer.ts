import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../../state";

export type SpacerControl = UiControl & {
  width?: number | string;
  height?: number | string;
  className?: string;
};

export function SpacerWidget(props: { control: UiControl; index: number }): VNode {
  const { control } = props;
  const c = control as SpacerControl;
  
  const width = typeof c.width === "number" ? `${c.width}px` : c.width ?? "100%";
  const height = typeof c.height === "number" ? `${c.height}px` : c.height ?? "1em";
  
  return html`<div
    class=${`nr-dashboard-spacer ${c.className ?? ""}`.trim()}
    style=${{ width, height, minHeight: height }}
    role="presentation"
    aria-hidden="true"
  ></div>`;
}
