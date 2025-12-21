import { html } from "htm/preact";
import type { VNode } from "preact";
import { useMemo, useState } from "preact/hooks";
import type { UiControl } from "../../state";

export type FormField = {
  name: string;
  label?: string;
  type?: string;
  value?: unknown;
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
  const title = c.label || c.name || `Form ${index + 1}`;
  const fields = useMemo(() => c.fields || [], [c.fields]);
  const isDisabled = Boolean(disabled);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach((f) => {
      initial[f.name] = f.value == null ? "" : String(f.value);
    });
    return initial;
  });

  const setField = (name: string, v: string) => {
    setValues((prev) => ({ ...prev, [name]: v }));
  };

  return html`<form
    class=${c.className || ""}
    style=${{ display: "grid", gap: "10px" }}
    onSubmit=${(e: Event) => {
      e.preventDefault();
      if (isDisabled) return;
      onEmit?.("ui-control", buildFormEmit(c, title, values));
    }}
  >
    <div style=${{ fontWeight: 600 }}>${title}</div>
    ${fields.length === 0
      ? html`<div style=${{ fontSize: "12px", opacity: 0.7 }}>No fields configured.</div>`
      : fields.map((f) => {
          const type = f.type === "number" ? "number" : f.type === "password" ? "password" : "text";
          return html`<label style=${{ display: "grid", gap: "4px" }} key=${f.name}>
            <span style=${{ fontSize: "12px", opacity: 0.8 }}>${f.label || f.name}</span>
            <input
              name=${f.name}
              type=${type}
              value=${values[f.name] ?? ""}
              onInput=${(ev: Event) => setField(f.name, (ev.target as HTMLInputElement).value)}
              disabled=${isDisabled}
              style=${{
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.16))",
                background: "var(--nr-dashboard-widgetBackgroundColor, #0f1115)",
                color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
              }}
            />
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
        color: "#fff",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      ${c.submit || "Submit"}
    </button>
  </form>`;
}
