import { html } from "htm/preact";
import type { VNode } from "preact";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import type { UiGroup } from "../../state";
import type { SiteSizes } from "../../types";
import { groupColumnSpan } from "./utils";
import { ensureLayoutStyles } from "./layout-styles";
import { GroupCard } from "./GroupCard";
import { useI18n } from "../../lib/i18n";

export function GroupGrid(props: {
  groups: UiGroup[];
  sizes: Pick<SiteSizes, "columns" | "gx" | "gy" | "px" | "py" | "cy" | "cx" | "dense" | "sx" | "layoutMode">;
  onEmit?: (event: string, msg?: Record<string, unknown>) => void;
  tabName?: string;
}): VNode {
  const { groups, sizes, onEmit, tabName } = props;
  ensureLayoutStyles();
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [positions, setPositions] = useState<Record<string | number, { left: number; top: number; width: number }>>({});
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);

  const layoutMode: "grid" | "masonry" = sizes.layoutMode === "masonry" ? "masonry" : "grid";

  const visible = groups.filter((group) => {
    const hidden = Boolean((group.header as { config?: { hidden?: boolean } } | undefined)?.config?.hidden);
    return !hidden;
  });

  if (visible.length === 0) {
    return html`<div class="nr-dashboard-empty-message">${t("no_groups", "No groups in this tab yet.")}</div>`;
  }

  const gridStyles: Record<string, string> = layoutMode === "masonry"
    ? {
        position: "relative",
        minHeight: containerHeight ? `${containerHeight}px` : undefined,
      }
    : {
        display: "grid",
        gridTemplateColumns: `repeat(${sizes.columns}, minmax(0, 1fr))`,
        columnGap: `${sizes.gx}px`,
        rowGap: `${sizes.gy}px`,
        alignContent: "start",
        justifyContent: "center",
        gridAutoFlow: sizes.dense ? "dense" : "row",
      };

  const calcWidth = (span: number): number => {
    const cols = Math.max(1, span);
    return cols * sizes.sx + sizes.px * 2 + (cols - 1) * sizes.gx;
  };

  useLayoutEffect(() => {
    if (layoutMode !== "masonry") {
      setPositions({});
      setContainerHeight(undefined);
      return;
    }
    let cancelled = false;

    const computeLayout = () => {
      if (cancelled) return;
      const root = containerRef.current;
      if (!root) return;
      const children = Array.from(root.children) as HTMLElement[];
      if (children.length === 0) return;

      const availableWidth = Math.max(0, root.clientWidth - sizes.gx * 2);
      type Block = { x: number; y: number; w: number; h: number; used?: boolean; group?: HTMLElement; assigned?: boolean };
      const blocks: Block[] = [{ x: 0, y: sizes.gy, w: availableWidth, h: Infinity, used: false }];
      const assigned: Block[] = [];
      const blockCache: Record<string, Block> = { [`0:${sizes.gy}`]: blocks[0] };

      const blockSort = (b1: Block, b2: Block) => {
        if (b1.y < b2.y) return -1;
        if (b1.y > b2.y) return 1;
        return b1.x - b2.x;
      };

      const intersect = (r1: Block, r2: Block) => {
        return !(r2.x > r1.x || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
      };

      children.forEach((child) => {
        const cw = child.offsetWidth;
        const ch = child.offsetHeight;
        let added = false;
        let blockCacheKey = "";
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i];
          if (!b.used && cw <= b.w && ch <= b.h) {
            let clear = true;
            for (let j = 0; j < assigned.length; j++) {
              const b2 = assigned[j];
              if (intersect(b, b2)) {
                blockCacheKey = `${b.x}:${b2.y + b2.h + sizes.gy}`;
                if (!blockCache[blockCacheKey]) {
                  blocks.push({ x: b.x, y: b2.y + b2.h + sizes.gy, w: b.w, h: b.h, used: false });
                  blockCache[blockCacheKey] = blocks[blocks.length - 1];
                  blocks.sort(blockSort);
                }
                clear = false;
                break;
              }
            }
            if (!clear) continue;
            b.used = true;
            b.group = child;
            b.assigned = true;
            assigned.push(b);
            added = true;

            clear = true;
            const rightBlock: Block = { x: b.x + cw + sizes.gx, y: b.y, w: b.w - sizes.gx - cw, h: b.h, used: false };
            blockCacheKey = `${b.x + cw + sizes.gx}:${b.y}`;
            if (!blockCache[blockCacheKey]) {
              for (let j = 0; j < assigned.length; j++) {
                const b3 = assigned[j];
                if (b3 !== b && b3.x <= rightBlock.x && b3.x + b3.w >= rightBlock.x && b3.y <= rightBlock.y && b3.y + b3.h >= rightBlock.y) {
                  clear = false;
                  break;
                }
              }
              if (clear) {
                blockCache[blockCacheKey] = rightBlock;
                blocks.push(rightBlock);
              }
            }

            blockCacheKey = `${b.x}:${b.y + ch + sizes.gy}`;
            if (!blockCache[blockCacheKey]) {
              blocks.push({ x: b.x, y: b.y + ch + sizes.gy, w: b.w, h: b.h, used: false });
              blockCache[blockCacheKey] = blocks[blocks.length - 1];
            }
            b.w = cw;
            b.h = ch;
            break;
          }
        }

        if (!added) {
          let maxy = 0;
          assigned.forEach((b) => {
            maxy = Math.max(maxy, b.y + b.h);
          });
          let bottomBlock = blockCache[`0:${maxy + sizes.gy}`];
          if (!bottomBlock) {
            bottomBlock = { x: 0, y: maxy + sizes.gy, w: cw, h: ch } as Block;
            blockCache[`0:${maxy + sizes.gy}`] = bottomBlock;
            blocks.push(bottomBlock);
          }
          bottomBlock.used = true;
          bottomBlock.group = child;
          bottomBlock.assigned = true;
          bottomBlock.w = cw;
          bottomBlock.h = ch;
          assigned.push(bottomBlock);

          blockCacheKey = `0:${bottomBlock.y + ch + sizes.gy}`;
          if (!blockCache[blockCacheKey]) {
            blocks.push({ x: 0, y: bottomBlock.y + ch + sizes.gy, w: availableWidth, h: Infinity, used: false });
            blockCache[blockCacheKey] = blocks[blocks.length - 1];
          }
        }

        blocks.sort(blockSort);
      });

      let maxx = 0;
      let maxy = 0;
      assigned.forEach((b) => {
        maxx = Math.max(maxx, b.x + b.w);
        maxy = Math.max(maxy, b.y + b.h);
      });
      const leftPadding = Math.max(0, sizes.gx + (availableWidth - maxx) / 2);
      const nextPositions: Record<string | number, { left: number; top: number; width: number }> = {};
      assigned.forEach((b, idx) => {
        const key = children[idx]?.dataset?.gridKey ?? idx;
        nextPositions[key] = { left: leftPadding + b.x, top: b.y, width: b.w };
        b.group?.classList.add("visible");
      });
      setPositions(nextPositions);
      setContainerHeight(maxy + sizes.gy + 3);
    };

    const scheduled = window.setTimeout(computeLayout, 16);
    const handleResize = () => computeLayout();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.clearTimeout(scheduled);
      window.removeEventListener("resize", handleResize);
    };
  }, [groups, sizes.columns, sizes.gx, sizes.gy, sizes.px, sizes.sx, layoutMode]);

  return html`<div style=${gridStyles} ref=${containerRef}>
    ${visible.map((group, idx) => {
      const span = groupColumnSpan(group, sizes.columns);
      const paddingX = Math.max(0, sizes.px);
      const paddingY = Math.max(0, sizes.py);
      const itemGapY = Math.max(0, sizes.cy);
      const itemGapX = Math.max(0, sizes.cx);
      const layoutKey = group.header?.id ?? idx;
      const pos = positions[layoutKey];
      const width = layoutMode === "masonry" ? calcWidth(span) : undefined;
      return html`<${GroupCard}
        key=${group.header?.id ?? idx}
        group=${group}
        index=${idx}
        columnSpan=${span}
        padding=${{ x: paddingX, y: paddingY }}
        sizes=${{ cy: itemGapY, cx: itemGapX }}
        onEmit=${onEmit}
        tabName=${tabName}
        layoutMode=${layoutMode}
        layoutPos=${layoutMode === "masonry" ? { left: pos?.left ?? 0, top: pos?.top ?? sizes.gy, width: width ?? 0 } : undefined}
      />`;
    })}
  </div>`;
}
