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

function findNextTabIndex(menu: UiMenuItem[], currentIndex: number, delta: number): number | null {
  const len = menu.length;
  if (len <= 1) return null;
  
  // Search for next enabled and visible tab, wrapping around
  for (let i = currentIndex + delta; i !== currentIndex; i += delta) {
    // Wrap around using modulo
    let idx = i % len;
    if (idx < 0) idx += len;
    
    const item = menu[idx];
    if (!item.disabled && !item.hidden) {
      return idx;
    }
  }
  
  return null;
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
  const hasTabs = state.menu.length > 0;
  const hasMultipleTabs = state.menu.length > 1;
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1280);
  const [navOpen, setNavOpen] = useState<boolean>(hasTabs && (isLocked || isIconOnly));
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const checkOrientation = () => {
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      setOrientation(isPortrait ? "portrait" : "landscape");
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation, { passive: true });
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);
  
  const isMobile = viewportWidth < 960;
  const toolbarHeight = isMobile ? (orientation === "portrait" ? "56px" : "48px") : "64px";
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
    if (hasTabs && (isLocked || isIconOnly || lockMode === "true")) {
      setNavOpen(true);
    }
  }, [hasTabs, isIconOnly, isLocked, lockMode]);

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

      // Require minimum horizontal swipe distance and ensure it's more horizontal than vertical
      if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
      if (event.pointerType === "mouse" && !allowMouseSwipe) return;

      const direction = dx > 0 ? "right" : "left";

      // Menu swipe: right to open, left to close
      if (allowMenuSwipe && isSlide) {
        if (direction === "right" && !navOpen) {
          // Only open from left edge (within 50px)
          if (startX <= 50) {
            setNavOpen(true);
          }
        } else if (direction === "left" && navOpen) {
          setNavOpen(false);
        }
        return;
      }

      // Tab swipe: left to go forward, right to go back
      if (allowTabSwipe) {
        const delta = direction === "left" ? 1 : -1;
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
  }, [actions, allowSwipe, isSlide, state.menu, state.selectedTabIndex, navOpen]);

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

  const shouldRenderNav = hasMultipleTabs && (navOpen || isLocked || isIconOnly);
  const gridTemplateColumns = isLocked || isIconOnly ? `${isIconOnly ? "72px" : `${navMaxWidth}px`} 1fr` : "1fr";
  const sectionMinHeight = "100vh";
  const showToggle = isSlide && hasMultipleTabs;
  const showFloatingToggle = isSlide && hasMultipleTabs && hideToolbar;

  return html`
    <div style=${shellStyles} ref=${shellRef}>
      ${hideToolbar
        ? null
        : html`<header class="nr-dashboard-toolbar">
            ${showToggle
              ? html`<button
                  type="button"
                  aria-label=${t("toggle_menu", "Toggle menu")}
                  onClick=${() => setNavOpen((v) => !v)}
                  class="nr-dashboard-icon-button nr-dashboard-icon-press"
                  style=${{
                    marginLeft: "-8px",
                    marginRight: "0",
                    background: navOpen
                      ? "rgba(0,0,0,0.10)"
                      : "var(--nr-dashboard-widgetBackgroundColor, rgba(0,0,0,0.04))",
                    transform: navOpen ? "scale(0.98)" : "scale(1)",
                  }}
                >
                  <span class="material-icons" aria-hidden="true">${navOpen ? "close" : "menu"}</span>
                </button>`
              : !hasMultipleTabs
              ? html`<span class="nr-dashboard-toolbar-spacer"></span>`
              : null}
            <h1>${toolbarTitle}</h1>
          </header>`}
      <section
        class="nr-dashboard-layout"
        style=${{  
          gridTemplateColumns,
          minHeight: sectionMinHeight,
        }}
      >
        ${showFloatingToggle
          ? html`<button
              type="button"
              aria-label=${t("toggle_menu", "Toggle menu")}
              onClick=${() => setNavOpen((v) => !v)}
              class="nr-dashboard-floating-toggle nr-dashboard-icon-button nr-dashboard-icon-press"
              style=${{
                background: navOpen
                  ? "rgba(0,0,0,0.10)"
                  : "var(--nr-dashboard-widgetBackgroundColor, rgba(0,0,0,0.06))",
                width: "44px",
                height: "44px",
                boxShadow: navOpen ? "0 6px 18px rgba(0,0,0,0.30)" : "0 6px 16px rgba(0,0,0,0.20)",
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
                  class="nr-dashboard-nav-backdrop"
                  style=${{
                    top: navTop,
                  }}
                ></div>`
              : null}
            <nav
              class="nr-dashboard-nav"
              style=${{
                padding: isIconOnly ? "12px 10px" : "0",
                width: navWidth,
                minWidth: isIconOnly ? "72px" : "64px",
                maxWidth: isIconOnly ? "72px" : `${navMaxWidth}px`,
                position: isSlide && !isLocked && !isIconOnly ? "fixed" : "relative",
                left: isSlide && !isLocked && !isIconOnly ? (navOpen ? "0" : `-${navWidthNum}px`) : undefined,
                top: isSlide && !isLocked && !isIconOnly ? navTop : "0",
                bottom: 0,
                transition: "left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                zIndex: 80,
                boxShadow: isSlide && !isLocked && !isIconOnly ? (navOpen ? "2px 0 10px rgba(0,0,0,0.28)" : "none") : "none",
              }}
            >
              ${isSlide && !isLocked && !isIconOnly && navOpen && isMobile
                ? html`<div class="nr-dashboard-nav-close-container">
                    <button
                      class="nr-dashboard-icon-button nr-dashboard-icon-press"
                      type="button"
                      aria-label=${t("close_menu", "Close menu")}
                      onClick=${() => setNavOpen(false)}
                      style=${{
                        width: "36px",
                        height: "36px",
                        border: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.20))",
                        background: "var(--nr-dashboard-widgetBackgroundColor, rgba(0,0,0,0.06))",
                      }}
                    ><span class="material-icons nr-dashboard-nav-close-icon" aria-hidden="true">close</span></button>
                  </div>`
                : null}
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

        <main ref=${mainRef} class="nr-dashboard-content" tabIndex=${-1}>
          ${shouldShowLoading(state.connection)
            ? html`<${LoadingScreen} message=${t("loading", "Loading dashboard...")} />`
            : state.menu.length === 0
            ? html`<div class="nr-dashboard-empty">
                <div class="nr-dashboard-empty__inner">
                  <img src="./icon120x120.png" alt="Node-RED Dashboard" width="120" height="120" class="nr-dashboard-empty__icon" />
                  <p class="nr-dashboard-empty__body">${t(
                    "welcome_body",
                    "Please add some UI nodes to your flow and redeploy.",
                  )}</p>
                </div>
              </div>`
            : (() => {
                if (!selectedTab) {
                  return html`<div class="nr-dashboard-select-prompt">${t(
                    "select_tab_prompt",
                    "Select a tab to view its content.",
                  )}</div>`;
                }

                if (selectedTab.link) {
                  return html`<div class="nr-dashboard-iframe-container">
                    <iframe
                      src=${selectedTab.link}
                      class="nr-dashboard-iframe"
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
  return html`<div class="nr-dashboard-loading nr-dashboard-fade-in">
    <div class="nr-dashboard-loading__inner">
      <img src="./wheel.png" alt=${message} width="72" height="72" class="nr-dashboard-wheel-spin nr-dashboard-loading-icon" />
      <p class="nr-dashboard-loading__text">${message}</p>
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
