import { html } from "htm/preact";
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

  return html`<div style=${{ display: "flex", gap: "8px", alignItems: "center" }}>
    ${icon ? html`<i class=${icon} aria-hidden="true"></i>` : null}
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
      style=${{
        color: isDisabled ? "var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.4))" : "var(--nr-dashboard-widgetColor, #61dafb)",
        pointerEvents: isDisabled ? "none" : "auto",
        textDecoration: "none",
        borderBottom: isDisabled ? "none" : "1px solid transparent",
        transition: "color 120ms ease, border-color 120ms ease",
      }}
      onMouseEnter=${(e: MouseEvent) => {
        const el = e.currentTarget as HTMLAnchorElement;
        if (isDisabled) return;
        el.style.borderBottom = "1px solid currentColor";
      }}
      onMouseLeave=${(e: MouseEvent) => {
        const el = e.currentTarget as HTMLAnchorElement;
        if (isDisabled) return;
        el.style.borderBottom = "1px solid transparent";
      }}
    >
      ${label}
    </a>
  </div>`;
}
