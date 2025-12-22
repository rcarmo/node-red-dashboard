import { html } from "htm/preact";
import type { VNode } from "preact";
import { useState } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";
import { resolveTypedPayload } from "../../lib/payload";

export type ButtonControl = UiControl & {
  label?: string;
  name?: string;
  color?: string;
  bgcolor?: string;
  icon?: string;
  payload?: unknown;
  payloadType?: string;
  topic?: string;
  className?: string;
  tooltip?: string;
};

export function resolveButtonColor(ctrl: ButtonControl): string {
  if (typeof ctrl.bgcolor === "string" && ctrl.bgcolor) return ctrl.bgcolor;
  if (typeof ctrl.color === "string" && ctrl.color) return ctrl.color;
  return "#1f8af2";
}

export function buildButtonEmit(ctrl: ButtonControl, fallbackLabel: string): Record<string, unknown> {
  const val = resolveTypedPayload(ctrl.payload ?? true, ctrl.payloadType);
  return {
    payload: val,
    topic: ctrl.topic ?? fallbackLabel,
    type: "button",
  };
}

export function ButtonWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const asButton = control as ButtonControl;
  const { t } = useI18n();
  const label = asButton.label || asButton.name || t("button_label", "Button {index}", { index: index + 1 });
  const color = resolveButtonColor(asButton) || "var(--nr-dashboard-widgetColor, #1f8af2)";
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleClick = () => {
    const payload = buildButtonEmit(asButton, label);
    onEmit?.("ui-control", payload);
  };

  return html`<button
    type="button"
    title=${asButton.tooltip || undefined}
    class=${asButton.className || ""}
    disabled=${Boolean(disabled)}
    onClick=${onEmit ? handleClick : undefined}
    onMouseEnter=${() => setHovered(true)}
    onMouseLeave=${() => setHovered(false)}
    onFocus=${() => setFocused(true)}
    onBlur=${() => setFocused(false)}
    style=${{
      width: "100%",
      padding: "4px 8px",
      borderRadius: "2px",
      border: "1px solid var(--nr-dashboard-widgetBorderColor, transparent)",
      background: color,
      color: "var(--nr-dashboard-widgetTextColor, #fff)",
      fontWeight: 600,
      cursor: onEmit ? "pointer" : "default",
      outline: "none",
      boxShadow: focused
        ? "0 0 0 2px color-mix(in srgb, var(--nr-dashboard-widgetColor, #1f8af2) 30%, transparent)"
        : "none",
      filter: hovered ? "brightness(1.02)" : "none",
      transition: "box-shadow 120ms ease, filter 120ms ease, background 120ms ease",
    }}
  >
    ${asButton.icon ? html`<span class="fa ${asButton.icon}" style=${{ marginRight: "6px" }}></span>` : null}
    ${label}
  </button>`;
}
