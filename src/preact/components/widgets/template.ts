import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

export type TemplateControl = UiControl & {
  name?: string;
  template?: string;
  format?: string;
  style?: string;
  className?: string;
  templateScope?: "local" | "global";
  msg?: Record<string, unknown>;
};

export function resolveTemplateHtml(ctrl: TemplateControl): string {
  // Use msg.template if available (dynamic updates), otherwise use configured template/format
  const msgTemplate = (ctrl.msg as { template?: string } | undefined)?.template;
  return msgTemplate ?? ctrl.template ?? ctrl.format ?? "";
}

export function TemplateWidget(props: { control: UiControl; index: number }): VNode {
  const { control, index } = props;
  const c = control as TemplateControl;
  const { t } = useI18n();
  const title = c.name || t("template_label", "Template {index}", { index: index + 1 });
  const htmlContent = resolveTemplateHtml(c);
  const isGlobal = c.templateScope === "global";

  // Global templates inject into <head> or affect the whole page
  if (isGlobal) {
    // For global templates, we render a hidden container that just holds the HTML
    // This allows CSS/style tags to be injected
    return html`<div
      class="nr-dashboard-template--global"
      style=${{ display: "none" }}
      dangerouslySetInnerHTML=${{ __html: htmlContent }}
    ></div>`;
  }

  return html`<div class=${`nr-dashboard-template__outer ${c.className || ""}`.trim()}>
    <div class="nr-dashboard-template__inner">
      <div class="nr-dashboard-template__title">${title}</div>
      <div dangerouslySetInnerHTML=${{ __html: htmlContent }}></div>
    </div>
  </div>`;
}
