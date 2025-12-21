import { html } from "htm/preact";
import type { VNode } from "preact";
import { useMemo, useState } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

export type FormField = {
  name: string;
  label?: string;
  type?: string;
  value?: unknown;
  required?: boolean;
  placeholder?: string;
  pattern?: string;
  error?: string;
  rows?: number;
  maxlength?: number;
  options?: Array<{ label?: string; value: string }>; // for select/radio
};

export type FormControl = UiControl & {
  name?: string;
  label?: string;
  fields?: FormField[];
  submit?: string;
  className?: string;
  topic?: string;
};

export function buildFormEmit(ctrl: FormControl, fallbackLabel: string, values: Record<string, string>): Record<string, unknown> {
  return {
    payload: values,
    topic: ctrl.topic ?? fallbackLabel,
    type: "form",
  };
}

export function FormWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const c = control as FormControl;
  const { t } = useI18n();
  const title = c.label || c.name || t("form_label", "Form {index}", { index: index + 1 });
  const fields = useMemo(() => c.fields || [], [c.fields]);
  const isDisabled = Boolean(disabled);
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {};
    fields.forEach((f) => {
      if (f.type === "checkbox" || f.type === "switch") {
        initial[f.name] = Boolean(f.value);
      } else {
        initial[f.name] = f.value == null ? "" : String(f.value);
      }
    });
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (name: string, v: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: v }));
  };

  return html`<form
    class=${c.className || ""}
    style=${{ display: "grid", gap: "10px" }}
    onSubmit=${(e: Event) => {
      e.preventDefault();
      if (isDisabled) return;
      const nextErrors: Record<string, string> = {};
      fields.forEach((f) => {
        const rawVal = values[f.name];
        const val = typeof rawVal === "string" ? rawVal.trim() : rawVal;
        if (f.required && (val === "" || val === undefined || val === null)) {
          nextErrors[f.name] = f.error || t("error_required", "This field is required.");
        } else if (typeof val === "string" && f.pattern) {
          const re = new RegExp(f.pattern);
          if (!re.test(val)) nextErrors[f.name] = f.error || t("error_pattern", "Value does not match the required format.");
        }
      });
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      onEmit?.("ui-control", buildFormEmit(c, title, values));
    }}
  >
    <div style=${{ fontWeight: 600 }}>${title}</div>
    ${fields.length === 0
      ? html`<div style=${{ fontSize: "12px", opacity: 0.7 }}>${t("form_no_fields", "No fields configured.")}</div>`
      : fields.map((f) => {
          const type = f.type === "number" ? "number" : f.type === "password" ? "password" : f.type === "email" ? "email" : f.type === "date" ? "date" : f.type === "time" ? "time" : f.type === "checkbox" || f.type === "switch" ? "checkbox" : f.type === "multiline" ? "multiline" : "text";
          return html`<label style=${{ display: "grid", gap: "4px" }} key=${f.name}>
            <span style=${{ fontSize: "12px", opacity: 0.8 }}>${f.label || f.name}</span>
            ${type === "multiline"
              ? html`<textarea
                  name=${f.name}
                  required=${Boolean(f.required)}
                  rows=${f.rows || 3}
                  placeholder=${f.placeholder || ""}
                  aria-invalid=${errors[f.name] ? "true" : "false"}
                  aria-errormessage=${errors[f.name] ? `err-${f.name}` : undefined}
                  disabled=${isDisabled}
                  onInput=${(ev: Event) => setField(f.name, (ev.target as HTMLTextAreaElement).value)}
                  style=${{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: errors[f.name]
                      ? "1px solid var(--nr-dashboard-errorColor, #f87171)"
                      : "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.16))",
                    background: "var(--nr-dashboard-widgetBackgroundColor, #0f1115)",
                    color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
                  }}
                >${values[f.name] ?? ""}</textarea>`
              : type === "checkbox"
              ? html`<input
                  name=${f.name}
                  type="checkbox"
                  checked=${Boolean(values[f.name])}
                  disabled=${isDisabled}
                  aria-invalid=${errors[f.name] ? "true" : "false"}
                  aria-errormessage=${errors[f.name] ? `err-${f.name}` : undefined}
                  onChange=${(ev: Event) => setField(f.name, (ev.target as HTMLInputElement).checked)}
                  style=${{
                    width: "16px",
                    height: "16px",
                  }}
                />`
              : f.type === "select"
              ? html`<select
                  name=${f.name}
                  required=${Boolean(f.required)}
                  value=${typeof values[f.name] === "string" ? values[f.name] : ""}
                  disabled=${isDisabled}
                  aria-invalid=${errors[f.name] ? "true" : "false"}
                  aria-errormessage=${errors[f.name] ? `err-${f.name}` : undefined}
                  onChange=${(ev: Event) => setField(f.name, (ev.target as HTMLSelectElement).value)}
                  style=${{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: errors[f.name]
                      ? "1px solid var(--nr-dashboard-errorColor, #f87171)"
                      : "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.16))",
                    background: "var(--nr-dashboard-widgetBackgroundColor, #0f1115)",
                    color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
                  }}
                >
                  ${(f.options || []).map((opt) => html`<option value=${opt.value}>${opt.label ?? opt.value}</option>`)}
                </select>`
              : f.type === "radio"
              ? html`<div style=${{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  ${(f.options || []).map((opt) =>
                    html`<label style=${{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                      <input
                        type="radio"
                        name=${f.name}
                        value=${opt.value}
                        required=${Boolean(f.required)}
                        aria-invalid=${errors[f.name] ? "true" : "false"}
                        aria-errormessage=${errors[f.name] ? `err-${f.name}` : undefined}
                        checked=${values[f.name] === opt.value}
                        disabled=${isDisabled}
                        onChange=${(ev: Event) => setField(f.name, (ev.target as HTMLInputElement).value)}
                      />
                      <span>${opt.label ?? opt.value}</span>
                    </label>`,
                  )}
                </div>`
              : html`<input
                  name=${f.name}
                  type=${type}
                  value=${values[f.name] ?? ""}
                  required=${Boolean(f.required)}
                  placeholder=${f.placeholder || ""}
                  aria-invalid=${errors[f.name] ? "true" : "false"}
                  aria-errormessage=${errors[f.name] ? `err-${f.name}` : undefined}
                  inputMode=${type === "number" ? "decimal" : type === "email" ? "email" : undefined}
                  maxLength=${f.maxlength || undefined}
                  onInput=${(ev: Event) => setField(f.name, (ev.target as HTMLInputElement).value)}
                  disabled=${isDisabled}
                  style=${{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: errors[f.name]
                      ? "1px solid var(--nr-dashboard-errorColor, #f87171)"
                      : "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.16))",
                    background: "var(--nr-dashboard-widgetBackgroundColor, #0f1115)",
                    color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
                  }}
                />`}
            ${typeof f.maxlength === "number" && type !== "checkbox" && type !== "multiline" && f.type !== "select" && f.type !== "radio"
              ? html`<span style=${{ fontSize: "11px", opacity: 0.65, alignSelf: "flex-end" }}>
                  ${t("char_counter", "{used}/{max}", {
                    used: typeof values[f.name] === "string" ? (values[f.name] as string).length : 0,
                    max: f.maxlength ?? 0,
                  })}
                </span>`
              : null}
            ${errors[f.name]
              ? html`<span
                  id=${`err-${f.name}`}
                  role="alert"
                  style=${{ color: "var(--nr-dashboard-errorColor, #f87171)", fontSize: "12px" }}
                >${errors[f.name]}</span>`
              : null}
          </label>`;
        })}
    <button
      type="submit"
      disabled=${isDisabled}
      style=${{
        padding: "10px 12px",
        borderRadius: "6px",
        border: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.16))",
        background: "var(--nr-dashboard-widgetColor, #2563eb)",
        color: "var(--nr-dashboard-widgetTextColor, #fff)",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      ${c.submit || t("submit_label", "Submit")}
    </button>
  </form>`;
}
