import { html } from "htm/preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";
const TEXT_INPUT_STYLE_ID = "nr-dashboard-textinput-style";

function ensureTextInputStyles(doc: Document | undefined = typeof document !== "undefined" ? document : undefined): void {
  if (!doc) return;
  if (doc.getElementById(TEXT_INPUT_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = TEXT_INPUT_STYLE_ID;
  style.textContent = `
    .nr-dashboard-textinput {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      box-sizing: border-box;
    }

    .nr-dashboard-textinput__container {
      flex: 1;
      padding: 0 12px;
      margin: 15px 0;
      transition: margin 0.3s ease;
      position: relative;
      box-sizing: border-box;
    }

    .nr-dashboard-textinput__container.has-label.nr-dashboard-textinput__container--focused,
    .nr-dashboard-textinput__container.has-label.nr-dashboard-textinput__container--has-value {
      margin: 15px 0 5px;
    }

    .nr-dashboard-textinput__label {
      display: block;
      padding-left: 12px;
      margin-bottom: 3px;
      color: var(--nr-dashboard-widgetTextColor, inherit);
      font-size: 14px;
      line-height: 1.35;
    }

    .nr-dashboard-textinput__container--focused .nr-dashboard-textinput__label {
      color: var(--nr-dashboard-groupTextColor, var(--nr-dashboard-widgetBackgroundColor, #1f8af2));
    }

    .nr-dashboard-textinput__field {
      display: flex;
      align-items: center;
      gap: 8px;
      border: none;
      border-bottom: 1px solid var(--nr-dashboard-widgetTextColor, rgba(0,0,0,0.6));
      padding: 8px 0;
      background: transparent;
      box-sizing: border-box;
      opacity: 1;
    }

    .nr-dashboard-textinput__field.is-focused {
      border-bottom-color: var(--nr-dashboard-groupTextColor, var(--nr-dashboard-widgetBackgroundColor, #1f8af2));
    }

    .nr-dashboard-textinput__field.is-disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .nr-dashboard-textinput__input {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--nr-dashboard-widgetTextColor, #000);
      outline: none;
      padding: 0 0 0 8px;
      font-size: 14px;
      min-width: 0;
    }

    .nr-dashboard-textinput__input:focus {
      outline: none;
    }

    .nr-dashboard-textinput__input[type="color"] {
      border: none;
      padding-left: 25%;
    }
  `;
  doc.head.appendChild(style);
}

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
  const labelHtml = { __html: label as string };
  const [error, setError] = useState<string>("");
  const [focused, setFocused] = useState<boolean>(false);
  const maxLength = (control as { maxlength?: number }).maxlength;
  const delay = Number.isFinite(asInput.delay) ? Number(asInput.delay) : 0;
  const sendOnEnter = delay <= 0 || (control as { type?: string }).type === "text-input-CR";
  const timer = useRef<number | undefined>(undefined);
  const type = useMemo(() => inputType(asInput.mode), [asInput.mode]);
  const pattern = asInput.pattern ? new RegExp(asInput.pattern) : null;
  const isColorMode = asInput.mode === "color";
  const hasLabel = Boolean(asInput.label);

  ensureTextInputStyles();

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

  const colorSwatch = isColorMode
    ? html`<span
        aria-hidden="true"
        style=${{
          width: "18px",
          height: "18px",
          borderRadius: "4px",
          border: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.35))",
          background: value || "#cccccc",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
        }}
      ></span>`
    : null;

  return html`<div class=${`nr-dashboard-textinput ${asInput.className || ""}`.trim()}>
    <div
      class=${`nr-dashboard-textinput__container ${hasLabel ? "has-label" : ""} ${focused ? "nr-dashboard-textinput__container--focused" : ""} ${value ? "nr-dashboard-textinput__container--has-value" : ""}`.trim()}
      title=${asInput.tooltip || undefined}
    >
      ${hasLabel ? html`<label class="nr-dashboard-textinput__label" dangerouslySetInnerHTML=${labelHtml}></label>` : null}
      ${asInput.required ? html`<span style=${fieldHelperStyles}>${t("required_label", "Required")}</span>` : null}
      <div
        class=${`nr-dashboard-textinput__field ${focused ? "is-focused" : ""} ${disabled ? "is-disabled" : ""}`.trim()}
      >
        ${colorSwatch}
        <input
          class=${`nr-dashboard-textinput__input ${asInput.className || ""}`.trim()}
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
          onBlur=${() => {
            handleBlur();
            setFocused(false);
          }}
          onFocus=${() => setFocused(true)}
          style=${{
            paddingLeft: isColorMode ? "25%" : undefined,
          }}
        />
      </div>
    </div>
    ${typeof maxLength === "number"
      ? html`<span style=${{ ...fieldHelperStyles, alignSelf: "flex-end", padding: "0 12px" }}>
          ${t("char_counter", "{used}/{max}", { used: value.length, max: maxLength })}
        </span>`
      : null}
    ${error
      ? html`<span
          id=${`err-${index}`}
          role="alert"
          style=${{ color: "var(--nr-dashboard-errorColor, #f87171)", fontSize: "12px", padding: "0 12px" }}
        >${error}</span>`
      : null}
  </div>`;
}
