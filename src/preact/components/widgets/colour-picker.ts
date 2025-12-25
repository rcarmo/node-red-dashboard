import { html } from "htm/preact";
import type { VNode } from "preact";
import { useMemo, useState } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";
import { buildFieldStyles } from "../styles/fieldStyles";

export type ColourPickerControl = UiControl & {
  name?: string;
  label?: string;
  value?: string;
  className?: string;
};

export function resolveColourValue(value?: string, fallback = "#ff0000"): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return fallback;
}

export function ColourPickerWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const c = control as ColourPickerControl;
  const { t } = useI18n();
  const label = c.label || c.name || t("colour_label", "Colour {index}", { index: index + 1 });
  const [value, setValue] = useState<string>(resolveColourValue(c.value));
  const isDisabled = Boolean(disabled);
  const [focused, setFocused] = useState<boolean>(false);
  const inputId = useMemo(() => `nr-dashboard-colour-${index}`, [index]);

  const fieldStyles = buildFieldStyles({ focused, disabled: isDisabled, hasAdornment: true });

  return html`<div class=${`nr-dashboard-colour-picker ${c.className || ""}`.trim()}>
    <span class="nr-dashboard-colour-picker__label">${label}</span>
    <div
      class="nr-dashboard-colour-picker__field"
      style=${fieldStyles}
    >
      <input
        class="nr-dashboard-colour-picker__input"
        type="color"
        value=${value}
        disabled=${isDisabled}
        id=${inputId}
        aria-label=${label}
        onInput=${(e: Event) => {
          if (isDisabled) return;
          const v = (e.target as HTMLInputElement).value;
          setValue(v);
          onEmit?.("ui-change", { payload: v });
        }}
        onFocus=${() => setFocused(true)}
        onBlur=${() => setFocused(false)}
      />
      <span class="nr-dashboard-colour-picker__value" aria-live="polite">${value}</span>
    </div>
  </div>`;
}
