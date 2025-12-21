import { render, type VNode } from "preact";
import { html } from "htm/preact";
import { useEffect, useMemo } from "preact/hooks";
import { useDashboardState } from "./state";
import type { UiMenuItem, UiTheme } from "./state";
import { WidgetRenderer } from "./components/widget-renderer";

type SiteSizes = {
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

export function groupColumnSpan(group: unknown, maxColumns: number): number {
  const width =
    (group as { header?: { config?: { width?: number | string } } })?.header?.config
      ?.width;
  const span = coerceNumber(width, maxColumns || 1);
  const capped = Math.max(1, Math.min(maxColumns || 1, span));
  return Number.isFinite(capped) ? capped : 1;
}

function useLayoutAnnouncements(groups: unknown[], sizes: SiteSizes, tabId: string | number | undefined): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const detail = { tabId, groupCount: groups.length, sizes };
    window.dispatchEvent(new CustomEvent("dashboard:layout", { detail }));
    // Align with legacy behavior where widgets recompute sizes on resize
    window.dispatchEvent(new Event("resize"));
  }, [groups, sizes, tabId]);
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
          <ul style=${{ listStyle: "none", padding: 0, margin: 0, opacity: 0.9 }}>
            ${state.menu.length === 0
              ? html`<li style=${{ opacity: 0.6 }}>No tabs yet</li>`
              : state.menu.map((tab, idx) => {
                  const active = idx === state.selectedTabIndex;
                  return html`<li key=${tab.id ?? tab.header ?? idx}>
                    <button
                      style=${{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        marginBottom: "6px",
                        borderRadius: "6px",
                        border: active
                          ? "1px solid rgba(255,255,255,0.35)"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: active
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.04)",
                        color: "inherit",
                        cursor: "pointer",
                        opacity: tab.disabled || tab.hidden ? 0.4 : 1,
                      }}
                      disabled=${tab.disabled || tab.hidden}
                      onClick=${() => {
                        if (typeof window !== "undefined") {
                          window.location.hash = `#/${idx}`;
                        }
                        actions.selectTab(idx);
                      }}
                    >
                      ${tab.header || tab.name || `Tab ${idx + 1}`}
                    </button>
                  </li>`;
                })}
          </ul>
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

                const gridStyles: Record<string, string> = {
                  display: "grid",
                  gridTemplateColumns: `repeat(${sizes.columns}, minmax(0, 1fr))`,
                  columnGap: `${sizes.gx}px`,
                  rowGap: `${sizes.gy}px`,
                  alignContent: "start",
                };

                const groups = (selectedTab.items ?? []).filter((group) => {
                  const hidden = Boolean(
                    (group as { header?: { config?: { hidden?: boolean } } })?.header?.config
                      ?.hidden,
                  );
                  return !hidden;
                });

                if (groups.length === 0) {
                  return html`<div style=${{ opacity: 0.7 }}>No groups in this tab yet.</div>`;
                }

                return html`<div style=${gridStyles}>
                  ${groups.map((group, groupIdx) => {
                    const span = groupColumnSpan(group, sizes.columns);
                    const cardStyles: Record<string, string> = {
                      gridColumn: `span ${span}`,
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      padding: `${sizes.py + 12}px ${sizes.px + 12}px`,
                      background: "rgba(255,255,255,0.03)",
                      minHeight: `${sizes.sy * 2}px`,
                    };
                    const header = (group as { header?: { name?: string; id?: string | number } }).header;
                    const title = header?.name || `Group ${groupIdx + 1}`;
                    const items = (group as { items?: unknown[] }).items ?? [];

                    return html`<section key=${header?.id ?? title} style=${cardStyles}>
                      <header style=${{ fontWeight: 600, marginBottom: "8px" }}>${title}</header>
                      <div style=${{ opacity: 0.8, fontSize: "13px", marginBottom: "8px" }}>
                        ${items.length} widget${items.length === 1 ? "" : "s"}
                      </div>
                      ${items.length === 0
                        ? html`<div style=${{ opacity: 0.6, fontSize: "12px" }}>
                            No widgets in this group yet.
                          </div>`
                        : html`<ul style=${{
                              listStyle: "none",
                              margin: 0,
                              padding: 0,
                              display: "grid",
                              gap: `${sizes.cy}px`,
                            }}>
                            ${items.map((control, ctrlIdx) => html`<li
                                  key=${(control as { id?: string | number })?.id ?? ctrlIdx}
                                  style=${{
                                    border: "1px dashed rgba(255,255,255,0.14)",
                                    borderRadius: "8px",
                                    padding: `${sizes.py + 8}px ${sizes.px + 10}px`,
                                    background: "rgba(255,255,255,0.02)",
                                    fontSize: "12px",
                                    opacity: 0.9,
                                  }}
                                >
                                  <${WidgetRenderer}
                                    control=${control}
                                    index=${ctrlIdx}
                                    onEmit=${actions.emit ?? undefined}
                                  />
                                </li>`)}
                          </ul>`}
                    </section>`;
                  })}
                </div>`;
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
