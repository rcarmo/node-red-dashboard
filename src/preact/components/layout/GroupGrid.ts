import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiGroup } from "../../state";
import type { SiteSizes } from "../../types";
import { groupColumnSpan } from "./utils";
import { ensureLayoutStyles } from "./layout-styles";
import { GroupCard } from "./GroupCard";

export function GroupGrid(props: {
  groups: UiGroup[];
  sizes: Pick<SiteSizes, "columns" | "gx" | "gy" | "px" | "py" | "cy" | "cx" | "dense">;
  onEmit?: (event: string, msg?: Record<string, unknown>) => void;
  tabName?: string;
}): VNode {
  const { groups, sizes, onEmit, tabName } = props;
  ensureLayoutStyles();

  const visible = groups.filter((group) => {
    const hidden = Boolean((group.header as { config?: { hidden?: boolean } } | undefined)?.config?.hidden);
    return !hidden;
  });

  if (visible.length === 0) {
    return html`<div style=${{ opacity: 0.7 }}>No groups in this tab yet.</div>`;
  }

  const gridStyles: Record<string, string> = {
    display: "grid",
    gridTemplateColumns: `repeat(${sizes.columns}, minmax(0, 1fr))`,
    columnGap: `${sizes.gx}px`,
    rowGap: `${sizes.gy}px`,
    alignContent: "start",
    gridAutoFlow: sizes.dense ? "dense" : "row",
  };

  return html`<div style=${gridStyles}>
    ${visible.map((group, idx) => {
      const span = groupColumnSpan(group, sizes.columns);
      const paddingX = Math.max(0, sizes.px);
      const paddingY = Math.max(0, sizes.py);
      const itemGapY = Math.max(0, sizes.cy);
      const itemGapX = Math.max(0, sizes.cx);
      return html`<${GroupCard}
        key=${group.header?.id ?? idx}
        group=${group}
        index=${idx}
        columnSpan=${span}
        padding=${{ x: paddingX, y: paddingY }}
        sizes=${{ cy: itemGapY, cx: itemGapX }}
        onEmit=${onEmit}
        tabName=${tabName}
      />`;
    })}
  </div>`;
}
