import { html } from "htm/preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

export type TextInputControl = UiControl & {
  label?: string;
  name?: string;
  mode?: string;
  delay?: number;
  sendOnBlur?: boolean;
  tooltip?: string;
  className?: string;
  value?: string;
  required?: boolean;
  pattern?: string;
  error?: string;
};

function inputType(mode?: string): string {
  if (!mode) return "text";
  if (mode.startsWith("time")) return "time";
  if (mode === "date") return "date";
  if (mode === "datetime-local") return "datetime-local";
  if (mode === "password") return "password";
  if (mode === "email") return "email";
  if (mode === "number") return "number";
  return "text";
}

export function buildTextEmit(ctrl: TextInputControl, fallbackLabel: string, value: string): Record<string, unknown> {
  return {
    payload: value,
    topic: (ctrl as { topic?: string }).topic ?? fallbackLabel,
    type: "text-input",
  };
}

export function TextInputWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const asInput = control as TextInputControl;
  const { t } = useI18n();
  const label = asInput.label || asInput.name || t("input_label", "Input {index}", { index: index + 1 });
  const [value, setValue] = useState<string>((asInput.value as string) ?? "");
  const [error, setError] = useState<string>("");
  const maxLength = (control as { maxlength?: number }).maxlength;
  const delay = Number.isFinite(asInput.delay) ? Number(asInput.delay) : 0;
  const sendOnEnter = delay <= 0 || (control as { type?: string }).type === "text-input-CR";
  const timer = useRef<number | undefined>(undefined);
  const type = useMemo(() => inputType(asInput.mode), [asInput.mode]);
  const pattern = asInput.pattern ? new RegExp(asInput.pattern) : null;

  const validate = (next: string): boolean => {
    if (asInput.required && next.trim().length === 0) {
      setError(asInput.error || t("error_required", "This field is required."));
      return false;
    }
    if (pattern && !pattern.test(next)) {
      setError(asInput.error || t("error_pattern", "Value does not match the required format."));
      return false;
    }
    setError("");
    return true;
  };

  useEffect(() => () => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
    }
  }, []);

  const emitValue = (next: string) => {
    if (!onEmit) return;
    if (!validate(next)) return;
    const payload = buildTextEmit(asInput, label, next);
    onEmit("ui-control", payload);
  };

  const scheduleEmit = (next: string) => {
    if (!onEmit) return;
    if (delay <= 0) return;
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => emitValue(next), delay);
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const next = target.value;
    setValue(next);
    if (!sendOnEnter) {
      scheduleEmit(next);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (sendOnEnter && e.key === "Enter") {
      emitValue(value);
    }
  };

  const handleBlur = () => {
    validate(value);
    if (asInput.sendOnBlur) {
      emitValue(value);
    }
  };

  return html`<label style=${{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
    <span style=${{ fontSize: "13px", opacity: 0.8, color: "var(--nr-dashboard-widgetTextColor, inherit)" }}>${label}</span>
    ${asInput.required
      ? html`<span style=${{ fontSize: "11px", opacity: 0.72 }}>${t("required_label", "Required")}</span>`
      : null}
    <input
      class=${asInput.className || ""}
      type=${type}
      value=${value}
      title=${asInput.tooltip || undefined}
      disabled=${Boolean(disabled)}
      aria-invalid=${error ? "true" : "false"}
      aria-errormessage=${error ? `err-${index}` : undefined}
      inputMode=${type === "number" ? "decimal" : type === "email" ? "email" : undefined}
      maxLength=${maxLength || undefined}
      onInput=${handleChange}
      onKeyDown=${handleKeyDown}
      onBlur=${handleBlur}
      style=${{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: error
          ? "1px solid var(--nr-dashboard-errorColor, #f87171)"
          : "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.18))",
        background: "var(--nr-dashboard-widgetBackgroundColor, rgba(255,255,255,0.05))",
        color: "var(--nr-dashboard-widgetTextColor, inherit)",
      }}
    />
    ${typeof maxLength === "number"
      ? html`<span style=${{ fontSize: "11px", opacity: 0.65, alignSelf: "flex-end" }}>
          ${t("char_counter", "{used}/{max}", { used: value.length, max: maxLength })}
        </span>`
      : null}
    ${error
      ? html`<span
          id=${`err-${index}`}
          role="alert"
          style=${{ color: "var(--nr-dashboard-errorColor, #f87171)", fontSize: "12px" }}
        >${error}</span>`
      : null}
  </label>`;
}
