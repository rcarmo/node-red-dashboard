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
  return "var(--nr-dashboard-widgetColor, #1f8af2)";
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
  const label = (asButton.label || asButton.name || t("button_label", "Button {index}", { index: index + 1 })) as string;
  const labelHtml = { __html: label };
  const backgroundColor = resolveButtonColor(asButton);
  const textColor = typeof asButton.color === "string" && asButton.color ? asButton.color : "var(--nr-dashboard-widgetTextColor, #fff)";
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isDisabled = Boolean(disabled);

  const ripple = !isDisabled && (hovered || pressed);

  const handleClick = () => {
    const payload = buildButtonEmit(asButton, label);
    onEmit?.("ui-control", payload);
  };

  const renderIcon = (icon?: string) => {
    if (!icon) return null;
    const trimmed = icon.trim();
    if (!trimmed) return null;

    const isUrl = /^https?:\/\//i.test(trimmed);
    if (isUrl) {
      return html`<span class="nr-dashboard-button__icon-wrapper"><img src=${trimmed} alt="" /></span>`;
    }

    if (trimmed.startsWith("mi-")) {
      const glyph = trimmed.slice(3);
      return html`<span class="nr-dashboard-button__icon-wrapper" style=${{ color: textColor }}>
        <span class=${`material-icons ${trimmed}`} aria-hidden="true">${glyph}</span>
      </span>`;
    }

    if (trimmed.startsWith("fa-")) {
      return html`<span class="nr-dashboard-button__icon-wrapper" style=${{ color: textColor }}>
        <i class=${`fa fa-fw ${trimmed}`} aria-hidden="true"></i>
      </span>`;
    }

    if (trimmed.startsWith("wi-")) {
      return html`<span class="nr-dashboard-button__icon-wrapper" style=${{ color: textColor }}>
        <i class=${`wi wi-fw ${trimmed}`} aria-hidden="true"></i>
      </span>`;
    }

    if (trimmed.startsWith("icofont-")) {
      return html`<span class="nr-dashboard-button__icon-wrapper" style=${{ color: textColor }}>
        <i class=${`icofont icofont-fw ${trimmed}`} aria-hidden="true"></i>
      </span>`;
    }

    if (trimmed.startsWith("iconify-")) {
      const [, size] = trimmed.split(" ");
      const iconName = trimmed.split(" ")[0].slice(8);
      return html`<span class="nr-dashboard-button__icon-wrapper" style=${{ color: textColor }}>
        <i class="iconify" data-icon=${iconName} data-width=${size ?? "1.3em"} data-height=${size ?? "1.3em"} aria-hidden="true"></i>
      </span>`;
    }

    if (/^[A-Za-z0-9_-]+$/.test(trimmed)) {
      return html`<span class="nr-dashboard-button__icon-wrapper" style=${{ color: textColor }}>
        <span class="material-icons" aria-hidden="true">${trimmed}</span>
      </span>`;
    }

    return null;
  };

  return html`<button
    type="button"
    title=${asButton.tooltip || undefined}
    class=${`nr-dashboard-button ${asButton.className || ""}`.trim()}
    disabled=${Boolean(disabled)}
    onClick=${onEmit ? handleClick : undefined}
    onMouseEnter=${() => setHovered(true)}
    onMouseLeave=${() => setHovered(false)}
    onMouseDown=${() => setPressed(true)}
    onMouseUp=${() => setPressed(false)}
    onBlur=${() => {
      setPressed(false);
    }}
    onFocus=${() => {}}
    style=${{
      width: "100%",
      height: "100%",
      minWidth: "0",
      minHeight: "36px",
      padding: "2px",
      borderRadius: "2px",
      border: "none",
      background: backgroundColor,
      color: textColor,
      fontSize: "14px",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.01em",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: asButton.icon ? "6px" : "0px",
      cursor: onEmit ? "pointer" : "default",
      outline: "none",
      boxShadow: "none",
      transition: "background 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
      opacity: isDisabled ? 0.55 : 1,
    }}
  >
    ${renderIcon(asButton.icon)}
    <span class="nr-dashboard-button__label" style=${{ pointerEvents: "none" }} dangerouslySetInnerHTML=${labelHtml}></span>
    <span
      aria-hidden="true"
      style=${{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at center, rgba(255,255,255,0.16), transparent 60%)",
        opacity: ripple ? (pressed ? 0.32 : 0.18) : 0,
        transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: "none",
      }}
    ></span>
  </button>`;
}
