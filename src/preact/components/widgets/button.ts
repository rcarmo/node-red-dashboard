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
  const [pressed, setPressed] = useState(false);

  const ripple = hovered || pressed;

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
    onMouseDown=${() => setPressed(true)}
    onMouseUp=${() => setPressed(false)}
    onBlur=${() => {
      setFocused(false);
      setPressed(false);
    }}
    onFocus=${() => setFocused(true)}
    style=${{
      width: "100%",
      minHeight: "38px",
      padding: "10px 14px",
      borderRadius: "6px",
      border: "1px solid color-mix(in srgb, var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.24)) 70%, transparent)",
      background: color,
      color: "var(--nr-dashboard-widgetTextColor, #fff)",
      fontWeight: 700,
      cursor: onEmit ? "pointer" : "default",
      outline: "none",
      boxShadow: focused
        ? "0 0 0 3px color-mix(in srgb, var(--nr-dashboard-widgetColor, #1f8af2) 35%, transparent), 0 6px 16px rgba(0,0,0,0.35)"
        : hovered
          ? "0 6px 16px rgba(0,0,0,0.3)"
          : "0 4px 12px rgba(0,0,0,0.25)",
      filter: hovered ? "brightness(1.03)" : "none",
      transform: pressed ? "translateY(1px)" : "none",
      transition: "box-shadow 160ms ease, filter 160ms ease, background 160ms ease, transform 120ms ease",
      letterSpacing: "0.02em",
      position: "relative",
      overflow: "hidden",
    }}
  >
    ${asButton.icon ? html`<span class="fa ${asButton.icon}" style=${{ marginRight: "6px" }}></span>` : null}
    ${label}
    <span
      aria-hidden="true"
      style=${{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at center, rgba(255,255,255,0.24), transparent 55%)",
        opacity: ripple ? 0.4 : 0,
        transition: "opacity 180ms ease",
        pointerEvents: "none",
      }}
    ></span>
  </button>`;
}
