import { html } from "htm/preact";
import type { VNode } from "preact";
import { useMemo, useState, useEffect } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

const FORM_STYLE_ID = "nr-dashboard-form-style";

function ensureFormStyles(doc: Document | undefined = typeof document !== "undefined" ? document : undefined): void {
  if (!doc) return;
  if (doc.getElementById(FORM_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = FORM_STYLE_ID;
  style.textContent = `
    .nr-dashboard-form {
      display: inline-block;
      width: 100%;
      overflow-y: auto;
      color: var(--nr-dashboard-widgetTextColor, inherit);
      box-sizing: border-box;
    }

    .nr-dashboard-form form {
      padding: 0 6px;
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      box-sizing: border-box;
      width: 100%;
    }

    .nr-dashboard-form .formlabel {
      font-size: 16px;
      font-weight: 500;
      margin-top: 12px;
      margin-bottom: 6px;
      padding: 0 6px;
      width: 100%;
      color: var(--nr-dashboard-widgetTextColor, inherit);
      line-height: 1.35;
    }

    .nr-dashboard-form .formElement {
      width: calc(100% - 12px);
      margin-left: 6px;
      margin-right: 6px;
      margin-bottom: 2px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      gap: 6px;
    }

    .nr-dashboard-form .formElementSplit {
      width: calc(50% - 12px);
    }

    .nr-dashboard-form .nr-dashboard-form__field-label {
      font-size: 13px;
      line-height: 1.4;
      color: var(--nr-dashboard-widgetTextColor, inherit);
      opacity: 0.9;
      padding: 2px 0;
    }

    .nr-dashboard-form .nr-dashboard-form__input,
    .nr-dashboard-form .nr-dashboard-form__select {
      width: 100%;
      padding: 8px 0;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--nr-dashboard-widgetTextColor, rgba(0,0,0,0.6));
      color: var(--nr-dashboard-widgetTextColor, #e9ecf1);
      font-family: inherit;
      font-size: 14px;
      line-height: 1.35;
      box-sizing: border-box;
    }

    .nr-dashboard-form .nr-dashboard-form__textarea {
      width: 100%;
      padding: 10px 8px 6px 0;
      background: transparent;
      border: 1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.16));
      color: var(--nr-dashboard-widgetTextColor, #e9ecf1);
      font-family: inherit;
      font-size: 14px;
      line-height: 1.35;
      border-radius: 4px;
      box-sizing: border-box;
      min-height: 72px;
    }

    .nr-dashboard-form .nr-dashboard-form__input:focus,
    .nr-dashboard-form .nr-dashboard-form__select:focus,
    .nr-dashboard-form .nr-dashboard-form__textarea:focus {
      outline: none;
      border-color: var(--nr-dashboard-groupTextColor, var(--nr-dashboard-widgetBackgroundColor, #1f8af2));
      border-bottom-color: var(--nr-dashboard-groupTextColor, var(--nr-dashboard-widgetBackgroundColor, #1f8af2));
    }

    .nr-dashboard-form .nr-dashboard-form__checkbox-row,
    .nr-dashboard-form .nr-dashboard-form__radio-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      line-height: 1.3;
      color: var(--nr-dashboard-widgetTextColor, inherit);
    }

    .nr-dashboard-form .nr-dashboard-form__checkbox,
    .nr-dashboard-form .nr-dashboard-form__radio {
      accent-color: var(--nr-dashboard-widgetBackgroundColor, #1f8af2);
      width: 16px;
      height: 16px;
    }

    .nr-dashboard-form .nr-dashboard-form__error {
      color: var(--nr-dashboard-errorColor, #d00);
      font-size: 12px;
      line-height: 1.3;
    }

    .nr-dashboard-form .nr-dashboard-form__helper {
      font-size: 11px;
      opacity: 0.65;
      line-height: 1.3;
    }

    .nr-dashboard-form .form-control {
      width: 100%;
      display: flex;
      justify-content: flex-start;
      margin-top: -20px;
      padding: 0 6px;
      box-sizing: border-box;
      gap: 12px;
    }

    .nr-dashboard-form .form-control-no-label {
      margin-top: -10px;
    }

    .nr-dashboard-form .form-control-single {
      justify-content: space-around;
    }

    .nr-dashboard-form .nr-dashboard-form-button {
      width: 50%;
      margin: 0;
      min-height: 28px;
      padding: 8px 10px;
      border: 1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.16));
      background-color: var(--nr-dashboard-widgetBackgroundColor, #2563eb);
      color: #fff;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      box-sizing: border-box;
    }

    .nr-dashboard-form .nr-dashboard-form-button:disabled,
    .nr-dashboard-form form:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nr-dashboard-form .nr-dashboard-form-button:hover,
    .nr-dashboard-form .nr-dashboard-form-button:focus {
      background-color: var(--nr-dashboard-widgetHoverColor, var(--nr-dashboard-widgetBackgroundColor, #2563eb));
    }
  `;
  doc.head.appendChild(style);
}
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

type LegacyFormOption = FormField & { value?: string };

export type FormControl = UiControl & {
  name?: string;
  label?: string;
  fields?: FormField[];
  options?: LegacyFormOption[];
  formValue?: Record<string, unknown>;
  submit?: string;
  cancel?: string;
  splitLayout?: boolean;
  className?: string;
  topic?: string;
  sy?: number;
  cy?: number;
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
  const title = c.label ?? c.name ?? t("form_label", "Form {index}", { index: index + 1 });
  const usesExplicitFields = Boolean(c.fields && c.fields.length > 0);

  const rawFields = useMemo<LegacyFormOption[]>(() => {
    const provided = usesExplicitFields ? c.fields : (c.options as LegacyFormOption[] | undefined);
    return (provided || []).map((f) => ({ ...f }));
  }, [c.fields, c.options, usesExplicitFields]);

  const fields = useMemo<FormField[]>(() => {
    if (!rawFields.length) return [];
    return rawFields.map((f, idx) => ({ ...f, name: f.name || f.value || `field-${idx + 1}` }));
  }, [rawFields]);

  const isDisabled = Boolean(disabled);
  const initialValues = useMemo<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {};
    const defaults = (c as { formValue?: Record<string, unknown> }).formValue || {};
    fields.forEach((f) => {
      const rawDefault = defaults[f.name];
      const raw = rawDefault !== undefined ? rawDefault : usesExplicitFields ? f.value : undefined;
      const normalizedType = (f.type || "").toLowerCase();
      if (normalizedType === "checkbox" || normalizedType === "switch") {
        initial[f.name] = Boolean(raw);
      } else {
        initial[f.name] = raw == null ? "" : String(raw);
      }
    });
    return initial;
  }, [c, fields, usesExplicitFields]);

  const [values, setValues] = useState<Record<string, string | boolean>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  ensureFormStyles();

  const setField = (name: string, v: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: v }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const submitLabel = c.submit || t("submit_label", "Submit");
  const cancelLabel = (c as { cancel?: string }).cancel || "";
  const hasSubmit = Boolean(submitLabel);
  const hasCancel = Boolean(cancelLabel);
  const singleAction = Number(hasSubmit) + Number(hasCancel) === 1;
  const splitLayout = Boolean(c.splitLayout);

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
  };

  return html`<form
    class=${`nr-dashboard-form ${c.className || ""}`.trim()}
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
    ${title ? html`<p class="formlabel" dangerouslySetInnerHTML=${{ __html: title as string }}></p>` : null}
    ${fields.length === 0
      ? html`<div class="nr-dashboard-form__helper" style=${{ padding: "0 6px" }}>${t("form_no_fields", "No fields configured.")}</div>`
      : fields.map((f, idx) => {
          const rawType = (f.type || "text").toLowerCase();
          const type = rawType === "number"
            ? "number"
            : rawType === "password"
            ? "password"
            : rawType === "email"
            ? "email"
            : rawType === "date"
            ? "date"
            : rawType === "time"
            ? "time"
            : rawType === "checkbox" || rawType === "switch"
            ? "checkbox"
            : rawType === "multiline"
            ? "multiline"
            : rawType === "select"
            ? "select"
            : rawType === "radio"
            ? "radio"
            : "text";
          const fieldId = `form-${index}-${idx}-${f.name}`;
          const fieldValue = values[f.name];

          return html`<div class=${`formElement ${splitLayout ? "formElementSplit" : ""}`.trim()} key=${fieldId}>
            ${type !== "checkbox"
              ? html`<label class="nr-dashboard-form__field-label" htmlFor=${type === "radio" ? undefined : fieldId}>${f.label || f.name}</label>`
              : html`<span class="nr-dashboard-form__field-label">${f.label || f.name}</span>`}

            ${type === "multiline"
              ? html`<textarea
                  id=${fieldId}
                  class="nr-dashboard-form__textarea"
                  name=${f.name}
                  required=${Boolean(f.required)}
                  rows=${f.rows || 3}
                  placeholder=${f.placeholder || ""}
                  aria-invalid=${errors[f.name] ? "true" : "false"}
                  aria-errormessage=${errors[f.name] ? `err-${f.name}` : undefined}
                  disabled=${isDisabled}
                  maxLength=${f.maxlength || undefined}
                  value=${typeof fieldValue === "string" ? fieldValue : ""}
                  onInput=${(ev: Event) => setField(f.name, (ev.target as HTMLTextAreaElement).value)}
                ></textarea>`
              : type === "checkbox"
              ? html`<label class="nr-dashboard-form__checkbox-row" htmlFor=${fieldId}>
                  <input
                    id=${fieldId}
                    class="nr-dashboard-form__checkbox"
                    name=${f.name}
                    type="checkbox"
                    checked=${Boolean(fieldValue)}
                    disabled=${isDisabled}
                    aria-invalid=${errors[f.name] ? "true" : "false"}
                    aria-errormessage=${errors[f.name] ? `err-${f.name}` : undefined}
                    onChange=${(ev: Event) => setField(f.name, (ev.target as HTMLInputElement).checked)}
                  />
                  <span>${f.label || f.name}</span>
                </label>`
              : type === "select"
              ? html`<select
                  id=${fieldId}
                  class="nr-dashboard-form__select"
                  name=${f.name}
                  required=${Boolean(f.required)}
                  value=${typeof fieldValue === "string" ? fieldValue : ""}
                  disabled=${isDisabled}
                  aria-invalid=${errors[f.name] ? "true" : "false"}
                  aria-errormessage=${errors[f.name] ? `err-${f.name}` : undefined}
                  onChange=${(ev: Event) => setField(f.name, (ev.target as HTMLSelectElement).value)}
                >
                  ${(f.options || []).map((opt) => html`<option value=${opt.value}>${opt.label ?? opt.value}</option>`) }
                </select>`
              : type === "radio"
              ? html`<div class="nr-dashboard-form__radio-group" role="radiogroup" aria-labelledby=${fieldId}>
                  <span id=${fieldId} class="nr-dashboard-form__field-label" style=${{ paddingBottom: "2px" }}>${f.label || f.name}</span>
                  <div style=${{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    ${(f.options || []).map((opt, optIdx) => {
                      const optId = `${fieldId}-${optIdx}`;
                      return html`<label class="nr-dashboard-form__radio-row" htmlFor=${optId} key=${optId}>
                        <input
                          id=${optId}
                          class="nr-dashboard-form__radio"
                          type="radio"
                          name=${f.name}
                          value=${opt.value}
                          required=${Boolean(f.required)}
                          aria-invalid=${errors[f.name] ? "true" : "false"}
                          aria-errormessage=${errors[f.name] ? `err-${f.name}` : undefined}
                          checked=${fieldValue === opt.value}
                          disabled=${isDisabled}
                          onChange=${(ev: Event) => setField(f.name, (ev.target as HTMLInputElement).value)}
                        />
                        <span>${opt.label ?? opt.value}</span>
                      </label>`;
                    })}
                  </div>
                </div>`
              : html`<input
                  id=${fieldId}
                  class="nr-dashboard-form__input"
                  name=${f.name}
                  type=${type}
                  value=${typeof fieldValue === "string" ? fieldValue : ""}
                  required=${Boolean(f.required)}
                  placeholder=${f.placeholder || ""}
                  aria-invalid=${errors[f.name] ? "true" : "false"}
                  aria-errormessage=${errors[f.name] ? `err-${f.name}` : undefined}
                  inputMode=${type === "number" ? "decimal" : type === "email" ? "email" : undefined}
                  maxLength=${f.maxlength || undefined}
                  onInput=${(ev: Event) => setField(f.name, (ev.target as HTMLInputElement).value)}
                  disabled=${isDisabled}
                />`}

            ${typeof f.maxlength === "number" && type !== "checkbox" && type !== "multiline" && type !== "select" && type !== "radio"
              ? html`<span class="nr-dashboard-form__helper" style=${{ alignSelf: "flex-end" }}>
                  ${t("char_counter", "{used}/{max}", {
                    used: typeof fieldValue === "string" ? (fieldValue as string).length : 0,
                    max: f.maxlength ?? 0,
                  })}
                </span>`
              : null}
            ${errors[f.name]
              ? html`<span
                  id=${`err-${f.name}`}
                  role="alert"
                  class="nr-dashboard-form__error"
                >${errors[f.name]}</span>`
              : null}
          </div>`;
        })}

    ${(hasSubmit || hasCancel)
      ? html`<div class=${`form-control ${singleAction ? "form-control-single" : ""} ${title ? "" : "form-control-no-label"}`.trim()}>
          ${hasSubmit
            ? html`<button type="submit" class="nr-dashboard-form-button" disabled=${isDisabled}>${submitLabel}</button>`
            : null}
          ${hasCancel
            ? html`<button type="button" class="nr-dashboard-form-button" disabled=${isDisabled} onClick=${resetForm}>${cancelLabel}</button>`
            : null}
        </div>`
      : null}
  </form>`;
}
