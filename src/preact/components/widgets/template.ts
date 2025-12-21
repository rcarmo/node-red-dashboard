import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../../state";

export type TemplateControl = UiControl & {
  name?: string;
  template?: string;
  format?: string;
  style?: string;
  className?: string;
};

export function resolveTemplateHtml(ctrl: TemplateControl): string {
  return ctrl.template || ctrl.format || "";
}

export function TemplateWidget(props: { control: UiControl; index: number }): VNode {
  const { control, index } = props;
  const c = control as TemplateControl;
  const title = c.name || `Template ${index + 1}`;
  const htmlContent = resolveTemplateHtml(c);

  return html`<div class=${c.className || ""} style=${{ width: "100%" }}>
    <div style=${{ fontSize: "12px", opacity: 0.7, marginBottom: "4px" }}>${title}</div>
    <div dangerouslySetInnerHTML=${{ __html: htmlContent }}></div>
  </div>`;
}
