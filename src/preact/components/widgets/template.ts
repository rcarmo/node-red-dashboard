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
  value?: unknown;
};

function interpolateTemplate(template: string, ctrl: TemplateControl): string {
  // Simple mustache-like interpolation for {{msg.xxx}} and {{value}} patterns
  const msg = ctrl.msg ?? {};
  const value = ctrl.value;
  
  return template
    // Handle {{msg.payload}}, {{msg.topic}}, etc.
    .replace(/{{\s*msg\.(\w+)\s*}}/gi, (_, key) => {
      const val = (msg as Record<string, unknown>)[key];
      return val === undefined || val === null ? "" : String(val);
    })
    // Handle {{payload}} directly (legacy shorthand)
    .replace(/{{\s*payload\s*}}/gi, () => {
      const payload = (msg as { payload?: unknown }).payload ?? value;
      return payload === undefined || payload === null ? "" : String(payload);
    })
    // Handle {{value}}
    .replace(/{{\s*value\s*}}/gi, () => {
      return value === undefined || value === null ? "" : String(value);
    });
}

export function resolveTemplateHtml(ctrl: TemplateControl): string {
  // Use msg.template if available (dynamic updates), otherwise use configured template/format
  const msgTemplate = (ctrl.msg as { template?: string } | undefined)?.template;
  const rawTemplate = msgTemplate ?? ctrl.template ?? ctrl.format ?? "";
  return interpolateTemplate(rawTemplate, ctrl);
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
