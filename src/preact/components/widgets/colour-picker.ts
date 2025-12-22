import { html } from "htm/preact";
import type { VNode } from "preact";
import { useMemo, useState } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";
import { buildFieldStyles, fieldLabelStyles, fieldWrapperStyles } from "../styles/fieldStyles";

const COLOUR_PICKER_STYLE_ID = "nr-dashboard-colour-picker-style";

function ensureColourPickerStyles(doc: Document | undefined = typeof document !== "undefined" ? document : undefined): void {
  if (!doc) return;
  if (doc.getElementById(COLOUR_PICKER_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = COLOUR_PICKER_STYLE_ID;
  style.textContent = `
    .nr-dashboard-colour-picker {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0 12px;
      box-sizing: border-box;
      gap: 8px;
      color: var(--nr-dashboard-widgetTextColor, inherit);
    }

    .nr-dashboard-colour-picker__label {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--nr-dashboard-widgetTextColor, inherit);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nr-dashboard-colour-picker__field {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .nr-dashboard-colour-picker__input {
      width: 32px;
      height: 32px;
      padding: 0;
      border: 1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.35));
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
    }

    .nr-dashboard-colour-picker__input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .nr-dashboard-colour-picker__value {
      min-width: 122px;
      height: 22px;
      text-align: center;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 3px;
      border: 0;
      color: var(--nr-dashboard-widgetTextColor, inherit);
      background: transparent;
      box-sizing: border-box;
    }
  `;
  doc.head.appendChild(style);
}

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

  ensureColourPickerStyles();

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
