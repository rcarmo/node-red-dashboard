import { html } from "htm/preact";
import { useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

export type LinkControl = UiControl & {
  name?: string;
  label?: string;
  url?: string;
  target?: string;
  icon?: string;
};

export function resolveLinkHref(ctrl: LinkControl, fallback = "#"): string {
  return ctrl.url || (ctrl as { link?: string }).link || fallback;
}

export function LinkWidget(props: { control: UiControl; index: number; disabled?: boolean }): VNode {
  const { control, index, disabled } = props;
  const c = control as LinkControl;
  const href = resolveLinkHref(c);
  const { t } = useI18n();
  const label = c.label || c.name || href || t("link_label", "Link {index}", { index: index + 1 });
  const target = c.target || "_blank";
  const icon = c.icon;
  const isDisabled = Boolean(disabled);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const focusRing = focused
    ? "0 0 0 2px color-mix(in srgb, var(--nr-dashboard-widgetColor, #61dafb) 40%, transparent)"
    : "none";

  return html`<div style=${{ display: "flex", alignItems: "center", width: "100%" }}>
    <a
      href=${isDisabled ? undefined : href}
      target=${target}
      rel="noreferrer noopener"
      aria-disabled=${isDisabled}
      aria-label=${t("link_open", "Open {label}", { label })}
      tabIndex=${isDisabled ? -1 : undefined}
      title=${c.tooltip || t("link_open", "Open {label}", { label })}
      onClick=${isDisabled
        ? (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
          }
        : undefined}
      onMouseEnter=${() => setHovered(true)}
      onMouseLeave=${() => setHovered(false)}
      onMouseDown=${() => setPressed(true)}
      onMouseUp=${() => setPressed(false)}
      onFocus=${() => setFocused(true)}
      onBlur=${() => {
        setPressed(false);
        setFocused(false);
      }}
      style=${{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "8px",
        background: "transparent",
        color: isDisabled
          ? "var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.45))"
          : hovered
            ? "color-mix(in srgb, var(--nr-dashboard-widgetColor, #61dafb) 90%, white 10%)"
            : "var(--nr-dashboard-widgetColor, #61dafb)",
        pointerEvents: isDisabled ? "none" : "auto",
        textDecoration: hovered ? "underline" : "none",
        boxShadow: focusRing,
        transition: "box-shadow 140ms ease, color 140ms ease, text-decoration-color 140ms ease",
        width: "100%",
        transform: pressed ? "translateY(1px)" : "none",
      }}
    >
      ${icon ? html`<i class=${icon} aria-hidden="true" style=${{ fontSize: "18px" }}></i>` : html`<i class="fa fa-external-link" aria-hidden="true" style=${{ fontSize: "18px" }}></i>`}
      <span style=${{ fontWeight: 500, letterSpacing: "0.01em", fontSize: "14px", lineHeight: "20px" }}>${label}</span>
    </a>
  </div>`;
}
