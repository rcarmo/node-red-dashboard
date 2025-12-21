import { render, type VNode } from "preact";
import { html } from "htm/preact";
import { useEffect, useMemo } from "preact/hooks";
import { useDashboardState } from "./state";
import type { UiGroup, UiMenuItem, UiTheme } from "./state";
import { TabNav } from "./components/layout/TabNav";
import { GroupGrid } from "./components/layout/GroupGrid";
import { useLayoutAnnouncements } from "./components/layout/utils";

export type SiteSizes = {
  sx: number;
  sy: number;
  gx: number;
  gy: number;
  cx: number;
  cy: number;
  px: number;
  py: number;
  columns: number;
};

export { groupColumnSpan } from "./components/layout/utils";

const themeVarMap: Record<string, string> = {
  "page-backgroundColor": "--nr-dashboard-pageBackgroundColor",
  "page-titlebar-backgroundColor": "--nr-dashboard-titlebarBackgroundColor",
  "page-sidebar-backgroundColor": "--nr-dashboard-sidebarBackgroundColor",
  "group-backgroundColor": "--nr-dashboard-groupBackgroundColor",
  "group-textColor": "--nr-dashboard-groupTextColor",
  "group-borderColor": "--nr-dashboard-groupBorderColor",
  "widget-textColor": "--nr-dashboard-widgetTextColor",
  "widget-backgroundColor": "--nr-dashboard-widgetBackgroundColor",
  "widget-borderColor": "--nr-dashboard-widgetBorderColor",
  "base-color": "--nr-dashboard-baseColor",
};

const appStyles: Record<string, string> = {
  fontFamily: "'Inter', system-ui, sans-serif",
  background: "var(--nr-dashboard-pageBackgroundColor, #0f1115)",
  color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
  minHeight: "100vh",
  display: "grid",
  gridTemplateRows: "56px 1fr",
};

const toolbarStyles: Record<string, string> = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "0 16px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const layoutStyles: Record<string, string> = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  minHeight: "calc(100vh - 56px)",
};

const navStyles: Record<string, string> = {
  borderRight: "1px solid rgba(255,255,255,0.08)",
  padding: "16px",
};

const contentStyles: Record<string, string> = {
  padding: "16px",
};

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
  };
}

function getEffectiveTheme(tab: UiMenuItem | null, globalTheme: UiTheme | null): UiTheme | null {
  if (tab?.theme) return tab.theme;
  return globalTheme ?? null;
}

export function applyThemeToRoot(theme: UiTheme | null, root?: HTMLElement): void {
  if (!root && typeof document === "undefined") return;
  const target = root ?? document.documentElement;

  if (!theme?.themeState) {
    Object.values(themeVarMap).forEach((cssVar) => {
      target.style.removeProperty(cssVar);
    });
    return;
  }

  Object.entries(themeVarMap).forEach(([key, cssVar]) => {
    const value = theme.themeState?.[key]?.value;
    if (typeof value === "string" && value.length > 0) {
      target.style.setProperty(cssVar, value);
    } else {
      target.style.removeProperty(cssVar);
    }
  });
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

export function App(): VNode {
  const { state, selectedTab, actions } = useDashboardState();
  const sizes = useMemo(() => resolveSizes(state.site), [state.site]);
  const tabId = selectedTab?.id ?? selectedTab?.header;

  // Hash-based routing to mirror legacy /<tabIndex>
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const applyHash = () => {
      const match = window.location.hash.match(/#\/(\d+)/);
      if (!match) return;
      const idx = Number(match[1]);
      if (!Number.isNaN(idx) && idx >= 0 && idx < state.menu.length) {
        actions.selectTab(idx);
      }
    };

    window.addEventListener("hashchange", applyHash);
    applyHash();
    return () => window.removeEventListener("hashchange", applyHash);
  }, [state.menu.length]);

  // Apply theme variables whenever selection or global theme changes
  useEffect(() => {
    const theme = getEffectiveTheme(selectedTab, state.theme);
    applyThemeToRoot(theme);
  }, [selectedTab, state.theme]);

  // Expose sizing tokens as CSS custom properties for layout and future widgets
  useEffect(() => {
    applySizesToRoot(sizes);
  }, [sizes]);

  useLayoutAnnouncements(selectedTab?.items ?? [], sizes, tabId);

  const statusLabel = (() => {
    switch (state.connection) {
      case "ready":
        return "Connected";
      case "connecting":
        return "Connecting";
      default:
        return "Disconnected";
    }
  })();

  return html`
    <div style=${appStyles}>
      ${state.connection !== "ready"
        ? html`<div style=${{
              padding: "12px 16px",
              background: "rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              fontSize: "13px",
            }}>
            Loading dashboard…
          </div>`
        : null}
      <header style=${toolbarStyles}>
        <strong>Node-RED Dashboard v2</strong>
        <span style=${{ fontSize: "12px", opacity: 0.7 }}>Socket: ${statusLabel}${state.socketId ? ` (${state.socketId})` : ""}</span>
      </header>
      <section style=${layoutStyles}>
        <nav style=${navStyles}>
          <h3 style=${{ marginTop: 0 }}>Tabs</h3>
          <${TabNav}
            menu=${state.menu}
            selectedIndex=${state.selectedTabIndex}
            onSelect=${(idx: number) => {
              if (typeof window !== "undefined") {
                window.location.hash = `#/${idx}`;
              }
              actions.selectTab(idx);
            }}
          />
        </nav>
        <main style=${contentStyles}>
          ${state.menu.length === 0
            ? html`<div style=${{ textAlign: "center", opacity: 0.7, padding: "32px" }}>
                <p style=${{ margin: "0 0 8px" }}>No tabs defined yet.</p>
                <p style=${{ margin: 0 }}>Add UI nodes in Node-RED and deploy to see them here.</p>
              </div>`
            : (() => {
                if (!selectedTab) {
                  return html`<div style=${{ opacity: 0.7 }}>Select a tab to view its content.</div>`;
                }

                if (selectedTab.link) {
                  return html`<div style=${{ height: "100%", minHeight: "320px" }}>
                    <iframe
                      src=${selectedTab.link}
                      style=${{
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px",
                        width: "100%",
                        height: "80vh",
                        background: "#0b0d11",
                      }}
                      allowfullscreen
                    ></iframe>
                  </div>`;
                }

                return html`<${GroupGrid}
                  groups=${(selectedTab.items ?? []) as unknown as UiGroup[]}
                  sizes=${{
                    columns: sizes.columns,
                    gx: sizes.gx,
                    gy: sizes.gy,
                    px: sizes.px,
                    py: sizes.py,
                    cy: sizes.cy,
                  }}
                  onEmit=${actions.emit ?? undefined}
                />`;
              })()}
        </main>
      </section>
    </div>
  `;
}

export function bootstrap(): void {
  if (typeof document === "undefined") return;

  const root = document.getElementById("app") ?? (() => {
    const el = document.createElement("div");
    el.id = "app";
    document.body.appendChild(el);
    return el;
  })();

  render(html`<${App} />`, root);
}

bootstrap();
