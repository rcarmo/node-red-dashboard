import { html } from "htm/preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";
import { formatNumber } from "../../lib/format";

const NUMERIC_STYLE_ID = "nr-dashboard-numeric-style";

function ensureNumericStyles(doc: Document | undefined = typeof document !== "undefined" ? document : undefined): void {
  if (!doc) return;
  if (doc.getElementById(NUMERIC_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = NUMERIC_STYLE_ID;
  style.textContent = `
    .nr-dashboard-numeric {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0 0 0 12px;
      box-sizing: border-box;
      gap: 12px;
      color: var(--nr-dashboard-widgetTextColor, inherit);
    }

    .nr-dashboard-numeric .label {
      margin: 0 8px 0 0;
      font-size: 14px;
      line-height: 20px;
      font-weight: 500;
      line-height: 1.4;
      color: var(--nr-dashboard-widgetTextColor, inherit);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nr-dashboard-numeric__controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .nr-dashboard-numeric__button {
      margin: 0;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: var(--nr-dashboard-widgetTextColor, inherit);
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }

    .nr-dashboard-numeric__button:hover,
    .nr-dashboard-numeric__button:focus-visible {
      background: rgba(255, 255, 255, 0.08);
      outline: none;
    }

    .nr-dashboard-numeric__button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: transparent;
    }

    .nr-dashboard-numeric__value {
      font-weight: 700;
      text-align: center;
      border: 0;
      min-width: 64px;
      padding: 6px 8px;
      color: var(--nr-dashboard-widgetTextColor, inherit);
    }

    .nr-dashboard-numeric__input {
      text-align: center;
      font-weight: 700;
      border: none;
      border-bottom: 1px solid var(--nr-dashboard-widgetTextColor, rgba(0,0,0,0.6));
      background: transparent;
      min-width: 70px;
      padding: 6px 4px;
      color: var(--nr-dashboard-widgetTextColor, inherit);
      outline: none;
    }

    .nr-dashboard-numeric__input:focus {
      border-bottom-color: var(--nr-dashboard-groupTextColor, var(--nr-dashboard-widgetBackgroundColor, #1f8af2));
    }

    .nr-dashboard-numeric__adorn {
      font-size: 14px;
      opacity: 0.9;
      padding: 0 2px;
    }
  `;
  doc.head.appendChild(style);
}

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

export type NumericControl = UiControl & {
  name?: string;
  label?: string;
  tooltip?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  wrap?: boolean;
  format?: string;
  ed?: boolean;
  className?: string;
};

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
  const label = asNum.label ?? asNum.name ?? t("number_label", "Number {index}", { index: index + 1 });
  const min = toNumber(asNum.min, Number.MIN_SAFE_INTEGER);
  const max = toNumber(asNum.max, Number.MAX_SAFE_INTEGER);
  const step = toNumber(asNum.step, 1) || 1;
  const [value, setValue] = useState<number>(clampValue(toNumber(asNum.value ?? asNum.min ?? 0, 0), min, max, !!asNum.wrap));
  const formatter = useMemo(() => new Intl.NumberFormat(lang || undefined), [lang]);
  const holdTimer = useRef<number | undefined>(undefined);

  ensureNumericStyles();

  useEffect(() => {
    const next = clampValue(toNumber(asNum.value ?? asNum.min ?? 0, 0), min, max, !!asNum.wrap);
    setValue(next);
  }, [asNum.value, asNum.min, min, max, asNum.wrap]);

  useEffect(() => () => {
    if (holdTimer.current !== undefined) {
      clearInterval(holdTimer.current);
    }
  }, []);

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

  const format = asNum.format ?? "{{value}}";
  const [prePart, rest] = format.split("{{");
  const [, postPart = ""] = (rest || "").split("}}");
  const pre = prePart || "";
  const post = postPart || "";

  const isEditable = (asNum as { ed?: boolean }).ed ?? !format.includes("{{value}}");
  const displayText = format && format.includes("{{value}}") ? format.replace("{{value}}", formatter.format(value)) : format || formatter.format(value);
  const labelHtml = { __html: label as string };

  const stepOnce = (delta: number) => {
    if (disabled) return;
    update(value + delta);
  };

  const startHold = (delta: number) => {
    stepOnce(delta);
    if (disabled) return;
    holdTimer.current = window.setInterval(() => stepOnce(delta), 150);
  };

  const stopHold = () => {
    if (holdTimer.current !== undefined) {
      clearInterval(holdTimer.current);
      holdTimer.current = undefined;
    }
  };

  return html`<div class=${`nr-dashboard-numeric ${asNum.className || ""}`.trim()} title=${asNum.tooltip || undefined}>
    <p class="label" dangerouslySetInnerHTML=${labelHtml}></p>
    <div class="nr-dashboard-numeric__controls">
      <button
        type="button"
        class="nr-dashboard-numeric__button nr-dashboard-numeric__button--down"
        aria-label=${t("decrement", "Decrement")}
        disabled=${Boolean(disabled)}
        onMouseDown=${() => startHold(-step)}
        onMouseUp=${stopHold}
        onMouseLeave=${stopHold}
      >
        <span class="material-icons" aria-hidden="true">expand_more</span>
      </button>

      ${isEditable
        ? html`<div style=${{ display: "flex", alignItems: "center", gap: "4px" }}>
            ${pre ? html`<span class="nr-dashboard-numeric__adorn">${pre}</span>` : null}
            <input
              class=${`nr-dashboard-numeric__input ${asNum.className || ""}`.trim()}
              type="number"
              min=${min}
              max=${max}
              step=${step}
              value=${value}
              disabled=${Boolean(disabled)}
              aria-valuetext=${t("number_value_label", "{label}: {value}", { label, value: formatNumber(value, lang) })}
              onInput=${handleChange}
            />
            ${post ? html`<span class="nr-dashboard-numeric__adorn">${post}</span>` : null}
          </div>`
        : html`<div style=${{ display: "flex", alignItems: "center", gap: "4px" }}>
            <p
              class="nr-dashboard-numeric__value"
              aria-valuetext=${t("number_value_label", "{label}: {value}", { label, value: formatNumber(value, lang) })}
            >${displayText}</p>
            <input
              type="number"
              value=${value}
              aria-valuetext=${t("number_value_label", "{label}: {value}", { label, value: formatNumber(value, lang) })}
              readOnly
              tabIndex=${-1}
              style=${{
                position: "absolute",
                opacity: 0,
                width: "1px",
                height: "1px",
                pointerEvents: "none",
                border: "none",
                padding: 0,
                margin: 0,
              }}
            />
          </div>`}

      <button
        type="button"
        class="nr-dashboard-numeric__button nr-dashboard-numeric__button--up"
        aria-label=${t("increment", "Increment")}
        disabled=${Boolean(disabled)}
        onMouseDown=${() => startHold(step)}
        onMouseUp=${stopHold}
        onMouseLeave=${stopHold}
      >
        <span class="material-icons" aria-hidden="true">expand_less</span>
      </button>
    </div>
  </div>`;
}
