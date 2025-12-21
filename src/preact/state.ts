import { useEffect, useMemo, useState } from "preact/hooks";
import { createSocketBridge, UiSocketBridge } from "./socket";
import { speakText } from "./lib/tts";
import type { LocaleMap } from "./lib/i18n";

export type UiGroup = {
  header?: {
    name?: string;
    id?: string | number;
    config?: { hidden?: boolean };
  };
  items?: UiControl[];
};

export type UiControl = Record<string, unknown>;

export type UiTheme = {
  themeState?: Record<string, { value?: string } | undefined>;
};

export type UiMenuItem = {
  id?: string | number;
  header?: string;
  name?: string;
  items?: UiGroup[];
  link?: string;
  target?: string;
  disabled?: boolean;
  hidden?: boolean;
  theme?: UiTheme;
};

export type UiSite = Record<string, unknown>;

export type UiControlsPayload = {
  menu?: UiMenuItem[];
  globals?: UiControl[];
  site?: UiSite;
  theme?: UiTheme;
  locales?: LocaleMap;
  lang?: string;
  nothing?: boolean;
};

export type ConnectionState = "disconnected" | "connecting" | "ready";

export type DashboardState = {
  connection: ConnectionState;
  socketId: string;
  menu: UiMenuItem[];
  globals: UiControl[];
  site: UiSite | null;
  theme: UiTheme | null;
  locales: LocaleMap | null;
  lang: string | null;
  selectedTabIndex: number | null;
  replayDone: boolean;
  toasts: ToastMessage[];
};

export type ToastMessage = {
  id: string;
  title?: string;
  message?: unknown;
  level?: "info" | "warn" | "error";
  displayTime?: number;
  className?: string;
};

export type DashboardActions = {
  selectTab: (index: number) => void;
  emit: UiSocketBridge["emit"] | null;
  dismissToast: (id: string) => void;
};

export type DashboardStore = {
  state: DashboardState;
  selectedTab: UiMenuItem | null;
  actions: DashboardActions;
};

const tabHiddenKey = (idx: number, name: string) => `th${idx}${name}`;
const tabDisabledKey = (idx: number, name: string) => `td${idx}${name}`;
const groupHiddenKey = (key: string) => `g${key}`;
const groupCollapsedKey = (key: string) => `gc${key}`;

function persistTabVisibility(idx: number, name: string, hidden?: boolean, disabled?: boolean): void {
  if (typeof window === "undefined" || !name) return;
  if (hidden === true) {
    window.localStorage.setItem(tabHiddenKey(idx, name), "true");
  } else if (hidden === false) {
    window.localStorage.setItem(tabHiddenKey(idx, name), "false");
  }

  if (disabled === true) {
    window.localStorage.setItem(tabDisabledKey(idx, name), "true");
  } else if (disabled === false) {
    window.localStorage.setItem(tabDisabledKey(idx, name), "false");
  }
}

function persistGroupVisibility(key: string, hidden?: boolean): void {
  if (typeof window === "undefined" || !key) return;
  if (hidden === true) {
    window.localStorage.setItem(groupHiddenKey(key), "true");
  } else if (hidden === false) {
    window.localStorage.removeItem(groupHiddenKey(key));
  }
}

function persistGroupCollapse(key: string, collapsed?: boolean): void {
  if (typeof window === "undefined" || !key) return;
  if (collapsed === true) {
    window.localStorage.setItem(groupCollapsedKey(key), "true");
  } else if (collapsed === false) {
    window.localStorage.removeItem(groupCollapsedKey(key));
  }
}

const initialState: DashboardState = {
  connection: "connecting",
  socketId: "",
  menu: [],
  globals: [],
  site: null,
  theme: null,
  locales: null,
  lang: null,
  selectedTabIndex: null,
  replayDone: false,
  toasts: [],
};

export function useDashboardState(): DashboardStore {
  const [state, setState] = useState<DashboardState>(initialState);
  const [bridge, setBridge] = useState<UiSocketBridge | null>(null);

  useEffect(() => {
    // TODO: add socket contract tests covering ui-control/ui-replay/ui-change payloads.
    const b = createSocketBridge({
      onConnect: (id) => {
        setState((prev) => ({ ...prev, connection: "ready", socketId: id }));
      },
      onControls: (payload: unknown) => {
        const data = (payload || {}) as UiControlsPayload;
        const menu = data.menu ?? [];
        const globals = data.globals ?? [];
        const site = data.site ?? null;
        const theme = data.theme ?? null;
        const locales = data.locales ?? null;
        const lang = data.lang ?? null;
        const defaultTab = getFirstVisibleTab(menu);
        setState((prev) => ({
          ...prev,
          connection: "ready",
          menu,
          globals,
          site,
          theme,
          locales,
          lang,
          selectedTabIndex: defaultTab,
        }));
      },
      onReplayDone: () => {
        setState((prev) => ({ ...prev, replayDone: true, connection: "ready" }));
      },
      onControl: (payload) => {
        setState((prev) => handleUiControl(prev, payload));
      },
      onToast: (payload) => {
        setState((prev) => pushToast(prev, payload));
      },
      onAudio: (payload) => {
        handleAudioEvent(payload);
      },
    });
    setBridge(b);
    return () => b.dispose();
  }, []);

  const selectedTab = useMemo(() => {
    if (state.selectedTabIndex == null) return null;
    return state.menu[state.selectedTabIndex] ?? null;
  }, [state.menu, state.selectedTabIndex]);

  const selectTab = (index: number): void => {
    setState((prev) => ({ ...prev, selectedTabIndex: index }));
    bridge?.emit("ui-change", { tab: index });
  };

  useEffect(() => {
    const timers: number[] = [];
    state.toasts.forEach((toast) => {
      if (toast.displayTime && toast.displayTime > 0) {
        const timer = window.setTimeout(() => {
          setState((prev) => ({ ...prev, toasts: prev.toasts.filter((t) => t.id !== toast.id) }));
        }, toast.displayTime);
        timers.push(timer);
      }
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [state.toasts]);

  return {
    state,
    selectedTab,
    actions: {
      selectTab,
      emit: bridge?.emit ?? null,
      dismissToast: (id: string) => setState((prev) => ({ ...prev, toasts: prev.toasts.filter((t) => t.id !== id) })),
    },
  };
}

export function getFirstVisibleTab(menu: UiMenuItem[]): number | null {
  for (let i = 0; i < menu.length; i += 1) {
    const tab = menu[i];
    if (tab && !tab.hidden && !tab.disabled) {
      return i;
    }
  }
  return menu.length > 0 ? 0 : null;
}

function updateControlById(menu: UiMenuItem[], id: string | number | undefined, controlPatch: Record<string, unknown>): UiMenuItem[] {
  if (id == null) return menu;
  return menu.map((tab) => {
    const items = (tab.items ?? []).map((group) => {
      const controls = (group.items ?? []).map((ctrl) => {
        if ((ctrl as { id?: string | number }).id === id) {
          return { ...ctrl, ...controlPatch };
        }
        return ctrl;
      });
      return { ...group, items: controls };
    });
    return { ...tab, items };
  });
}

function applyTabVisibility(menu: UiMenuItem[], tabsMsg: Record<string, unknown>): UiMenuItem[] {
  return menu.map((tab, idx) => {
    const name = (tab.header || tab.name || "").toString();
    const show = Array.isArray((tabsMsg as { show?: unknown }).show) ? (tabsMsg as { show: string[] }).show : [];
    const hide = Array.isArray((tabsMsg as { hide?: unknown }).hide) ? (tabsMsg as { hide: string[] }).hide : [];
    const enable = Array.isArray((tabsMsg as { enable?: unknown }).enable) ? (tabsMsg as { enable: string[] }).enable : [];
    const disable = Array.isArray((tabsMsg as { disable?: unknown }).disable) ? (tabsMsg as { disable: string[] }).disable : [];
    const next: UiMenuItem = { ...tab };
    const willShow = show.includes(name);
    const willHide = hide.includes(name);
    const willEnable = enable.includes(name);
    const willDisable = disable.includes(name);

    if (willShow) next.hidden = false;
    if (willHide) next.hidden = true;
    if (willEnable) next.disabled = false;
    if (willDisable) next.disabled = true;

    persistTabVisibility(idx, name, willShow ? false : willHide ? true : undefined, willEnable ? false : willDisable ? true : undefined);
    return next;
  });
}

function applyGroupVisibility(menu: UiMenuItem[], groupMsg: Record<string, unknown>): UiMenuItem[] {
  const show: string[] = Array.isArray((groupMsg as { show?: unknown }).show) ? (groupMsg as { show: string[] }).show : [];
  const hide: string[] = Array.isArray((groupMsg as { hide?: unknown }).hide) ? (groupMsg as { hide: string[] }).hide : [];
  const collapse = Array.isArray((groupMsg as { collapse?: unknown }).collapse)
    ? (groupMsg as { collapse: string[] }).collapse
    : [];
  const expand = Array.isArray((groupMsg as { expand?: unknown }).expand) ? (groupMsg as { expand: string[] }).expand : [];
  return menu.map((tab) => {
    const items = (tab.items ?? []).map((group) => {
      const key = `${tab.header ?? tab.name ?? ""} ${group.header?.name ?? ""}`.replace(/ /g, "_");
      const nextHeader = { ...(group.header ?? {}), config: { ...(group.header?.config ?? {}) } };
      const willShow = show.includes(key);
      const willHide = hide.includes(key);
      const willCollapse = collapse.includes(key);
      const willExpand = expand.includes(key);
      if (willShow) {
        nextHeader.config.hidden = false;
      }
      if (willHide) {
        nextHeader.config.hidden = true;
      }
      if (willCollapse) {
        nextHeader.config.collapsed = true;
      }
      if (willExpand) {
        nextHeader.config.collapsed = false;
      }
      persistGroupVisibility(key, willHide ? true : willShow ? false : undefined);
      persistGroupCollapse(key, willCollapse ? true : willExpand ? false : undefined);
      return { ...group, header: nextHeader };
    });
    return { ...tab, items };
  });
}

function pushToast(prev: DashboardState, payload: unknown): DashboardState {
  const msg = payload as { id?: string; title?: string; message?: unknown; level?: string; displayTime?: number; className?: string };
  const id = msg.id?.toString() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const toast = {
    id,
    title: msg.title,
    message: msg.message,
    level: msg.level === "error" || msg.level === "warn" ? msg.level : undefined,
    displayTime: typeof msg.displayTime === "number" ? msg.displayTime : 3000,
    className: msg.className,
  } satisfies ToastMessage;
  const nextToasts = [...prev.toasts.filter((t) => t.id !== id), toast];
  return { ...prev, toasts: nextToasts };
}

function handleUiControl(prev: DashboardState, payload: unknown): DashboardState {
  const msg = (payload || {}) as Record<string, unknown>;
  let menu = prev.menu;
  let selectedTabIndex = prev.selectedTabIndex;
  const controlId = msg.id as string | number | undefined;

  if (msg.control && controlId !== undefined) {
    menu = updateControlById(menu, controlId, msg.control as Record<string, unknown>);
  }

  // Dropdown legacy parity: accept option updates/reset/value sent via ui-control
  if (msg.options && controlId !== undefined) {
    const nextValue = (msg as { value?: unknown; payload?: unknown }).value ?? (msg as { payload?: unknown }).payload;
    const resetSelection = Boolean((msg as { resetSearch?: unknown }).resetSearch || (msg as { resetSelection?: unknown }).resetSelection);
    menu = updateControlById(menu, controlId, {
      options: msg.options,
      value: nextValue,
      resetSelection,
    });
  }

  if (msg.tabs) {
    menu = applyTabVisibility(menu, msg.tabs as Record<string, unknown>);
    selectedTabIndex = getFirstVisibleTab(menu);
  }

  if (msg.tab !== undefined) {
    const requested = msg.tab as unknown;
    if (typeof requested === "string") {
      if (requested === "") {
        // noop refresh hook
      } else if (requested === "+1" || requested === "-1") {
        const delta = requested === "+1" ? 1 : -1;
        const next = (selectedTabIndex ?? 0) + delta;
        if (next >= 0 && next < menu.length && !menu[next].disabled) selectedTabIndex = next;
      } else {
        const idx = menu.findIndex((t) => t.header === requested || t.name === requested);
        if (idx >= 0 && !menu[idx].disabled) selectedTabIndex = idx;
      }
    } else if (typeof requested === "number") {
      if (requested >= 0 && requested < menu.length && !menu[requested].disabled) selectedTabIndex = requested;
    }
  }

  if (msg.group) {
    menu = applyGroupVisibility(menu, msg.group as Record<string, unknown>);
  }

  return { ...prev, menu: [...menu], selectedTabIndex };
}

function handleAudioEvent(payload: unknown): void {
  const msg = (payload || {}) as { reset?: boolean; stop?: boolean; tts?: string; voice?: string; vol?: number; audio?: ArrayBuffer | Uint8Array };
  if (msg.reset || msg.stop) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    return;
  }
  if (msg.tts) {
    speakText(msg.tts, msg.voice, typeof msg.vol === "number" ? msg.vol / 100 : undefined);
    return;
  }
  if (msg.audio && typeof window !== "undefined") {
    const buffer = msg.audio instanceof Uint8Array ? msg.audio : new Uint8Array(msg.audio as ArrayBuffer);
    const blob = new Blob([buffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = typeof msg.vol === "number" ? Math.max(0, Math.min(1, msg.vol / 100)) : 1;
    void audio.play().finally(() => URL.revokeObjectURL(url));
  }
}

export const __test = {
  tabHiddenKey,
  tabDisabledKey,
  groupHiddenKey,
  groupCollapsedKey,
  persistTabVisibility,
  persistGroupVisibility,
  persistGroupCollapse,
  applyGroupVisibility,
  applyTabVisibility,
  handleUiControl,
};
