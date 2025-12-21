import { useEffect } from "preact/hooks";
import type { SiteSizes } from "../../types";

export function groupColumnSpan(group: unknown, maxColumns: number): number {
  const width = (group as { header?: { config?: { width?: number | string } } })?.header?.config?.width;
  const span = coerceNumber(width, maxColumns || 1);
  const capped = Math.max(1, Math.min(maxColumns || 1, span));
  return Number.isFinite(capped) ? capped : 1;
}

export function useLayoutAnnouncements(groups: unknown[], sizes: SiteSizes, tabId: string | number | undefined): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const detail = { tabId, groupCount: groups.length, sizes };
    window.dispatchEvent(new CustomEvent("dashboard:layout", { detail }));
    window.dispatchEvent(new Event("resize"));
  }, [
    tabId,
    groups.length,
    sizes.columns,
    sizes.gx,
    sizes.gy,
    sizes.px,
    sizes.py,
    sizes.cx,
    sizes.cy,
    sizes.sx,
    sizes.sy,
    sizes.dense,
  ]);
}

function coerceNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
