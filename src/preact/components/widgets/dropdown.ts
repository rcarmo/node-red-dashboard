import { html } from "htm/preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";

export type DropdownOption = { label: string; value: unknown; type?: string; disabled?: boolean };
export type DropdownControl = UiControl & {
  label?: string;
  name?: string;
  options?: DropdownOption[];
  multiple?: boolean;
  place?: string;
  tooltip?: string;
  className?: string;
  topic?: string;
  value?: unknown;
};

function parseOptionValue(val: string, type?: string): unknown {
  if (!type || type.startsWith("str")) return val;
  if (type === "number" || type === "num") {
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  }
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

export function buildDropdownEmit(ctrl: DropdownControl, fallbackLabel: string, value: unknown): Record<string, unknown> {
  return {
    payload: value,
    topic: ctrl.topic ?? fallbackLabel,
    type: "dropdown",
  };
}

export function DropdownWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const asDrop = control as DropdownControl;
  const label = asDrop.label || asDrop.name || `Select ${index + 1}`;
  const opts = useMemo(() => asDrop.options ?? [], [asDrop.options]);
  const multiple = Boolean(asDrop.multiple);
  const [value, setValue] = useState<unknown>(asDrop.value ?? (multiple ? [] : null));

  useEffect(() => {
    setValue(asDrop.value ?? (multiple ? [] : null));
  }, [asDrop.value, multiple, opts]);

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    if (multiple) {
      const selected: unknown[] = [];
      Array.from(target.selectedOptions).forEach((opt) => {
        selected.push(parseOptionValue(opt.value, opt.dataset.type));
      });
      setValue(selected);
      if (onEmit) onEmit("ui-control", buildDropdownEmit(asDrop, label, selected));
    } else {
      const opt = target.selectedOptions[0];
      if (!opt) return;
      const parsed = parseOptionValue(opt.value, opt.dataset.type);
      setValue(parsed);
      if (onEmit) onEmit("ui-control", buildDropdownEmit(asDrop, label, parsed));
    }
  };

  return html`<label style=${{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
    <span style=${{ fontSize: "13px", opacity: 0.8 }}>${label}</span>
    <select
      multiple=${multiple}
      class=${asDrop.className || ""}
      title=${asDrop.tooltip || undefined}
      disabled=${Boolean(disabled)}
      onChange=${handleChange}
      style=${{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.05)",
        color: "inherit",
      }}
    >
      ${asDrop.place && !multiple
        ? html`<option value="" disabled selected=${value == null || value === ""}>${asDrop.place}</option>`
        : null}
      ${opts.map((opt) => {
        const serialized = typeof opt.value === "string" ? opt.value : JSON.stringify(opt.value);
        const selected = multiple
          ? Array.isArray(value) && (value as unknown[]).some((v) => JSON.stringify(v) === JSON.stringify(opt.value))
          : JSON.stringify(value) === JSON.stringify(opt.value);
        return html`<option
          value=${serialized}
          data-type=${opt.type || (typeof opt.value === "number" ? "number" : "string")}
          disabled=${opt.disabled || false}
          selected=${selected}
        >
          ${opt.label ?? opt.value}
        </option>`;
      })}
    </select>
  </label>`;
}
