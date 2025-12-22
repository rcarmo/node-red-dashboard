import { html } from "htm/preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";
import { formatNumber } from "../../lib/format";
import { adornmentStyles, buildFieldStyles, fieldHelperStyles, fieldLabelStyles, fieldWrapperStyles } from "../styles/fieldStyles";

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
  const { t, lang } = useI18n();
  const label = asNum.label || asNum.name || t("number_label", "Number {index}", { index: index + 1 });
  const min = toNumber(asNum.min, Number.MIN_SAFE_INTEGER);
  const max = toNumber(asNum.max, Number.MAX_SAFE_INTEGER);
  const step = toNumber(asNum.step, 1) || 1;
  const [value, setValue] = useState<number>(clampValue(toNumber(asNum.value ?? asNum.min ?? 0, 0), min, max, !!asNum.wrap));
  const [focused, setFocused] = useState<boolean>(false);
  const formatter = useMemo(() => new Intl.NumberFormat(lang || undefined), [lang]);

  useEffect(() => {
    const next = clampValue(toNumber(asNum.value ?? asNum.min ?? 0, 0), min, max, !!asNum.wrap);
    setValue(next);
  }, [asNum.value, asNum.min, min, max, asNum.wrap]);

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

  const fieldStyles = buildFieldStyles({ focused, disabled: Boolean(disabled), hasAdornment: Boolean(post || pre) });

  return html`<label style=${fieldWrapperStyles}>
    <span style=${fieldLabelStyles}>${label}</span>
    <div style=${{ position: "relative", width: "100%" }}>
      <div
        style=${{
          ...fieldStyles,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingRight: post ? "48px" : fieldStyles.paddingRight,
        }}
      >
        ${pre ? html`<span style=${fieldHelperStyles}>${pre}</span>` : null}
        <input
          class=${asNum.className || ""}
          type="number"
          min=${min}
          max=${max}
          step=${step}
          value=${value}
          title=${asNum.tooltip || undefined}
          disabled=${Boolean(disabled)}
          aria-valuetext=${t("number_value_label", "{label}: {value}", { label, value: formatNumber(value, lang) })}
          onInput=${handleChange}
          onFocus=${() => setFocused(true)}
          onBlur=${() => setFocused(false)}
          style=${{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "var(--nr-dashboard-widgetTextColor, inherit)",
            outline: "none",
            padding: 0,
            fontSize: "14px",
            minWidth: 0,
          }}
        />
        ${post ? html`<span style=${{ ...adornmentStyles, position: "static", transform: "none" }}>${post}</span>` : null}
      </div>
    </div>
    <span style=${{ ...fieldHelperStyles, alignSelf: "flex-end" }}>${t("number_value_label", "{label}: {value}", { label, value: formatter.format(value) })}</span>
  </label>`;
}
