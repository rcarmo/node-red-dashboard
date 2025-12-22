import { html } from "htm/preact";
import type { VNode } from "preact";
import { useMemo, useState } from "preact/hooks";
import type { UiControl, UiGroup } from "../../state";
import { WidgetRenderer } from "../widget-renderer";
import { ensureLayoutStyles } from "./layout-styles";
import { useI18n } from "../../lib/i18n";

export function GroupCard(props: {
  group: UiGroup;
  index: number;
  columnSpan: number;
  padding: { x: number; y: number };
  sizes: { cy: number; cx: number };
  onEmit?: (event: string, msg?: Record<string, unknown>) => void;
  tabName?: string;
}): VNode {
  const { group, index, columnSpan, padding, sizes, onEmit, tabName } = props;
  ensureLayoutStyles();
  const { t } = useI18n();

  const header = group.header;
  const title = header?.name || t("group_label", "Group {index}", { index: index + 1 });
  const items = (group.items ?? []) as UiControl[];
  const collapseEnabled = Boolean((header?.config as { collapse?: boolean } | undefined)?.collapse);
  const groupKey = useMemo(() => {
    const base = `${tabName ?? ""} ${header?.name ?? ""}`.trim();
    return (base || header?.id || `group-${index}`).toString().replace(/ /g, "_");
  }, [tabName, header?.name, header?.id, index]);

  const initialCollapsed = useMemo(() => {
    const flag = (header?.config as { collapsed?: boolean; collapse?: boolean } | undefined)?.collapsed ??
      (header?.config as { collapse?: boolean } | undefined)?.collapse ??
      false;
    return flag;
  }, [header?.config]);

  const [collapsed, setCollapsed] = useState<boolean>(initialCollapsed);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
  };

  return html`<section
    class=${`nr-dashboard-group-card ${header?.config?.className ?? ""}`.trim()}
    style=${{
      gridColumn: `span ${columnSpan}`,
      padding: `${padding.y}px ${padding.x}px`,
    }}
  >
    <header
      class="nr-dashboard-group-card__header"
      style=${{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        minHeight: "32px",
        padding: "10px 12px 6px 12px",
      }}
    >
      <span style=${{ fontWeight: 500, lineHeight: "20px", paddingRight: "8px" }}>${title}</span>
      ${collapseEnabled
        ? html`<button
            type="button"
            aria-expanded=${!collapsed}
            aria-label=${collapsed ? t("expand_group", "Expand group") : t("collapse_group", "Collapse group")}
            onClick=${toggleCollapse}
            class="nr-dashboard-group-card__collapse"
          >
            <i class=${collapsed ? "fa fa-caret-down" : "fa fa-caret-up"}></i>
          </button>`
        : null}
    </header>
    ${collapsed
      ? html`<div style=${{ opacity: 0.6, fontSize: "12px", padding: "0 12px 12px 12px" }}>${t("collapsed", "Collapsed")}</div>`
      : items.length === 0
      ? html`<div style=${{ opacity: 0.6, fontSize: "12px", padding: "0 12px 12px 12px" }}>${t("no_widgets", "No widgets in this group yet.")}</div>`
      : html`<ul
          class="nr-dashboard-group-card__list"
          style=${{
            rowGap: `${sizes.cy}px`,
            columnGap: `${sizes.cx}px`,
            padding: "0 12px 12px 12px",
          }}
        >
          ${items.map((control, ctrlIdx) => html`<li
                class="nr-dashboard-group-card__item"
                key=${(control as { id?: string | number })?.id ?? ctrlIdx}
                style=${{
                  padding: `${Math.max(0, padding.y - 4)}px ${Math.max(0, padding.x - 2)}px`,
                }}
              >
                <${WidgetRenderer}
                  control=${control}
                  index=${ctrlIdx}
                  onEmit=${onEmit}
                />
              </li>`)}
        </ul>`}
  </section>`;
}
