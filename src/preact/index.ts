import { render, type VNode } from "preact";
import { html } from "htm/preact";
import { useEffect, useRef } from "preact/hooks";
import type { DashboardActions, DashboardState, UiGroup, UiMenuItem, UiTheme } from "./state";
import { useDashboardState } from "./state";
import { TabNav } from "./components/layout/TabNav";
import { GroupGrid } from "./components/layout/GroupGrid";
import { useLayoutAnnouncements } from "./components/layout/utils";
import { ToastOverlay } from "./components/ToastOverlay";
import { SizesProvider, useSizes } from "./hooks/useSizes";

export { groupColumnSpan } from "./components/layout/utils";
export { resolveSizes, applySizesToRoot } from "./lib/sizes";
export type { ConnectionState } from "./state";

const themeVarMap: Record<string, string> = {
  "page-backgroundColor": "--nr-dashboard-pageBackgroundColor",
  "page-textColor": "--nr-dashboard-pageTextColor",
  "page-titlebar-backgroundColor": "--nr-dashboard-titlebarBackgroundColor",
  "page-sidebar-backgroundColor": "--nr-dashboard-sidebarBackgroundColor",
  "page-sidebarTextColor": "--nr-dashboard-sidebarTextColor",
  "group-backgroundColor": "--nr-dashboard-groupBackgroundColor",
  "group-textColor": "--nr-dashboard-groupTextColor",
  "group-borderColor": "--nr-dashboard-groupBorderColor",
  "widget-color": "--nr-dashboard-widgetColor",
  "widget-textColor": "--nr-dashboard-widgetTextColor",
  "widget-backgroundColor": "--nr-dashboard-widgetBackgroundColor",
  "widget-borderColor": "--nr-dashboard-widgetBorderColor",
  "base-color": "--nr-dashboard-baseColor",
};

const appStyles: Record<string, string> = {
  fontFamily: "'Inter', system-ui, sans-serif",
  background: "var(--nr-dashboard-pageBackgroundColor, #0f1115)",
  color: "var(--nr-dashboard-pageTextColor, var(--nr-dashboard-widgetTextColor, #e9ecf1))",
  minHeight: "100vh",
  display: "grid",
  gridTemplateRows: "56px 1fr",
};

const toolbarStyles: Record<string, string> = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "0 16px",
  borderBottom: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.08))",
};

const layoutStyles: Record<string, string> = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  minHeight: "calc(100vh - 56px)",
};

const navStyles: Record<string, string> = {
  borderRight: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.08))",
  padding: "16px",
  color: "var(--nr-dashboard-sidebarTextColor, inherit)",
};

const contentStyles: Record<string, string> = {
  padding: "16px",
};

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

export function shouldShowLoading(connection: DashboardState["connection"]): boolean {
  return connection !== "ready";
}

export function findFirstFocusable(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  const selector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
  const candidate = root.querySelector<HTMLElement>(selector);
  return candidate ?? root;
}

export function App(): VNode {
  const { state, selectedTab, actions } = useDashboardState();
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

  return html`<${SizesProvider} site=${state.site} tabId=${tabId}>
    <${DashboardShell}
      state=${state}
      selectedTab=${selectedTab}
      tabId=${tabId}
      actions=${actions}
    />
    <${ToastOverlay} toasts=${state.toasts} onDismiss=${actions.dismissToast} />
  </${SizesProvider}>`;
}

type DashboardShellProps = {
  state: DashboardState;
  selectedTab: UiMenuItem | null;
  tabId: string | number | undefined;
  actions: DashboardActions;
};

function DashboardShell({ state, selectedTab, tabId, actions }: DashboardShellProps): VNode {
  const sizes = useSizes();
  const mainRef = useRef<HTMLElement | null>(null);
  useLayoutAnnouncements(selectedTab?.items ?? [], sizes, tabId);

  useEffect(() => {
    if (state.connection !== "ready") return;
    const target = findFirstFocusable(mainRef.current);
    if (target && typeof target.focus === "function") {
      const focusOptions: { preventScroll?: boolean } = { preventScroll: true };
      target.focus(focusOptions);
    }
  }, [selectedTab, state.connection]);

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
      ${shouldShowLoading(state.connection)
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
        <main ref=${mainRef} style=${contentStyles} tabIndex=${-1}>
          ${shouldShowLoading(state.connection)
            ? html`<${LoadingSkeleton} columns=${sizes.columns} />`
            : state.menu.length === 0
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
                    cx: sizes.cx,
                    dense:
                      Boolean(
                        ((state.site as { sizes?: { dense?: boolean } } | null)?.sizes?.dense ??
                          (state.site as { layout?: { dense?: boolean } } | null)?.layout?.dense ??
                          false),
                      ),
                  }}
                  onEmit=${actions.emit ?? undefined}
                  tabName=${selectedTab.header ?? selectedTab.name ?? ""}
                />`;
              })()}
        </main>
      </section>
    </div>
  `;
}

function LoadingSkeleton({ columns }: { columns: number }): VNode {
  const cards = Array.from({ length: Math.max(3, Math.min(columns, 6)) });
  return html`<div
    style=${{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "12px",
    }}
  >
    ${cards.map(
      (_v, idx) => html`<div
        key=${idx}
        style=${{
          minHeight: "140px",
          borderRadius: "10px",
          background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
          backgroundSize: "200% 100%",
          animation: "nr-dashboard-skeleton 1.2s ease-in-out infinite",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      ></div>`,
    )}
  </div>`;
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
