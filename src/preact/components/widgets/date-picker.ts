import { html } from "htm/preact";
import type { VNode } from "preact";
import { useState } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";
import { formatDateInput } from "../../lib/format";

export type DatePickerControl = UiControl & {
  name?: string;
  label?: string;
  mode?: "date" | "time" | "datetime";
  value?: string;
  className?: string;
  min?: string;
  max?: string;
  required?: boolean;
  error?: string;
};

export function resolveDateInputType(mode?: string): "date" | "time" | "datetime-local" {
  if (mode === "time") return "time";
  if (mode === "datetime") return "datetime-local";
  return "date";
}

export function DatePickerWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const c = control as DatePickerControl;
  const { t, lang } = useI18n();
  const label = c.label || c.name || t("date_label", "Date {index}", { index: index + 1 });
  const [value, setValue] = useState<string>(c.value || "");
  const [error, setError] = useState<string>("");
  const isDisabled = Boolean(disabled);

  const inputType = resolveDateInputType(c.mode);

  const validate = (next: string): boolean => {
    if (c.required && next.trim().length === 0) {
      setError(c.error || t("error_required", "A value is required."));
      return false;
    }
    if (c.min && next && next < c.min) {
      setError(c.error || t("error_min", "Value is before the allowed range."));
      return false;
    }
    if (c.max && next && next > c.max) {
      setError(c.error || t("error_max", "Value is after the allowed range."));
      return false;
    }
    setError("");
    return true;
  };

  return html`<label style=${{ display: "grid", gap: "4px" }}>
    <span style=${{ fontSize: "12px", opacity: 0.8 }}>${label}</span>
    <input
      class=${c.className || ""}
      type=${inputType}
      value=${value}
      disabled=${isDisabled}
      lang=${lang}
      aria-invalid=${error ? "true" : "false"}
      aria-errormessage=${error ? `err-date-${index}` : undefined}
      aria-valuetext=${formatDateInput(value, c.mode, lang) || undefined}
      onInput=${(e: Event) => {
        if (isDisabled) return;
        const v = (e.target as HTMLInputElement).value;
        setValue(v);
        if (!validate(v)) return;
        onEmit?.("ui-change", { payload: v });
      }}
      style=${{
        padding: "8px 4px",
        borderRadius: "2px",
        border: "none",
        borderBottom: error
          ? "2px solid var(--nr-dashboard-errorColor, #f87171)"
          : "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.35))",
        background: "transparent",
        color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
        outline: "none",
        transition: "border-color 120ms ease",
      }}
      onFocus=${(e: FocusEvent) => {
        const el = e.target as HTMLInputElement;
        if (error) return;
        el.style.borderBottom = "2px solid var(--nr-dashboard-widgetColor, #1f8af2)";
      }}
      onBlur=${(e: FocusEvent) => {
        const el = e.target as HTMLInputElement;
        if (error) return;
        el.style.borderBottom = "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.35))";
      }}
      min=${c.min || undefined}
      max=${c.max || undefined}
    />
    ${error
      ? html`<span
          id=${`err-date-${index}`}
          role="alert"
          style=${{ color: "var(--nr-dashboard-errorColor, #f87171)", fontSize: "12px" }}
        >${error}</span>`
      : null}
  </label>`;
}
