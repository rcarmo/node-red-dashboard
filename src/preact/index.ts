import { render, type VNode } from "preact";
import { html } from "htm/preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { ConnectionState, DashboardActions, DashboardState, UiGroup, UiMenuItem, UiTheme } from "./state";
import { useDashboardState } from "./state";
import { TabNav } from "./components/layout/TabNav";
import { GroupGrid } from "./components/layout/GroupGrid";
import { useLayoutAnnouncements } from "./components/layout/utils";
import { ensureLayoutStyles } from "./components/layout/layout-styles";
import { ToastOverlay } from "./components/ToastOverlay";
import { SizesProvider, useSizes } from "./hooks/useSizes";
import { I18nProvider, hydrateLocales, useI18n } from "./lib/i18n";

export { groupColumnSpan } from "./components/layout/utils";
export { resolveSizes, applySizesToRoot } from "./lib/sizes";
export type { ConnectionState } from "./state";

export function resolveLanguage(
  stateLang: string | null | undefined,
  site: { lang?: string; locale?: string } | null,
  navigatorLang?: string,
): string {
  const fromState = stateLang;
  const fromSite = site?.lang ?? site?.locale;
  const candidate = fromState ?? fromSite ?? navigatorLang ?? "en";
  if (typeof candidate !== "string" || candidate.length === 0) return "en";
  return candidate;
}

export function shouldShowLoading(connection: ConnectionState | undefined): boolean {
  return connection !== "ready";
}

export function findFirstFocusable(root: HTMLElement | null | undefined): HTMLElement | null {
  if (!root) return null;
  const selector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
  const candidate = typeof root.querySelector === "function" ? (root.querySelector(selector) as HTMLElement | null) : null;
  return candidate ?? root;
}

const themeVarMap: Record<string, string> = {
  "page-backgroundColor": "--nr-dashboard-pageBackgroundColor",
  "page-textColor": "--nr-dashboard-pageTextColor",
  "page-titlebar-backgroundColor": "--nr-dashboard-pageTitlebarBackgroundColor",
  "page-sidebarBackgroundColor": "--nr-dashboard-pageSidebarBackgroundColor",
  "page-sidebarTextColor": "--nr-dashboard-pageSidebarTextColor",
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
  fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif",
  background: "var(--nr-dashboard-pageBackgroundColor, #eee)",
  color: "var(--nr-dashboard-pageTextColor, var(--nr-dashboard-widgetTextColor, #000))",
  minHeight: "100vh",
  display: "grid",
};

const toolbarStyles: Record<string, string> = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "0 16px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
  borderBottom: "none",
  background: "var(--nr-dashboard-pageTitlebarBackgroundColor, #0094CE)",
  color: "#fff",
  fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif",
  fontWeight: "400",
  fontSize: "18px",
  lineHeight: "24px",
};

const iconButtonStyles: Record<string, string> = {
  border: "none",
  background: "transparent",
  color: "inherit",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  display: "inline-grid",
  placeItems: "center",
  cursor: "pointer",
  transition: "background 120ms ease, color 120ms ease, transform 140ms ease",
  position: "relative",
  overflow: "hidden",
};

const floatingToggleStyles: Record<string, string> = {
  position: "fixed",
  top: "12px",
  left: "12px",
  zIndex: "20",
  border: "none",
  background: "var(--nr-dashboard-widgetBackgroundColor, rgba(0,0,0,0.06))",
  color: "inherit",
  borderRadius: "50%",
  padding: "10px 12px",
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(0,0,0,0.20)",
  transition: "background 140ms ease, box-shadow 140ms ease",
};

const layoutStyles: Record<string, string> = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  minHeight: "100vh",
  position: "relative",
};

const navStyles: Record<string, string> = {
  borderRight: "1px solid var(--nr-dashboard-sidebarBorderColor, var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.12)))",
  padding: "0 0 8px 0",
  color: "var(--nr-dashboard-pageSidebarTextColor, var(--nr-dashboard-groupTextColor, #00A4DE))",
  background: "var(--nr-dashboard-pageSidebarBackgroundColor, #eee)",
  overflowY: "auto",
};

const contentStyles: Record<string, string> = {
  padding: "0",
  background: "var(--nr-dashboard-pageBackgroundColor, #eee)",
};

function getEffectiveTheme(tab: UiMenuItem | null, globalTheme: UiTheme | null): UiTheme | null {
  if (tab?.theme) return tab.theme;
  return globalTheme ?? null;
}

type Rgb = { r: number; g: number; b: number };

function parseColor(value: string | undefined): Rgb | null {
  if (!value) return null;
  const trimmed = value.trim();

  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      const [r, g, b] = hex.split("");
      return {
        r: parseInt(r + r, 16),
        g: parseInt(g + g, 16),
        b: parseInt(b + b, 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  const rgbMatch = trimmed.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((p) => Number(p.trim()));
    if (parts.length >= 3 && parts.every((n) => Number.isFinite(n))) {
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
  }

  return null;
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const n = v / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  const rl = channel(r);
  const gl = channel(g);
  const bl = channel(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function getDashboardRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById("nr-dashboard-root") ?? document.getElementById("app") ?? document.documentElement;
}

export function applyThemeToRoot(theme: UiTheme | null, root?: HTMLElement): void {
  if (!root && typeof document === "undefined") return;
  const target = root ?? getDashboardRoot();
  if (!target) return;

  if (!theme?.themeState) {
    Object.values(themeVarMap).forEach((cssVar) => {
      target.style.removeProperty(cssVar);
    });
    return;
  }

  const backgroundValue = theme.themeState?.["page-backgroundColor"]?.value;
  const textValue = theme.themeState?.["page-textColor"]?.value;

  Object.entries(themeVarMap).forEach(([key, cssVar]) => {
    const value = theme.themeState?.[key]?.value;
    if (typeof value === "string" && value.length > 0) {
      target.style.setProperty(cssVar, value);
    } else {
      target.style.removeProperty(cssVar);
    }
  });

  // If the theme only sets a background, derive a readable text color for contrast.
  if (!textValue && typeof backgroundValue === "string" && backgroundValue.length > 0) {
    const rgb = parseColor(backgroundValue);
    if (rgb) {
      const lum = relativeLuminance(rgb);
      const derivedText = lum > 0.6 ? "#0b0d11" : "#f4f6fb";
      target.style.setProperty("--nr-dashboard-pageTextColor", derivedText);
    }
  }
}

export function App(): VNode {
  ensureLayoutStyles();
  const { state, selectedTab, actions } = useDashboardState();
  const tabId = selectedTab?.id ?? selectedTab?.header;
  const locales = useMemo(() => state.locales ?? hydrateLocales(), [state.locales]);
  const lang = resolveLanguage(state.lang, state.site as { lang?: string; locale?: string } | null, typeof navigator !== "undefined" ? navigator.language : undefined);

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
    applyThemeToRoot(theme, getDashboardRoot() ?? undefined);
  }, [selectedTab, state.theme]);

  // Align document.title with legacy behavior (site name when locked, tab title otherwise)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const site = (state.site as { name?: string } | null) ?? null;
    const tabTitle = selectedTab?.header ?? selectedTab?.name;
    const locked = (site?.lockMenu as string | boolean | undefined) === true || (site?.lockMenu as string | undefined) === "true";
    const iconOnly = (site?.lockMenu as string | undefined) === "icon";
    const title = locked || iconOnly ? site?.name ?? "" : tabTitle ?? site?.name ?? "";
    document.title = title ?? "";
  }, [selectedTab, state.site]);

  return html`<${I18nProvider} lang=${lang} locales=${locales}>
    <${SizesProvider} site=${state.site} tabId=${tabId}>
      <${DashboardShell}
        state=${state}
        selectedTab=${selectedTab}
        tabId=${tabId}
        actions=${actions}
      />
      <${ToastOverlay} toasts=${state.toasts} onDismiss=${actions.dismissToast} />
    </${SizesProvider}>
  </${I18nProvider}>`;
}

type DashboardShellProps = {
  state: DashboardState;
  selectedTab: UiMenuItem | null;
  tabId: string | number | undefined;
  actions: DashboardActions;
};

function DashboardShell({ state, selectedTab, tabId, actions }: DashboardShellProps): VNode {
  const sizes = useSizes();
  const { t } = useI18n();
  const mainRef = useRef<HTMLElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const site = (state.site as { lockMenu?: string | boolean; allowSwipe?: string | boolean; hideToolbar?: string | boolean; name?: string } | null) ?? null;
  const lockModeRaw = site?.lockMenu;
  const lockMode = typeof lockModeRaw === "boolean" ? (lockModeRaw ? "true" : "false") : typeof lockModeRaw === "string" ? lockModeRaw : "false";
  const allowSwipeRaw = site?.allowSwipe;
  const allowSwipe = typeof allowSwipeRaw === "boolean" ? (allowSwipeRaw ? "true" : "false") : typeof allowSwipeRaw === "string" ? allowSwipeRaw : "false";
  const isLocked = lockMode === "true";
  const isIconOnly = lockMode === "icon";
  const isSlide = lockMode === "false";
  const hideToolbar = site?.hideToolbar === "true" || site?.hideToolbar === true;
  const hasMultipleTabs = state.menu.length > 1;
  const hasTabs = state.menu.length > 0;
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1280);
  const [navOpen, setNavOpen] = useState<boolean>(hasMultipleTabs && (isLocked || isIconOnly));
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toolbarHeight = viewportWidth < 960 ? "48px" : "64px";
  const navMaxWidth = viewportWidth <= 660 ? 200 : 320;
  const navMinWidth = 64;
  const navBaseWidth = isIconOnly ? 72 : navMaxWidth;
  const navWidthNum = Math.max(navMinWidth, navBaseWidth);
  const navWidth = `${navWidthNum}px`;
  const navTop = hideToolbar ? "0" : toolbarHeight;

  const shellStyles = {
    ...appStyles,
    gridTemplateRows: hideToolbar ? "1fr" : `${toolbarHeight} 1fr`,
  } satisfies Record<string, string>;

  useLayoutAnnouncements(selectedTab?.items ?? [], sizes, tabId);

  useEffect(() => {
    if (state.connection !== "ready") return;
    const target = findFirstFocusable(mainRef.current);
    if (target && typeof target.focus === "function") {
      const focusOptions: { preventScroll?: boolean } = { preventScroll: true };
      target.focus(focusOptions);
    }
  }, [selectedTab, state.connection]);

  useEffect(() => {
    if (!hasTabs) {
      setNavOpen(false);
      return;
    }
    if (!hasMultipleTabs && (isLocked || isIconOnly)) {
      setNavOpen(true);
      return;
    }
    if (hasMultipleTabs && (isLocked || isIconOnly || lockMode === "true")) {
      setNavOpen(true);
    }
  }, [hasMultipleTabs, hasTabs, isIconOnly, isLocked, lockMode]);

  useEffect(() => {
    const node = shellRef.current;
    const allowMenuSwipe = allowSwipe === "menu";
    const allowTabSwipe = allowSwipe === "true" || allowSwipe === "mouse";
    const allowMouseSwipe = allowSwipe === "mouse";
    if (!node || (!allowMenuSwipe && !allowTabSwipe)) return undefined;

    let startX = 0;
    let startY = 0;
    let activePointerId: number | null = null;

    const handlePointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      if (event.pointerType === "mouse" && !allowMouseSwipe) return;
      activePointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (activePointerId == null || event.pointerId !== activePointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      activePointerId = null;

      if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
      if (event.pointerType === "mouse" && !allowMouseSwipe) return;

      const direction = dx < 0 ? "left" : "right";

      if (allowMenuSwipe && !isLocked && !isIconOnly) {
        setNavOpen(direction === "right");
        return;
      }

      if (allowTabSwipe) {
        const delta = direction === "left" ? -1 : 1;
        const next = findNextTabIndex(state.menu, state.selectedTabIndex ?? 0, delta);
        if (next != null) {
          if (typeof window !== "undefined") {
            window.location.hash = `#/${next}`;
          }
          actions.selectTab(next);
        }
      }
    };

    node.addEventListener("pointerdown", handlePointerDown, { passive: true });
    node.addEventListener("pointerup", handlePointerUp, { passive: true });

    return () => {
      node.removeEventListener("pointerdown", handlePointerDown);
      node.removeEventListener("pointerup", handlePointerUp);
    };
  }, [actions, allowSwipe, isIconOnly, isLocked, state.menu, state.selectedTabIndex]);

  const statusLabel = (() => {
    switch (state.connection) {
      case "ready":
        return t("status_connected", "Connected");
      case "connecting":
        return t("status_connecting", "Connecting");
      default:
        return t("status_disconnected", "Disconnected");
    }
  })();

  const toolbarTitle = (() => {
    const tabTitle = selectedTab?.header ?? selectedTab?.name;
    const siteTitle = site?.name;
    // Legacy: when menu locked, show site title; otherwise show tab header (or site fallback)
    if (isLocked || isIconOnly) {
      return siteTitle ?? "";
    }
    return tabTitle ?? siteTitle ?? "";
  })();

  const shouldRenderNav = hasTabs && (navOpen || isLocked || isIconOnly);
  const gridTemplateColumns = isLocked || isIconOnly ? `${isIconOnly ? "72px" : `${navMaxWidth}px`} 1fr` : "1fr";
  const sectionMinHeight = "100vh";
  const showToggle = isSlide && hasTabs;
  const showFloatingToggle = isSlide && hasTabs && hideToolbar;

  return html`
    <div style=${shellStyles} ref=${shellRef}>
      ${hideToolbar
        ? null
        : html`<header style=${toolbarStyles}>
            ${showToggle
              ? html`<button
                  type="button"
                  aria-label=${t("toggle_menu", "Toggle menu")}
                  onClick=${() => setNavOpen((v) => !v)}
                  class="nr-dashboard-icon-press"
                  style=${{
                    ...iconButtonStyles,
                    background: navOpen
                      ? "rgba(0,0,0,0.10)"
                      : "var(--nr-dashboard-widgetBackgroundColor, rgba(0,0,0,0.04))",
                    transform: navOpen ? "scale(0.98)" : "scale(1)",
                  }}
                >
                  <span class="material-icons" aria-hidden="true">${navOpen ? "close" : "menu"}</span>
                </button>`
              : null}
            <strong>${toolbarTitle}</strong>
            <span style=${{ marginLeft: "auto" }}></span>
          </header>`}
      <section
        style=${{
          ...layoutStyles,
          gridTemplateColumns,
          minHeight: sectionMinHeight,
        }}
      >
        ${showFloatingToggle
          ? html`<button
              type="button"
              aria-label=${t("toggle_menu", "Toggle menu")}
              onClick=${() => setNavOpen((v) => !v)}
              class="nr-dashboard-icon-press"
              style=${{
                ...floatingToggleStyles,
                ...iconButtonStyles,
                background: navOpen
                  ? "rgba(0,0,0,0.10)"
                  : "var(--nr-dashboard-widgetBackgroundColor, rgba(0,0,0,0.06))",
                width: "44px",
                height: "44px",
                boxShadow: navOpen ? "0 6px 18px rgba(0,0,0,0.30)" : floatingToggleStyles.boxShadow,
              }}
            >
              <span class="material-icons" aria-hidden="true">${navOpen ? "close" : "menu"}</span>
            </button>`
          : null}

        ${shouldRenderNav
          ? html`${isSlide && !isLocked && !isIconOnly && navOpen
                ? html`<div
                  role="button"
                  aria-label=${t("close_menu", "Close menu")}
                  onClick=${() => setNavOpen(false)}
                  style=${{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: navTop,
                    bottom: 0,
                    background: "rgba(0,0,0,0.6)",
                    zIndex: 79,
                    animation: "nr-dashboard-nav-backdrop 180ms ease-out",
                  }}
                ></div>`
              : null}
            <nav
              style=${{
                ...navStyles,
                padding: isIconOnly ? "12px 10px" : navStyles.padding,
                width: navWidth,
                minWidth: isIconOnly ? "72px" : "64px",
                maxWidth: isIconOnly ? "72px" : `${navMaxWidth}px`,
                background: "var(--nr-dashboard-pageSidebarBackgroundColor, transparent)",
                position: isSlide && !isLocked && !isIconOnly ? "fixed" : "relative",
                left: isSlide && !isLocked && !isIconOnly ? (navOpen ? "0" : `-${navWidthNum}px`) : undefined,
                top: navTop,
                bottom: 0,
                transition: "left 0.18s ease-out",
                zIndex: 80,
                boxShadow:
                  isSlide && !isLocked && !isIconOnly
                    ? navOpen
                      ? "2px 0 10px rgba(0,0,0,0.28)"
                      : "0 0 0 rgba(0,0,0,0)"
                    : "2px 0 6px rgba(0,0,0,0.26)",
                backdropFilter: undefined,
              }}
            >
              ${isSlide && !isLocked && !isIconOnly
                ? html`<div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h3 style=${{ margin: 0, fontSize: "14px", fontWeight: 600 }}>${t("tabs_label", "Tabs")}</h3>
                    <button
                      class="nr-dashboard-icon-press"
                      type="button"
                      aria-label=${t("close_menu", "Close menu")}
                      onClick=${() => setNavOpen(false)}
                      style=${{
                        ...iconButtonStyles,
                        width: "36px",
                        height: "36px",
                        border: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.20))",
                        background: "var(--nr-dashboard-widgetBackgroundColor, rgba(0,0,0,0.06))",
                      }}
                    >✕</button>
                  </div>`
                : isIconOnly
                ? null
                : html`<h3 style=${{ marginTop: "4px", marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}>${t("tabs_label", "Tabs")}</h3>`}
              <${TabNav}
                menu=${state.menu}
                selectedIndex=${state.selectedTabIndex}
                variant=${isIconOnly ? "icon" : "full"}
                onSelect=${(idx: number) => {
                  if (typeof window !== "undefined") {
                    window.location.hash = `#/${idx}`;
                  }
                  actions.selectTab(idx);
                  if (isSlide) {
                    setNavOpen(false);
                  }
                }}
              />
            </nav>`
          : null}

        <main ref=${mainRef} style=${contentStyles} tabIndex=${-1}>
          ${shouldShowLoading(state.connection)
            ? html`<${LoadingScreen} message=${t("loading", "Loading dashboard...")} />`
            : state.menu.length === 0
            ? html`<div
              class="nr-dashboard-fade-in"
                style=${{
                  textAlign: "center",
                  opacity: 1,
                  padding: "48px 16px",
                  display: "grid",
                  placeItems: "center",
                  gap: "10px",
                  color: "#888",
                  fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif",
                  animationDuration: "2.5s",
                }}
              >
                <img src="./icon120x120.png" alt="Node-RED Dashboard" width="120" height="120" style=${{ opacity: 0.9 }} />
                <p style=${{ margin: "4px 0", fontSize: "18px", fontWeight: 600 }}>${t(
                  "welcome_title",
                  "Welcome to the Node-RED Dashboard",
                )}</p>
                <p style=${{ margin: 0, maxWidth: "420px" }}>${t(
                  "welcome_body",
                  "Please add some UI nodes to your flow and redeploy.",
                )}</p>
              </div>`
            : (() => {
                if (!selectedTab) {
                  return html`<div style=${{ opacity: 0.7 }}>${t(
                    "select_tab_prompt",
                    "Select a tab to view its content.",
                  )}</div>`;
                }

                if (selectedTab.link) {
                  return html`<div style=${{ width: "100%", minHeight: "80vh", position: "relative" }}>
                    <iframe
                      src=${selectedTab.link}
                      style=${{
                        border: "none",
                        borderRadius: "0",
                        width: "100%",
                        height: "100%",
                        background: "transparent",
                        display: "block",
                        position: "absolute",
                        inset: 0,
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
                    sx: sizes.sx,
                    dense:
                      Boolean(
                        ((state.site as { sizes?: { dense?: boolean } } | null)?.sizes?.dense ??
                          (state.site as { layout?: { dense?: boolean } } | null)?.layout?.dense ??
                          false),
                      ),
                    layoutMode:
                      (state.site as { sizes?: { layoutMode?: "grid" | "masonry" } } | null)?.sizes?.layoutMode ??
                      sizes.layoutMode ??
                      "grid",
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

function LoadingScreen({ message }: { message: string }): VNode {
  return html`<div class="nr-dashboard-loading">
    <div class="nr-dashboard-loading__inner">
      <img src="./wheel.png" alt=${message} width="72" height="72" class="nr-dashboard-wheel-spin" style=${{ opacity: 0.9 }} />
      <p style=${{ margin: 0, fontSize: "14px", fontWeight: 500, textAlign: "center" }}>${message}</p>
    </div>
  </div>`;
}

export function bootstrap(): void {
  if (typeof document === "undefined") return;

  const root = document.getElementById("nr-dashboard-root") ?? (() => {
    const el = document.createElement("div");
    el.id = "nr-dashboard-root";
    document.body.appendChild(el);
    return el;
  })();

  render(html`<${App} />`, root);
}

bootstrap();
