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
const MAX_TICKS = 10;

function ensureSliderStyles(doc: Document | undefined = typeof document !== "undefined" ? document : undefined): void {
  if (!doc) return;
  if (doc.getElementById(SLIDER_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = SLIDER_STYLE_ID;
  style.textContent = `
    :root {
      --nr-dashboard-slider-track: var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.18));
      --nr-dashboard-slider-fill: var(--nr-dashboard-widgetColor, #1f8af2);
      --nr-dashboard-slider-thumb: var(--nr-dashboard-widgetColor, #1f8af2);
      --nr-dashboard-slider-thumb-shadow: 0 1px 3px var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.35));
      --nr-dashboard-slider-focus: var(--nr-dashboard-widgetColor, #1f8af2);
      --nr-dashboard-slider-text: var(--nr-dashboard-widgetTextColor, #e9ecf1);
      --nr-dashboard-slider-chip-bg: var(--nr-dashboard-widgetBackgroundColor, transparent);
      --nr-dashboard-slider-chip-shadow: 0 4px 12px var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.35));
    }

    .nr-dashboard-slider {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
      align-items: stretch;
      padding: 0 12px;
    }

    .nr-dashboard-slider.is-vertical {
      flex-direction: row;
      padding: 0;
      font-size: 12px;
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
      margin-left: 8px;
      margin-top: 6px;
      padding-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
    }

    .nr-dashboard-slider__minmax {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      opacity: 0.7;
      color: var(--nr-dashboard-slider-text);
      padding: 0 2px;
    }

    .nr-dashboard-slider__range {
      width: 100%;
      accent-color: var(--nr-dashboard-slider-fill);
      background: transparent;
      touch-action: none;
      height: 6px;
    }

    .nr-dashboard-slider__range.is-vertical {
      width: 24px;
      height: 200px;
      writing-mode: bt-lr;
      -webkit-appearance: slider-vertical;
    }

    .nr-dashboard-slider__range::-webkit-slider-runnable-track {
      height: 6px;
      border-radius: 999px;
      background: var(--nr-dashboard-slider-track);
    }

    .nr-dashboard-slider__range::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 16px;
      width: 16px;
      margin-top: -5px;
      border-radius: 50%;
      background: var(--nr-dashboard-slider-thumb);
      box-shadow: var(--nr-dashboard-slider-thumb-shadow);
      border: 1px solid transparent;
    }

    .nr-dashboard-slider__range:focus-visible {
      outline: none;
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--nr-dashboard-slider-focus) 30%, transparent);
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
      height: 6px;
      border-radius: 999px;
      background: var(--nr-dashboard-slider-track);
    }

    .nr-dashboard-slider__range::-moz-range-progress {
      height: 6px;
      border-radius: 999px;
      background: var(--nr-dashboard-slider-fill);
    }

    .nr-dashboard-slider__range::-moz-range-thumb {
      height: 14px;
      width: 14px;
      border-radius: 50%;
      background: var(--nr-dashboard-slider-thumb);
      box-shadow: var(--nr-dashboard-slider-thumb-shadow);
      border: 1px solid transparent;
    }

    .nr-dashboard-slider__sign {
      position: absolute;
      padding: 4px 8px;
      border-radius: 12px;
        background: var(--nr-dashboard-slider-chip-bg);
        color: var(--nr-dashboard-slider-text);
      font-size: 11px;
      box-shadow: var(--nr-dashboard-slider-chip-shadow);
      pointer-events: none;
      white-space: nowrap;
    }

    .nr-dashboard-slider__sign.is-vertical {
      left: calc(50% + 14px);
      transform: translate(-50%, -50%);
    }

    .nr-dashboard-slider__value {
      opacity: 0.6;
      font-size: 12px;
      color: var(--nr-dashboard-slider-text);
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
  const forceSign = Boolean(asSlider.showSign);
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
  const stepCount = step > 0 ? Math.floor((max - min) / step) : 0;
  const showTicks = stepCount > 0 && stepCount <= MAX_TICKS;
  const showSign = forceSign || dragging;

  const sliderStyle = isVertical
    ? {
        width: "32px",
        height: "200px",
        writingMode: "bt-lr" as const,
        WebkitAppearance: "slider-vertical",
        background: `linear-gradient(to top, var(--nr-dashboard-slider-fill) ${percent * 100}%, var(--nr-dashboard-slider-track) ${percent * 100}%)`,
      }
    : {
        width: "100%",
        background: `linear-gradient(to right, var(--nr-dashboard-slider-fill) ${percent * 100}%, var(--nr-dashboard-slider-track) ${percent * 100}%)`,
      };

  const containerClass = ["nr-dashboard-slider", asSlider.className || "", isVertical ? "is-vertical" : ""].filter(Boolean).join(" ");

  return html`<div class=${containerClass}>
    ${!isVertical
      ? html`<div class="nr-dashboard-slider__row">
          <span class="nr-dashboard-slider__label">${label}</span>
          <div class=${`nr-dashboard-slider__track ${isVertical ? "is-vertical" : ""}`.trim()}>
            <input
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
            />
            ${showTicks
              ? html`<div class=${`nr-dashboard-slider__ticks ${isVertical ? "is-vertical" : ""}`.trim()}>
                  ${Array.from({ length: stepCount + 1 }).map((_, idx) => {
                    const pos = (idx / stepCount) * 100;
                    const active = percent * 100 >= pos;
                    const style = isVertical
                      ? { top: `${100 - pos}%`, left: "0" }
                      : { left: `${pos}%`, top: "0" };
                    return html`<span
                      class=${`nr-dashboard-slider__tick ${isVertical ? "is-vertical" : ""} ${active ? "is-active" : ""}`.trim()}
                      style=${style}
                    ></span>`;
                  })}
                </div>`
              : null}
            ${showSign
              ? html`<span
                  class=${`nr-dashboard-slider__sign ${isVertical ? "is-vertical" : ""}`.trim()}
                  style=${isVertical
                    ? { top: `${100 - percent * 100}%` }
                    : { left: `${percent * 100}%`, transform: "translate(-50%, -120%)" }}
                >${formatter.format(value)}</span>`
              : null}
          </div>
        </div>`
      : html`<div class=${`nr-dashboard-slider__track ${isVertical ? "is-vertical" : ""}`.trim()}>
          <input
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
          />
          ${showTicks
            ? html`<div class=${`nr-dashboard-slider__ticks ${isVertical ? "is-vertical" : ""}`.trim()}>
                ${Array.from({ length: stepCount + 1 }).map((_, idx) => {
                  const pos = (idx / stepCount) * 100;
                  const active = percent * 100 >= pos;
                  const style = isVertical
                    ? { top: `${100 - pos}%`, left: "0" }
                    : { left: `${pos}%`, top: "0" };
                  return html`<span
                    class=${`nr-dashboard-slider__tick ${isVertical ? "is-vertical" : ""} ${active ? "is-active" : ""}`.trim()}
                    style=${style}
                  ></span>`;
                })}
              </div>`
            : null}
          ${showSign
            ? html`<span
                class=${`nr-dashboard-slider__sign ${isVertical ? "is-vertical" : ""}`.trim()}
                style=${isVertical
                  ? { top: `${100 - percent * 100}%` }
                : { left: `${percent * 100}%`, transform: "translate(-50%, -120%)" }}
              >${formatter.format(value)}</span>`
            : null}
        </div>`}
    ${!isVertical
      ? html`<div class="nr-dashboard-slider__minmax">
          <span>${formatter.format(min)}</span>
          <span>${formatter.format(max)}</span>
        </div>`
      : null}
    ${isVertical ? html`<span class="nr-dashboard-slider__label is-vertical">${label}</span>` : null}
    <span class="nr-dashboard-slider__value">${formatter.format(value)}</span>
  </div>`;
}
