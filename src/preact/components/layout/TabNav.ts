import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiMenuItem } from "../../state";
import { ensureLayoutStyles } from "./layout-styles";
import { useI18n } from "../../lib/i18n";

type TabNavVariant = "full" | "icon";

export function TabNav(props: { menu: UiMenuItem[]; selectedIndex: number | null; onSelect: (index: number) => void; variant?: TabNavVariant }): VNode {
  const { menu, selectedIndex, onSelect, variant = "full" } = props;
  ensureLayoutStyles();
  const { t } = useI18n();
  const iconOnly = variant === "icon";
  const visibleMenu = menu
    .map((tab, originalIndex) => ({ tab, originalIndex }))
    .filter(({ tab }) => !tab.hidden);

  const renderLetterFallback = (tab: UiMenuItem, idx: number): string => {
    const raw = (tab.header || tab.name || t("tab_label", "Tab {index}", { index: idx + 1 })) as string;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return "?";
    return trimmed[0].toUpperCase();
  };

  const renderIcon = (tab: UiMenuItem, idx: number): VNode => {
    const icon = (tab.icon ?? "").trim();
    const letter = renderLetterFallback(tab, idx);

    if (icon.length === 0) {
      return html`<span class="nr-dashboard-tabs__icon">${letter}</span>`;
    }

    const isUrl = /^https?:\/\//i.test(icon);
    if (isUrl) {
      return html`<span class="nr-dashboard-tabs__icon"><img src=${icon} alt="" /></span>`;
    }

    if (icon.startsWith("mi-")) {
      const glyph = icon.slice(3);
      return html`<span class="nr-dashboard-tabs__icon"><span class=${`material-icons ${icon}`} aria-hidden="true">${glyph}</span></span>`;
    }

    if (icon.startsWith("fa-")) {
      return html`<span class="nr-dashboard-tabs__icon"><i class=${`fa fa-fw ${icon}`} aria-hidden="true"></i></span>`;
    }

    if (icon.startsWith("wi-")) {
      return html`<span class="nr-dashboard-tabs__icon"><i class=${`wi wi-fw ${icon}`} aria-hidden="true"></i></span>`;
    }

    if (icon.startsWith("icofont-")) {
      return html`<span class="nr-dashboard-tabs__icon"><i class=${`icofont icofont-fw ${icon}`} aria-hidden="true"></i></span>`;
    }

    if (icon.startsWith("iconify-")) {
      const [, size] = icon.split(" ");
      const iconName = icon.split(" ")[0].slice(8);
      return html`<span class="nr-dashboard-tabs__icon"><i class="iconify" data-icon=${iconName} data-width=${size ?? "1.3em"} data-height=${size ?? "1.3em"} aria-hidden="true"></i></span>`;
    }

    // Legacy Angular sidebar treated bare icon names as Material icons (ng-md-icon)
    if (/^[A-Za-z0-9_-]+$/.test(icon)) {
      return html`<span class="nr-dashboard-tabs__icon"><span class="material-icons" aria-hidden="true">${icon}</span></span>`;
    }

    return html`<span class="nr-dashboard-tabs__icon">${letter}</span>`;
  };

  return html`<ul class=${`nr-dashboard-tabs ${iconOnly ? "nr-dashboard-tabs--icon" : ""}`.trim()}>
    ${visibleMenu.length === 0
      ? html`<li style=${{ opacity: 0.6 }}>${t("no_tabs", "No tabs yet")}</li>`
      : visibleMenu.map(({ tab, originalIndex }, idx) => {
          const active = originalIndex === selectedIndex;
          const label = (tab.header || tab.name || t("tab_label", "Tab {index}", { index: idx + 1 })) as string;
          const icon = tab.icon ? renderIcon(tab, idx) : null;
          return html`<li key=${tab.id ?? tab.header ?? originalIndex}>
            <button
              class=${`nr-dashboard-tabs__btn ${iconOnly ? "is-icon" : ""} ${active ? "is-active" : ""}`.trim()}
              disabled=${tab.disabled}
              type="button"
              aria-label=${label}
              title=${label}
              onClick=${() => onSelect(originalIndex)}
            >
              ${icon}
              <span class="nr-dashboard-tabs__label">${label}</span>
            </button>
          </li>`;
        })}
  </ul>`;
}
