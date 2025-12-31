import { html } from "htm/preact";
import type { VNode } from "preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

export type ColourPickerControl = UiControl & {
  name?: string;
  label?: string;
  value?: string;
  format?: "hex" | "rgb" | "hsl";
  showAlpha?: boolean;
  showLightness?: boolean;
  showHue?: boolean;
  showSwatch?: boolean;
  inline?: boolean;
  dynamicOutput?: boolean;
  className?: string;
};

// HSL <-> RGB <-> Hex conversion utilities
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [255, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function parseColor(value: string): { h: number; s: number; l: number; a: number } {
  let h = 0, s = 100, l = 50, a = 1;
  
  if (value.startsWith("#")) {
    const [r, g, b] = hexToRgb(value);
    [h, s, l] = rgbToHsl(r, g, b);
  } else if (value.startsWith("rgb")) {
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      [h, s, l] = rgbToHsl(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
      a = match[4] ? parseFloat(match[4]) : 1;
    }
  } else if (value.startsWith("hsl")) {
    const match = value.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?(?:,\s*([\d.]+))?\)/);
    if (match) {
      h = parseInt(match[1]);
      s = parseInt(match[2]);
      l = parseInt(match[3]);
      a = match[4] ? parseFloat(match[4]) : 1;
    }
  }
  
  return { h, s, l, a };
}

function formatColor(h: number, s: number, l: number, a: number, format: "hex" | "rgb" | "hsl"): string {
  const [r, g, b] = hslToRgb(h, s, l);
  switch (format) {
    case "rgb":
      return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    case "hsl":
      return a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`;
    case "hex":
    default:
      return rgbToHex(r, g, b);
  }
}

export function resolveColourValue(value?: string, fallback = "#ff0000"): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return fallback;
}

export function ColourPickerWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const c = control as ColourPickerControl;
  const { t } = useI18n();
  const label = c.label || c.name || t("colour_label", "Colour {index}", { index: index + 1 });
  const format = c.format || "hex";
  const showAlpha = c.showAlpha !== false;
  const showLightness = c.showLightness !== false;
  const showHue = c.showHue !== false;
  const showSwatch = c.showSwatch !== false;
  const inline = Boolean(c.inline);
  const dynamicOutput = Boolean(c.dynamicOutput);
  const isDisabled = Boolean(disabled);

  const initialColor = useMemo(() => parseColor(resolveColourValue(c.value)), [c.value]);
  const [hue, setHue] = useState<number>(initialColor.h);
  const [saturation, setSaturation] = useState<number>(initialColor.s);
  const [lightness, setLightness] = useState<number>(initialColor.l);
  const [alpha, setAlpha] = useState<number>(initialColor.a);
  const [isOpen, setIsOpen] = useState<boolean>(inline);
  const containerRef = useRef<HTMLDivElement>(null);
  const satLightRef = useRef<HTMLDivElement>(null);

  // Sync from external value changes
  useEffect(() => {
    const parsed = parseColor(resolveColourValue(c.value));
    setHue(parsed.h);
    setSaturation(parsed.s);
    setLightness(parsed.l);
    setAlpha(parsed.a);
  }, [c.value]);

  const currentColor = useMemo(() => formatColor(hue, saturation, lightness, alpha, format), [hue, saturation, lightness, alpha, format]);
  const previewColor = useMemo(() => formatColor(hue, saturation, lightness, alpha, "rgb"), [hue, saturation, lightness, alpha]);

  const emitChange = useCallback((h: number, s: number, l: number, a: number) => {
    const color = formatColor(h, s, l, a, format);
    if (dynamicOutput || !isOpen) {
      onEmit?.("update-value", { id: c.id, value: { payload: color, type: "colour-picker" } });
    }
  }, [format, dynamicOutput, isOpen, onEmit, c.id]);

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen || inline) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onEmit?.("update-value", { id: c.id, value: { payload: currentColor, type: "colour-picker" } });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, inline, currentColor, onEmit, c.id]);

  // Saturation/Lightness area drag handling
  const handleSatLightDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (isDisabled || !satLightRef.current) return;
    const rect = satLightRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const newSat = Math.round(x * 100);
    const newLight = Math.round((1 - y) * 100);
    setSaturation(newSat);
    setLightness(newLight);
    if (dynamicOutput) emitChange(hue, newSat, newLight, alpha);
  }, [isDisabled, hue, alpha, dynamicOutput, emitChange]);

  const handleSatLightMouseDown = useCallback((e: MouseEvent) => {
    handleSatLightDrag(e);
    const handleMove = (ev: MouseEvent) => handleSatLightDrag(ev);
    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      if (!dynamicOutput) emitChange(hue, saturation, lightness, alpha);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }, [handleSatLightDrag, dynamicOutput, emitChange, hue, saturation, lightness, alpha]);

  // Keyboard handling for saturation/lightness area
  const handleSatLightKeyDown = useCallback((e: KeyboardEvent) => {
    if (isDisabled) return;
    const step = e.shiftKey ? 10 : 1;
    let newSat = saturation;
    let newLight = lightness;
    let handled = false;

    switch (e.key) {
      case "ArrowRight":
        newSat = Math.min(100, saturation + step);
        handled = true;
        break;
      case "ArrowLeft":
        newSat = Math.max(0, saturation - step);
        handled = true;
        break;
      case "ArrowUp":
        newLight = Math.min(100, lightness + step);
        handled = true;
        break;
      case "ArrowDown":
        newLight = Math.max(0, lightness - step);
        handled = true;
        break;
      case "Home":
        newSat = 0;
        handled = true;
        break;
      case "End":
        newSat = 100;
        handled = true;
        break;
      case "PageUp":
        newLight = Math.min(100, lightness + 10);
        handled = true;
        break;
      case "PageDown":
        newLight = Math.max(0, lightness - 10);
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      setSaturation(newSat);
      setLightness(newLight);
      emitChange(hue, newSat, newLight, alpha);
    }
  }, [isDisabled, saturation, lightness, hue, alpha, emitChange]);

  const handleHueChange = (e: Event) => {
    const newHue = parseInt((e.target as HTMLInputElement).value, 10);
    setHue(newHue);
    emitChange(newHue, saturation, lightness, alpha);
  };

  const handleLightnessChange = (e: Event) => {
    const newLight = parseInt((e.target as HTMLInputElement).value, 10);
    setLightness(newLight);
    emitChange(hue, saturation, newLight, alpha);
  };

  const handleAlphaChange = (e: Event) => {
    const newAlpha = parseFloat((e.target as HTMLInputElement).value);
    setAlpha(newAlpha);
    emitChange(hue, saturation, lightness, newAlpha);
  };

  const handleHexInput = (e: Event) => {
    const v = (e.target as HTMLInputElement).value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      const parsed = parseColor(v);
      setHue(parsed.h);
      setSaturation(parsed.s);
      setLightness(parsed.l);
      emitChange(parsed.h, parsed.s, parsed.l, alpha);
    }
  };

  const togglePicker = () => {
    if (isDisabled || inline) return;
    if (isOpen) {
      onEmit?.("update-value", { id: c.id, value: { payload: currentColor, type: "colour-picker" } });
    }
    setIsOpen(!isOpen);
  };

  const renderPicker = () => html`<div class="nr-dashboard-colour-picker__panel">
    <div
      ref=${satLightRef}
      class="nr-dashboard-colour-picker__satlight"
      style=${{ background: `linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))` }}
      tabIndex=${isDisabled ? -1 : 0}
      role="slider"
      aria-label=${t("colour_satlight", "Saturation and lightness")}
      aria-valuetext=${t("colour_satlight_value", "Saturation {sat}%, Lightness {light}%", { sat: saturation, light: lightness })}
      aria-disabled=${isDisabled}
      onMouseDown=${handleSatLightMouseDown}
      onKeyDown=${handleSatLightKeyDown}
    >
      <div class="nr-dashboard-colour-picker__satlight-overlay"></div>
      <div
        class="nr-dashboard-colour-picker__cursor"
        style=${{
          left: `${saturation}%`,
          top: `${100 - lightness}%`,
          background: previewColor,
        }}
        aria-hidden="true"
      ></div>
    </div>
    ${showHue ? html`<div class="nr-dashboard-colour-picker__slider-row">
      <label class="nr-dashboard-colour-picker__slider-label" id="hue-label-${control.id}">${t("colour_hue", "H")}</label>
      <input
        type="range"
        min="0"
        max="360"
        value=${hue}
        class="nr-dashboard-colour-picker__hue-slider"
        onInput=${handleHueChange}
        disabled=${isDisabled}
        aria-labelledby="hue-label-${control.id}"
        aria-valuemin=${0}
        aria-valuemax=${360}
        aria-valuenow=${hue}
      />
      <span class="nr-dashboard-colour-picker__slider-value" aria-hidden="true">${hue}°</span>
    </div>` : null}
    ${showLightness ? html`<div class="nr-dashboard-colour-picker__slider-row">
      <label class="nr-dashboard-colour-picker__slider-label" id="lightness-label-${control.id}">${t("colour_lightness", "L")}</label>
      <input
        type="range"
        min="0"
        max="100"
        value=${lightness}
        class="nr-dashboard-colour-picker__lightness-slider"
        style=${{ background: `linear-gradient(to right, #000, hsl(${hue}, ${saturation}%, 50%), #fff)` }}
        onInput=${handleLightnessChange}
        disabled=${isDisabled}
        aria-labelledby="lightness-label-${control.id}"
        aria-valuemin=${0}
        aria-valuemax=${100}
        aria-valuenow=${lightness}
      />
      <span class="nr-dashboard-colour-picker__slider-value" aria-hidden="true">${lightness}%</span>
    </div>` : null}
    ${showAlpha ? html`<div class="nr-dashboard-colour-picker__slider-row">
      <label class="nr-dashboard-colour-picker__slider-label" id="alpha-label-${control.id}">${t("colour_alpha", "A")}</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value=${alpha}
        class="nr-dashboard-colour-picker__alpha-slider"
        style=${{ background: `linear-gradient(to right, transparent, hsl(${hue}, ${saturation}%, ${lightness}%))` }}
        onInput=${handleAlphaChange}
        disabled=${isDisabled}
        aria-labelledby="alpha-label-${control.id}"
        aria-valuemin=${0}
        aria-valuemax=${1}
        aria-valuenow=${alpha}
      />
      <span class="nr-dashboard-colour-picker__slider-value">${Math.round(alpha * 100)}%</span>
    </div>` : null}
    <div class="nr-dashboard-colour-picker__hex-row">
      <input
        type="text"
        class="nr-dashboard-colour-picker__hex-input"
        value=${currentColor}
        onInput=${handleHexInput}
        disabled=${isDisabled}
        aria-label=${t("colour_value", "Color value")}
      />
    </div>
  </div>`;

  return html`<div
    ref=${containerRef}
    class=${`nr-dashboard-colour-picker ${c.className || ""} ${inline ? "is-inline" : ""} ${isOpen ? "is-open" : ""}`.trim()}
  >
    ${!inline ? html`<button
      type="button"
      class="nr-dashboard-colour-picker__trigger"
      onClick=${togglePicker}
      disabled=${isDisabled}
      aria-expanded=${isOpen}
      aria-haspopup="dialog"
      aria-label=${t("colour_trigger", "{label}: {color}", { label, color: currentColor })}
    >
      <span class="nr-dashboard-colour-picker__label">${label}</span>
      ${showSwatch ? html`<div
        class="nr-dashboard-colour-picker__swatch"
        style=${{ background: previewColor }}
        aria-hidden="true"
      ></div>` : null}
      <span class="nr-dashboard-colour-picker__value">${currentColor}</span>
    </button>` : null}
    ${(isOpen || inline) ? renderPicker() : null}
  </div>`;
}
