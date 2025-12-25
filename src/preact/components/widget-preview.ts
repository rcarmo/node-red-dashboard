import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../state";
import { useElementSize } from "../hooks/useElementSize";
import { useI18n } from "../lib/i18n";

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
  const [ref, size] = useElementSize<HTMLDivElement>();
  const { t } = useI18n();

  if (type === "text" || type === "ui_text") {
    return html`<div ref=${ref} class="nr-dashboard-widget-preview">
      <strong>${label}</strong>
      <span class="nr-dashboard-widget-preview__value">${value || t("widget_preview_empty", "(no value yet)")}</span>
      <span class="nr-dashboard-widget-preview__size">
        ${Math.round(size.width)}×${Math.round(size.height)} px
      </span>
    </div>`;
  }

  return html`<div ref=${ref} class="nr-dashboard-widget-preview--inline">
    <span>${label}</span>
    <span class="nr-dashboard-widget-preview__type">${type}</span>
  </div>`;
}

export function WidgetPreviewWithSize(props: { control: UiControl; index: number }): VNode {
  // Deprecated alias kept for future swaps if needed
  return html`<${WidgetPreview} ...${props} />`;
}
