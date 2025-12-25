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
  const showSign = Boolean(asSlider.showSign) || (outs === "end" && !isDisabled);

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

  const containerClass = ["nr-dashboard-slider", asSlider.className || "", isVertical ? "is-vertical" : "", (isDiscrete && !isVertical) ? "discrete-end" : ""].filter(Boolean).join(" ");

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

  const valueDisplay = html`<span class="nr-dashboard-slider__value">${formatter.format(value)}</span>`;

  return html`<div class=${containerClass}>
    ${!isVertical
      ? html`<div class="nr-dashboard-slider__row">
          ${showHorizontalLabel ? html`<span class="nr-dashboard-slider__label">${label}</span>` : null}
          <div class=${`nr-dashboard-slider__track ${isVertical ? "is-vertical" : ""}`.trim()}>
            ${sliderInput}
            ${bubble}
          </div>
          ${valueDisplay}
        </div>`
      : html`<div class=${`nr-dashboard-slider__track ${isVertical ? "is-vertical" : ""}`.trim()}>
          ${sliderInput}
          ${bubble}
        </div>
        ${showVerticalLabel ? html`<span class="nr-dashboard-slider__label is-vertical">${label}</span>` : null}
        ${valueDisplay}`}
  </div>`;
}
