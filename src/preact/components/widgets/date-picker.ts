import { html } from "htm/preact";
import type { VNode } from "preact";
import { useMemo, useState } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";
import { formatDateInput } from "../../lib/format";
import { buildFieldStyles, fieldLabelStyles } from "../styles/fieldStyles";

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
  const [focused, setFocused] = useState<boolean>(false);
  const inputId = useMemo(() => `nr-dashboard-date-${index}`, [index]);
  const isDisabled = Boolean(disabled);

  const containerStyle = useMemo(
    () => ({ display: "flex", flexDirection: "column", width: "100%", marginTop: "8px" }),
    [],
  );
  const rowStyle = useMemo(() => ({ display: "flex", alignItems: "center", width: "100%" }), []);
  const labelStyle = useMemo(
    () => ({ ...fieldLabelStyles, marginLeft: "8px", marginRight: "12px", whiteSpace: "nowrap", marginBottom: "0" }),
    [],
  );
  const inputContainerStyle = useMemo(
    () => ({ position: "relative", flex: "1 1 auto", width: "100%", padding: "0" }),
    [],
  );
  const iconStyle = useMemo(
    () => ({
      position: "absolute",
      right: "6px",
      top: "-5px",
      width: "40px",
      height: "40px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--nr-dashboard-widgetBackgroundColor, rgba(0,0,0,0.54))",
      pointerEvents: "none",
    }),
    [],
  );

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

  const fieldStyles = buildFieldStyles({ error: Boolean(error), focused, disabled: isDisabled, hasAdornment: true });

  return html`<div style=${containerStyle}>
    <div style=${rowStyle}>
      <label for=${inputId} style=${labelStyle}>${label}</label>
      <div style=${inputContainerStyle}>
        <input
          id=${inputId}
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
          onFocus=${() => setFocused(true)}
          onBlur=${() => setFocused(false)}
          style=${{ ...fieldStyles, paddingRight: "55px", width: "100%" }}
          min=${c.min || undefined}
          max=${c.max || undefined}
        />
        <span aria-hidden="true" style=${iconStyle}>
          <i class="fa fa-calendar" aria-hidden="true"></i>
        </span>
      </div>
    </div>
    ${error
      ? html`<span
          id=${`err-date-${index}`}
          role="alert"
          style=${{ color: "var(--nr-dashboard-errorColor, #f87171)", fontSize: "12px", marginLeft: "8px", marginTop: "4px" }}
        >${error}</span>`
      : null}
  </div>`;
}
