import { html } from "htm/preact";
import type { VNode } from "preact";
import { useState } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

export type ColourPickerControl = UiControl & {
  name?: string;
  label?: string;
  value?: string;
  className?: string;
};

export function resolveColourValue(value?: string, fallback = "#ff0000"): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return fallback;
}

export function ColourPickerWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const c = control as ColourPickerControl;
  const { t } = useI18n();
  const label = c.label || c.name || t("colour_label", "Colour {index}", { index: index + 1 });
  const [value, setValue] = useState<string>(resolveColourValue(c.value));
  const isDisabled = Boolean(disabled);

  return html`<label style=${{ display: "grid", gap: "6px" }}>
    <span style=${{ fontSize: "12px", opacity: 0.8, color: "var(--nr-dashboard-widgetTextColor, inherit)" }}>${label}</span>
    <input
      class=${c.className || ""}
      type="color"
      value=${value}
      disabled=${isDisabled}
      onInput=${(e: Event) => {
        if (isDisabled) return;
        const v = (e.target as HTMLInputElement).value;
        setValue(v);
        onEmit?.("ui-change", { payload: v });
      }}
      style=${{
        width: "100%",
        minHeight: "28px",
        padding: "0",
        border: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.2))",
        background: "var(--nr-dashboard-widgetBackgroundColor, #0f1115)",
      }}
    />
  </label>`;
}
