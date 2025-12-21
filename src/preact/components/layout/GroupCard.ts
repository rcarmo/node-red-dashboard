import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl, UiGroup } from "../../state";
import { WidgetRenderer } from "../widget-renderer";
import { ensureLayoutStyles } from "./layout-styles";

export function GroupCard(props: {
  group: UiGroup;
  index: number;
  columnSpan: number;
  padding: { x: number; y: number };
  sizes: { cy: number; cx: number };
  onEmit?: (event: string, msg?: Record<string, unknown>) => void;
}): VNode {
  const { group, index, columnSpan, padding, sizes, onEmit } = props;
  ensureLayoutStyles();

  const header = group.header;
  const title = header?.name || `Group ${index + 1}`;
  const items = (group.items ?? []) as UiControl[];

  return html`<section
    class="nr-dashboard-group-card"
    style=${{
      gridColumn: `span ${columnSpan}`,
      padding: `${padding.y}px ${padding.x}px`,
    }}
  >
    <header class="nr-dashboard-group-card__header">${title}</header>
    <div class="nr-dashboard-group-card__meta">${items.length} widget${items.length === 1 ? "" : "s"}</div>
    ${items.length === 0
      ? html`<div style=${{ opacity: 0.6, fontSize: "12px" }}>No widgets in this group yet.</div>`
      : html`<ul
          class="nr-dashboard-group-card__list"
          style=${{
            rowGap: `${sizes.cy}px`,
            columnGap: `${sizes.cx}px`,
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
