import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiMenuItem } from "../../state";
import { ensureLayoutStyles } from "./layout-styles";

export function TabNav(props: { menu: UiMenuItem[]; selectedIndex: number | null; onSelect: (index: number) => void }): VNode {
  const { menu, selectedIndex, onSelect } = props;
  ensureLayoutStyles();

  return html`<ul class="nr-dashboard-tabs">
    ${menu.length === 0
      ? html`<li style=${{ opacity: 0.6 }}>No tabs yet</li>`
      : menu.map((tab, idx) => {
          const active = idx === selectedIndex;
          return html`<li key=${tab.id ?? tab.header ?? idx}>
            <button
              class=${`nr-dashboard-tabs__btn ${active ? "is-active" : ""}`.trim()}
              disabled=${tab.disabled || tab.hidden}
              onClick=${() => onSelect(idx)}
            >
              ${tab.header || tab.name || `Tab ${idx + 1}`}
            </button>
          </li>`;
        })}
  </ul>`;
}
