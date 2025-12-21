import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiGroup } from "../../state";
import { groupColumnSpan } from "./utils";
import { ensureLayoutStyles } from "./layout-styles";
import { GroupCard } from "./GroupCard";

export function GroupGrid(props: {
  groups: UiGroup[];
  sizes: { columns: number; gx: number; gy: number; px: number; py: number; cy: number };
  onEmit?: (event: string, msg?: Record<string, unknown>) => void;
}): VNode {
  const { groups, sizes, onEmit } = props;
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
  };

  return html`<div style=${gridStyles}>
    ${visible.map((group, idx) => {
      const span = groupColumnSpan(group, sizes.columns);
      return html`<${GroupCard}
        key=${group.header?.id ?? idx}
        group=${group}
        index=${idx}
        columnSpan=${span}
        padding=${{ x: sizes.px + 12, y: sizes.py + 12 }}
        sizes=${{ cy: sizes.cy }}
        onEmit=${onEmit}
      />`;
    })}
  </div>`;
}
