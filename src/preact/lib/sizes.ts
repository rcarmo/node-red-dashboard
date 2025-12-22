import type { SiteSizes } from "../types";

function coerceNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveSizes(site: unknown): SiteSizes {
  const base: SiteSizes = {
    sx: 48,
    sy: 48,
    gx: 6,
    gy: 6,
    cx: 6,
    cy: 6,
    px: 0,
    py: 0,
    columns: 24,
    dense: false,
    layoutMode: "grid",
  };

  if (typeof window !== "undefined" && window.innerWidth < 350) {
    base.sx = 42;
    base.sy = 42;
  }

  const sizes = (site as { sizes?: Partial<SiteSizes> } | null)?.sizes;
  if (!sizes) return base;

  return {
    sx: coerceNumber(sizes.sx, base.sx),
    sy: coerceNumber(sizes.sy, base.sy),
    gx: coerceNumber(sizes.gx, base.gx),
    gy: coerceNumber(sizes.gy, base.gy),
    cx: coerceNumber(sizes.cx, base.cx),
    cy: coerceNumber(sizes.cy, base.cy),
    px: coerceNumber(sizes.px, base.px),
    py: coerceNumber(sizes.py, base.py),
    columns: coerceNumber(sizes.columns, base.columns),
    dense: Boolean((sizes as { dense?: boolean }).dense ?? base.dense),
    layoutMode: (sizes as { layoutMode?: "grid" | "masonry" }).layoutMode || base.layoutMode,
  };
}

export function applySizesToRoot(sizes: SiteSizes, root?: HTMLElement): void {
  if (!root && typeof document === "undefined") return;
  const target = root ?? document.documentElement;
  const entries: Array<[string, string]> = [
    ["--nr-dashboard-sx", `${sizes.sx}`],
    ["--nr-dashboard-sy", `${sizes.sy}`],
    ["--nr-dashboard-gx", `${sizes.gx}`],
    ["--nr-dashboard-gy", `${sizes.gy}`],
    ["--nr-dashboard-cx", `${sizes.cx}`],
    ["--nr-dashboard-cy", `${sizes.cy}`],
    ["--nr-dashboard-px", `${sizes.px}`],
    ["--nr-dashboard-py", `${sizes.py}`],
    ["--nr-dashboard-columns", `${sizes.columns}`],
  ];
  entries.forEach(([k, v]) => target.style.setProperty(k, v));
}
