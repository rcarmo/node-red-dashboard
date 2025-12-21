import { html } from "htm/preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

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
  resetSelection?: boolean;
};

function parseOptionValue(val: string, type?: string): unknown {
  if (!type || type.startsWith("str")) return val;
  if (type === "number" || type === "num") {
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  }
  if (type === "json") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function serializeOptionValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

function inferType(opt?: DropdownOption): string | undefined {
  if (!opt) return undefined;
  if (opt.type) return opt.type;
  if (typeof opt.value === "number") return "number";
  if (typeof opt.value === "string") return "string";
  return "json";
}

function parseWithOptions(raw: string, opts: DropdownOption[]): unknown {
  const matched = opts.find((o) => serializeOptionValue(o.value) === raw);
  return parseOptionValue(raw, inferType(matched));
}

function normalizeValue(value: unknown, opts: DropdownOption[], multiple: boolean): unknown {
  if (multiple) {
    if (Array.isArray(value)) {
      return value.map((v) => parseWithOptions(serializeOptionValue(v), opts));
    }
    if (value === null || value === undefined || value === "") return [];
    if (typeof value === "string") {
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => parseWithOptions(v, opts));
    }
    return [value];
  }
  if (value === undefined) return null;
  if (value === "") return null;
  const serialized = serializeOptionValue(value);
  return parseWithOptions(serialized, opts);
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
  const { t } = useI18n();
  const label = asDrop.label || asDrop.name || t("dropdown_label", "Select {index}", { index: index + 1 });
  const opts = useMemo(() => asDrop.options ?? [], [asDrop.options]);
  const multiple = Boolean(asDrop.multiple);
  const [value, setValue] = useState<unknown>(normalizeValue(asDrop.value, opts, multiple));
  const lastReset = useRef<boolean>(false);

  useEffect(() => {
    const normalized = normalizeValue(asDrop.value, opts, multiple);
    if (multiple) {
      const filtered = (normalized as unknown[]).filter((v) =>
        opts.some((o) => serializeOptionValue(o.value) === serializeOptionValue(v)),
      );
      setValue(filtered);
    } else {
      const exists = opts.some((o) => serializeOptionValue(o.value) === serializeOptionValue(normalized));
      setValue(exists ? normalized : null);
    }
  }, [asDrop.value, asDrop.resetSelection, multiple, opts]);

  useEffect(() => {
    if (asDrop.resetSelection && !lastReset.current) {
      setValue(multiple ? [] : null);
      lastReset.current = true;
    }
    if (!asDrop.resetSelection) {
      lastReset.current = false;
    }
  }, [asDrop.resetSelection, multiple]);

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
    <span style=${{ fontSize: "13px", opacity: 0.8, color: "var(--nr-dashboard-widgetTextColor, inherit)" }}>${label}</span>
    <select
      multiple=${multiple}
      class=${asDrop.className || ""}
      title=${asDrop.tooltip || undefined}
      disabled=${Boolean(disabled)}
      value=${!multiple ? serializeOptionValue(value) : undefined}
      onChange=${handleChange}
      style=${{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.18))",
        background: "var(--nr-dashboard-widgetBackgroundColor, rgba(255,255,255,0.05))",
        color: "var(--nr-dashboard-widgetTextColor, inherit)",
      }}
    >
      ${asDrop.place && !multiple
        ? html`<option value="" disabled selected=${value == null || value === ""}>${asDrop.place}</option>`
        : null}
      ${opts.map((opt) => {
        const serialized = typeof opt.value === "string" ? opt.value : JSON.stringify(opt.value);
        const inferredType = opt.type
          ? opt.type
          : typeof opt.value === "number"
          ? "number"
          : typeof opt.value === "string"
          ? "string"
          : "json";
        const selected = multiple
          ? Array.isArray(value) && (value as unknown[]).some((v) => JSON.stringify(v) === JSON.stringify(opt.value))
          : JSON.stringify(value) === JSON.stringify(opt.value);
        return html`<option
          value=${serialized}
          data-type=${inferredType}
          disabled=${opt.disabled || false}
          selected=${selected}
        >
          ${opt.label ?? opt.value}
        </option>`;
      })}
    </select>
  </label>`;
}
