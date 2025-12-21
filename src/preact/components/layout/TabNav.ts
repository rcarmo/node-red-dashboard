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

  const renderIcon = (tab: UiMenuItem, idx: number): string => {
    const raw = (tab.header || tab.name || t("tab_label", "Tab {index}", { index: idx + 1 })) as string;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return "?";
    return trimmed[0].toUpperCase();
  };

  return html`<ul class=${`nr-dashboard-tabs ${iconOnly ? "nr-dashboard-tabs--icon" : ""}`.trim()}>
    ${menu.length === 0
      ? html`<li style=${{ opacity: 0.6 }}>${t("no_tabs", "No tabs yet")}</li>`
      : menu.map((tab, idx) => {
          const active = idx === selectedIndex;
          return html`<li key=${tab.id ?? tab.header ?? idx}>
            <button
              class=${`nr-dashboard-tabs__btn ${iconOnly ? "is-icon" : ""} ${active ? "is-active" : ""}`.trim()}
              disabled=${tab.disabled || tab.hidden}
              onClick=${() => onSelect(idx)}
            >
              ${iconOnly
                ? html`<span class="nr-dashboard-tabs__icon">${renderIcon(tab, idx)}</span><span class="nr-dashboard-tabs__label">${
                    tab.header || tab.name || t("tab_label", "Tab {index}", { index: idx + 1 })
                  }</span>`
                : tab.header || tab.name || t("tab_label", "Tab {index}", { index: idx + 1 })}
            </button>
          </li>`;
        })}
  </ul>`;
}
