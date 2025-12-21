import { html } from "htm/preact";
import { useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

export type NumericControl = UiControl & {
  label?: string;
  name?: string;
  format?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  wrap?: boolean;
  topic?: string;
  tooltip?: string;
  className?: string;
};

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clampValue(value: number, min: number, max: number, wrap: boolean): number {
  if (wrap) {
    if (value > max) return min;
    if (value < min) return max;
    return value;
  }
  return Math.min(max, Math.max(min, value));
}

export function buildNumericEmit(ctrl: NumericControl, fallbackLabel: string, value: number): Record<string, unknown> {
  return {
    payload: value,
    topic: ctrl.topic ?? fallbackLabel,
    type: "numeric",
  };
}

export function NumericWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const asNum = control as NumericControl;
  const { t } = useI18n();
  const label = asNum.label || asNum.name || t("number_label", "Number {index}", { index: index + 1 });
  const min = toNumber(asNum.min, Number.MIN_SAFE_INTEGER);
  const max = toNumber(asNum.max, Number.MAX_SAFE_INTEGER);
  const step = toNumber(asNum.step, 1) || 1;
  const [value, setValue] = useState<number>(clampValue(toNumber(asNum.min, 0), min, max, !!asNum.wrap));

  const update = (next: number) => {
    const clamped = clampValue(next, min, max, !!asNum.wrap);
    setValue(clamped);
    if (onEmit) {
      const payload = buildNumericEmit(asNum, label, clamped);
      onEmit("ui-control", payload);
    }
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const next = toNumber(target.value, value);
    update(next);
  };

  const format = asNum.format || "";
  const [prePart, rest] = format.split("{{");
  const [, postPart = ""] = (rest || "").split("}}");
  const pre = prePart || "";
  const post = postPart || "";

  return html`<label style=${{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
    <span style=${{ fontSize: "13px", opacity: 0.8 }}>${label}</span>
    <div style=${{ display: "flex", alignItems: "center", gap: "8px" }}>
      ${pre ? html`<span style=${{ opacity: 0.7 }}>${pre}</span>` : null}
      <input
        class=${asNum.className || ""}
        type="number"
        min=${min}
        max=${max}
        step=${step}
        value=${value}
        title=${asNum.tooltip || undefined}
        disabled=${Boolean(disabled)}
        onInput=${handleChange}
        style=${{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.05)",
          color: "inherit",
        }}
      />
      ${post ? html`<span style=${{ opacity: 0.7 }}>${post}</span>` : null}
    </div>
  </label>`;
}
