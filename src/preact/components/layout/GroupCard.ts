import { html } from "htm/preact";
import type { VNode } from "preact";
import { useCallback, useMemo, useState } from "preact/hooks";
import type { UiControl, UiGroup } from "../../state";
import { WidgetRenderer } from "../widget-renderer";
import { useI18n } from "../../lib/i18n";

export function GroupCard(props: {
  group: UiGroup;
  index: number;
  columnSpan: number;
  padding: { x: number; y: number };
  sizes: { cy: number; cx: number; sy?: number };
  onEmit?: (event: string, msg?: Record<string, unknown>) => void;
  tabName?: string;
  layoutMode?: "grid" | "masonry";
  layoutPos?: { left: number; top: number; width: number };
}): VNode {
  const { group, index, columnSpan, padding, sizes, onEmit, tabName, layoutMode = "grid", layoutPos } = props;
  const { t } = useI18n();

  const header = group.header;
  const title = header?.name || t("group_label", "Group {index}", { index: index + 1 });
  const items = (group.items ?? []) as UiControl[];
  const collapseEnabled = Boolean((header?.config as { collapse?: boolean } | undefined)?.collapse);
  // disp property controls whether the header title is displayed (defaults to true)
  const showHeader = (header?.config as { disp?: boolean } | undefined)?.disp !== false;
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

  const toggleCollapse = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    // Emit ui-collapse event for Node-RED ui_ui_control
    onEmit?.("ui-collapse", { group: groupKey, state: !next });
  }, [collapsed, groupKey, onEmit]);

  // Build style object with dynamic layout values via CSS custom properties
  const rowHeight = sizes.sy ?? 48;
  const sectionStyle: Record<string, string | undefined> = {
    "--nr-group-row-gap": `${sizes.cy}px`,
    "--nr-group-col-gap": `${sizes.cx}px`,
    "--nr-group-columns": `${columnSpan}`,
    "--nr-group-row-height": `${rowHeight}px`,
    "--nr-group-item-padding": `${Math.max(0, padding.y - 6)}px ${Math.max(0, padding.x - 4)}px`,
    gridColumn: layoutMode === "grid" ? `span ${columnSpan}` : undefined,
    padding: `${padding.y}px ${padding.x}px`,
  };

  // Masonry layout requires absolute positioning
  if (layoutMode === "masonry") {
    sectionStyle.position = "absolute";
    sectionStyle.left = `${layoutPos?.left ?? 0}px`;
    sectionStyle.top = `${layoutPos?.top ?? 0}px`;
    sectionStyle.width = `${layoutPos?.width ?? "auto"}`;
  }

  return html`<section
    class=${`nr-dashboard-group-card ${header?.config?.className ?? ""}`.trim()}
    data-grid-key=${header?.id ?? index}
    style=${sectionStyle}
  >
    ${showHeader ? html`<header
      class="nr-dashboard-group-card__header"
    >
      <span class="nr-dashboard-group-card__title">${title}</span>
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
    </header>` : null}
    ${collapsed
      ? html`<div class="nr-dashboard-group-card__message">${t("collapsed", "Collapsed")}</div>`
      : items.length === 0
      ? html`<div class="nr-dashboard-group-card__message">${t("no_widgets", "No widgets in this group yet.")}</div>`
      : html`<ul class="nr-dashboard-group-card__list">
          ${items.map((control, ctrlIdx) => {
            const ctrl = control as { id?: string | number; width?: number; height?: number };
            const colSpan = ctrl.width && ctrl.width > 0 ? ctrl.width : 1;
            const rowSpan = ctrl.height && ctrl.height > 0 ? ctrl.height : 1;
            const itemStyle: Record<string, string> = {};
            if (colSpan > 1) itemStyle.gridColumn = `span ${colSpan}`;
            if (rowSpan > 1) itemStyle.gridRow = `span ${rowSpan}`;
            return html`<li
                class="nr-dashboard-group-card__item"
                key=${ctrl.id ?? ctrlIdx}
                style=${Object.keys(itemStyle).length > 0 ? itemStyle : undefined}
              >
                <${WidgetRenderer}
                  control=${control}
                  index=${ctrlIdx}
                  onEmit=${onEmit}
                />
              </li>`;
          })}
        </ul>`}
  </section>`;
}
