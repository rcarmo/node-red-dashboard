import { html } from "htm/preact";
import type { VNode } from "preact";
import { useState } from "preact/hooks";
import type { UiControl } from "../../state";

export type DatePickerControl = UiControl & {
  name?: string;
  label?: string;
  mode?: "date" | "time" | "datetime";
  value?: string;
  className?: string;
};

export function resolveDateInputType(mode?: string): "date" | "time" | "datetime-local" {
  if (mode === "time") return "time";
  if (mode === "datetime") return "datetime-local";
  return "date";
}

export function DatePickerWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const c = control as DatePickerControl;
  const label = c.label || c.name || `Date ${index + 1}`;
  const [value, setValue] = useState<string>(c.value || "");
  const isDisabled = Boolean(disabled);

  const inputType = resolveDateInputType(c.mode);

  return html`<label style=${{ display: "grid", gap: "6px" }}>
    <span style=${{ fontSize: "12px", opacity: 0.8 }}>${label}</span>
    <input
      class=${c.className || ""}
      type=${inputType}
      value=${value}
      disabled=${isDisabled}
      onInput=${(e: Event) => {
        if (isDisabled) return;
        const v = (e.target as HTMLInputElement).value;
        setValue(v);
        onEmit?.("ui-change", { payload: v });
      }}
      style=${{
        padding: "8px 10px",
        borderRadius: "6px",
        border: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.16))",
        background: "var(--nr-dashboard-widgetBackgroundColor, #0f1115)",
        color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
      }}
    />
  </label>`;
}
