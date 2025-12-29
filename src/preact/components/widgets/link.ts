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

  const anchorClass = `nr-dashboard-link__anchor${isDisabled ? " is-disabled" : ""}`;

  return html`<div class="nr-dashboard-link__container">
    <a
      href=${isDisabled ? undefined : href}
      target=${target}
      rel="noreferrer noopener"
      class=${anchorClass}
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
    >
      ${icon ? html`<i class=${`${icon} nr-dashboard-link__icon`} aria-hidden="true"></i>` : html`<i class="fa fa-external-link nr-dashboard-link__icon" aria-hidden="true"></i>`}
      <span class="nr-dashboard-link__label">${label}</span>
    </a>
  </div>`;
}
