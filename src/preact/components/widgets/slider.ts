import { html } from "htm/preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";
import { formatNumber } from "../../lib/format";

export type SliderControl = UiControl & {
  label?: string;
  name?: string;
  value?: number | string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  invert?: boolean;
  outs?: "all" | "end" | string;
  tooltip?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  showSign?: boolean;
};

const DEFAULT_THROTTLE_MS = 10;
const SLIDER_STYLE_ID = "nr-dashboard-slider-style";

function ensureSliderStyles(doc: Document | undefined = typeof document !== "undefined" ? document : undefined): void {
  if (!doc) return;
  if (doc.getElementById(SLIDER_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = SLIDER_STYLE_ID;
  style.textContent = `
    :root {
      --nr-dashboard-slider-track: rgba(111, 111, 111, 0.5);
      --nr-dashboard-slider-fill: var(--nr-dashboard-widgetBackgroundColor, #1f8af2);
      --nr-dashboard-slider-thumb: var(--nr-dashboard-widgetBackgroundColor, #1f8af2);
      --nr-dashboard-slider-focus: var(--nr-dashboard-widgetBackgroundColor, #1f8af2);
      --nr-dashboard-slider-text: var(--nr-dashboard-widgetTextColor, #fff);
    }

    .nr-dashboard-slider {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0;
      width: 100%;
      padding: 0 12px;
    }

    .nr-dashboard-slider.is-vertical {
      flex-direction: column;
      padding: 0;
      font-size: 12px;
      align-items: center;
    }

    .nr-dashboard-slider__row {
      display: flex;
      align-items: center;
      gap: 0;
      width: 100%;
    }

    .nr-dashboard-slider__label {
      font-size: 13px;
      opacity: 0.8;
      white-space: nowrap;
      margin-right: 15px;
    }

    .nr-dashboard-slider__label.is-vertical {
      margin-top: 6px;
      padding-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
    }

    .nr-dashboard-slider__range {
      width: 100%;
      accent-color: var(--nr-dashboard-slider-fill);
      background: transparent;
      touch-action: none;
      height: 2px;
    }

    .nr-dashboard-slider__range.is-vertical {
      width: 32px;
      height: 180px;
      writing-mode: bt-lr;
      -webkit-appearance: slider-vertical;
    }

    .nr-dashboard-slider__range::-webkit-slider-runnable-track {
      height: 2px;
      border-radius: 999px;
      background: var(--nr-dashboard-slider-track);
    }

    .nr-dashboard-slider__range::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 12px;
      width: 12px;
      margin-top: -5px;
      border-radius: 50%;
      background: var(--nr-dashboard-slider-thumb);
      border: 1px solid transparent;
    }

    .nr-dashboard-slider__range:focus-visible {
      outline: none;
      box-shadow: 0 0 0 6px color-mix(in srgb, var(--nr-dashboard-slider-focus) 40%, transparent);
    }

    .nr-dashboard-slider__track {
      position: relative;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1;
    }

    .nr-dashboard-slider__track.is-vertical {
      flex-direction: column;
      height: 200px;
      width: 36px;
    }

    .nr-dashboard-slider__range::-moz-range-track {
      height: 4px;
      border-radius: 999px;
      background: var(--nr-dashboard-slider-track);
    }

    .nr-dashboard-slider__range::-moz-range-progress {
      height: 4px;
      border-radius: 999px;
      background: var(--nr-dashboard-slider-fill);
    }

    .nr-dashboard-slider__range::-moz-range-thumb {
      height: 12px;
      width: 12px;
      border-radius: 50%;
      background: var(--nr-dashboard-slider-thumb);
      border: 1px solid transparent;
    }

    .nr-dashboard-slider__sign {
      position: absolute;
      padding: 4px 8px;
      border-radius: 12px;
      background: var(--nr-dashboard-slider-fill);
      color: var(--nr-dashboard-slider-text);
      font-size: 11px;
      pointer-events: none;
      white-space: nowrap;
      transform: translate(-50%, -140%);
    }

    .nr-dashboard-slider__sign.is-vertical {
      left: 50%;
      transform: translate(-50%, -120%);
    }
  `;
  doc.head.appendChild(style);
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeSliderRange(minValue: unknown, maxValue: unknown, invert?: boolean): { min: number; max: number; invert: boolean } {
  const rawMin = toNumber(minValue, 0);
  const rawMax = toNumber(maxValue, 10);
  const min = Math.min(rawMin, rawMax);
  const max = Math.max(rawMin, rawMax);
  const shouldInvert = Boolean(invert) || rawMin > rawMax;
  return { min, max, invert: shouldInvert };
}

export function clampSliderValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildSliderEmit(ctrl: SliderControl, fallbackLabel: string, value: number): Record<string, unknown> {
  return {
    payload: value,
    topic: (ctrl as { topic?: string }).topic ?? fallbackLabel,
    type: "slider",
  };
}

export function SliderWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const asSlider = control as SliderControl;
  const { t, lang } = useI18n();
  const label = asSlider.label || asSlider.name || t("slider_label", "Slider {index}", { index: index + 1 });
  const isDisabled = Boolean(disabled);

  ensureSliderStyles();

  const { min, max, invert } = normalizeSliderRange(asSlider.min, asSlider.max, asSlider.invert);
  const step = Math.abs(toNumber(asSlider.step, 1)) || 1;
  const outs = asSlider.outs === "end" ? "end" : "all";
  const isVertical = toNumber(asSlider.width ?? 0, 0) < toNumber(asSlider.height ?? 0, 0);
  const isDiscrete = outs === "end";
  const formatter = new Intl.NumberFormat(lang || undefined);

  const initial = clampSliderValue(toNumber(asSlider.value ?? min, min), min, max);
  const [value, setValue] = useState<number>(initial);
  const [dragging, setDragging] = useState<boolean>(false);

  useEffect(() => {
    setValue(clampSliderValue(toNumber(asSlider.value ?? min, min), min, max));
  }, [asSlider.value, min, max]);

  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
    }
  }, []);

  const toDisplayValue = (logical: number): number => (invert ? max - (logical - min) : logical);
  const fromDisplayValue = (display: number): number => (invert ? max - (display - min) : display);

  const emit = (next: number) => {
    if (!onEmit || isDisabled) return;
    onEmit("ui-control", buildSliderEmit(asSlider, label, next));
  };

  const scheduleEmit = (next: number) => {
    if (!onEmit || isDisabled) return;
    if (outs !== "all") return;
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      emit(next);
    }, DEFAULT_THROTTLE_MS);
  };

  const handleInput = (e: Event) => {
    if (isDisabled) return;
    const target = e.target as HTMLInputElement;
    const rawDisplay = toNumber(target.value, toDisplayValue(value));
    const logical = clampSliderValue(fromDisplayValue(rawDisplay), min, max);
    setValue(logical);
    if (outs === "all") {
      scheduleEmit(logical);
    }
  };

  const handleChange = (e: Event) => {
    if (isDisabled || outs !== "end") return;
    const target = e.target as HTMLInputElement;
    const rawDisplay = toNumber(target.value, toDisplayValue(value));
    const logical = clampSliderValue(fromDisplayValue(rawDisplay), min, max);
    setValue(logical);
    emit(logical);
  };

  const handleWheel = (e: WheelEvent) => {
    if (isDisabled || outs !== "all") return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? step : -step;
    const next = clampSliderValue(value + delta, min, max);
    setValue(next);
    scheduleEmit(next);
  };

  const sliderValue = toDisplayValue(value);
  const span = Math.max(1, max - min);
  const percent = Math.min(1, Math.max(0, (sliderValue - min) / span));
  const showSign = outs === "end" && !isDisabled;

  const sliderStyle = isVertical
    ? {
        width: "32px",
        height: "180px",
        writingMode: "bt-lr" as const,
        WebkitAppearance: "slider-vertical",
        background: `linear-gradient(to top, var(--nr-dashboard-slider-fill) ${percent * 100}%, var(--nr-dashboard-slider-track) ${percent * 100}%)`,
      }
    : {
        width: "100%",
        background: `linear-gradient(to right, var(--nr-dashboard-slider-fill) ${percent * 100}%, var(--nr-dashboard-slider-track) ${percent * 100}%)`,
      };

  const containerClass = ["nr-dashboard-slider", asSlider.className || "", isVertical ? "is-vertical" : ""].filter(Boolean).join(" ");

  const showHorizontalLabel = !isVertical && Number(asSlider.width ?? 0) >= Number(asSlider.height ?? 0) && Boolean(label);
  const showVerticalLabel = isVertical && Boolean(label);

  const sliderInput = html`<input
    class=${`nr-dashboard-slider__range ${isVertical ? "is-vertical" : ""}`.trim()}
    type="range"
    min=${min}
    max=${max}
    step=${step}
    value=${sliderValue}
    title=${asSlider.tooltip || undefined}
    disabled=${isDisabled}
    aria-valuetext=${t("slider_value_label", "{label}: {value}", { label, value: formatNumber(value, lang) })}
    onInput=${handleInput}
    onChange=${handleChange}
    onWheel=${handleWheel}
    onPointerDown=${() => setDragging(true)}
    onPointerUp=${() => setDragging(false)}
    onPointerCancel=${() => setDragging(false)}
    onBlur=${() => setDragging(false)}
    onMouseLeave=${() => setDragging(false)}
    style=${{
      ...sliderStyle,
      transform: isVertical && invert ? "rotate(180deg)" : undefined,
    }}
  />`;

  const bubble = showSign
    ? html`<span
        class=${`nr-dashboard-slider__sign ${isVertical ? "is-vertical" : ""}`.trim()}
        style=${isVertical
          ? { top: `${100 - percent * 100}%` }
          : { left: `${percent * 100}%` }}
      >${formatter.format(value)}</span>`
    : null;

  return html`<div class=${containerClass}>
    ${!isVertical
      ? html`<div class="nr-dashboard-slider__row">
          ${showHorizontalLabel ? html`<span class="nr-dashboard-slider__label">${label}</span>` : null}
          <div class=${`nr-dashboard-slider__track ${isVertical ? "is-vertical" : ""}`.trim()}>
            ${sliderInput}
            ${bubble}
          </div>
        </div>`
      : html`<div class=${`nr-dashboard-slider__track ${isVertical ? "is-vertical" : ""}`.trim()}>
          ${sliderInput}
          ${bubble}
        </div>
        ${showVerticalLabel ? html`<span class="nr-dashboard-slider__label is-vertical">${label}</span>` : null}`}
  </div>`;
}
