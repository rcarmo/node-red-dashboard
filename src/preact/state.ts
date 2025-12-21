import { useEffect, useMemo, useState } from "preact/hooks";
import { createSocketBridge, UiSocketBridge } from "./socket";
import { speakText } from "./lib/tts";

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

const initialState: DashboardState = {
  connection: "connecting",
  socketId: "",
  menu: [],
  globals: [],
  site: null,
  theme: null,
  selectedTabIndex: null,
  replayDone: false,
  toasts: [],
};

export function useDashboardState(): DashboardStore {
  const [state, setState] = useState<DashboardState>(initialState);
  const [bridge, setBridge] = useState<UiSocketBridge | null>(null);

  useEffect(() => {
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
        const defaultTab = getFirstVisibleTab(menu);
        setState((prev) => ({
          ...prev,
          connection: "ready",
          menu,
          globals,
          site,
          theme,
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
    if (show.includes(name)) next.hidden = false;
    if (hide.includes(name)) next.hidden = true;
    if (enable.includes(name)) next.disabled = false;
    if (disable.includes(name)) next.disabled = true;
    // persist similar to legacy localStorage keys
    if (typeof window !== "undefined" && name) {
      if (show.includes(name)) window.localStorage.setItem(`th${idx}${name}`, "false");
      if (hide.includes(name)) window.localStorage.setItem(`th${idx}${name}`, "true");
      if (enable.includes(name)) window.localStorage.setItem(`td${idx}${name}`, "false");
      if (disable.includes(name)) window.localStorage.setItem(`td${idx}${name}`, "true");
    }
    return next;
  });
}

function applyGroupVisibility(menu: UiMenuItem[], groupMsg: Record<string, unknown>): UiMenuItem[] {
  const show: string[] = Array.isArray((groupMsg as { show?: unknown }).show) ? (groupMsg as { show: string[] }).show : [];
  const hide: string[] = Array.isArray((groupMsg as { hide?: unknown }).hide) ? (groupMsg as { hide: string[] }).hide : [];
  return menu.map((tab) => {
    const items = (tab.items ?? []).map((group) => {
      const key = `${tab.header ?? tab.name ?? ""} ${group.header?.name ?? ""}`.replace(/ /g, "_");
      const nextHeader = { ...(group.header ?? {}), config: { ...(group.header?.config ?? {}) } };
      if (show.includes(key)) {
        nextHeader.config.hidden = false;
        if (typeof window !== "undefined") window.localStorage.removeItem(`g${key}`);
      }
      if (hide.includes(key)) {
        nextHeader.config.hidden = true;
        if (typeof window !== "undefined") window.localStorage.setItem(`g${key}`, "true");
      }
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

  if (msg.control && msg.id !== undefined) {
    menu = updateControlById(menu, msg.id as string | number, msg.control as Record<string, unknown>);
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
