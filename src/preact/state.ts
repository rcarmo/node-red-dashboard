import { useEffect, useMemo, useState } from "preact/hooks";
import { createSocketBridge, UiSocketBridge } from "./socket";

export type UiGroup = {
  header?: {
    name?: string;
    id?: string | number;
    config?: { hidden?: boolean };
  };
  items?: UiControl[];
};

export type UiControl = Record<string, unknown>;

export type UiMenuItem = {
  id?: string | number;
  header?: string;
  name?: string;
  items?: UiGroup[];
  link?: string;
  target?: string;
  disabled?: boolean;
  hidden?: boolean;
};

export type UiSite = Record<string, unknown>;

export type UiControlsPayload = {
  menu?: UiMenuItem[];
  globals?: UiControl[];
  site?: UiSite;
  nothing?: boolean;
};

export type ConnectionState = "disconnected" | "connecting" | "ready";

export type DashboardState = {
  connection: ConnectionState;
  socketId: string;
  menu: UiMenuItem[];
  globals: UiControl[];
  site: UiSite | null;
  selectedTabIndex: number | null;
  replayDone: boolean;
};

export type DashboardActions = {
  selectTab: (index: number) => void;
  emit: UiSocketBridge["emit"] | null;
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
  selectedTabIndex: null,
  replayDone: false,
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
        const defaultTab = getFirstVisibleTab(menu);
        setState((prev) => ({
          ...prev,
          connection: "ready",
          menu,
          globals,
          site,
          selectedTabIndex: defaultTab,
        }));
      },
      onReplayDone: () => {
        setState((prev) => ({ ...prev, replayDone: true, connection: "ready" }));
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

  return {
    state,
    selectedTab,
    actions: {
      selectTab,
      emit: bridge?.emit ?? null,
    },
  };
}

function getFirstVisibleTab(menu: UiMenuItem[]): number | null {
  for (let i = 0; i < menu.length; i += 1) {
    const tab = menu[i];
    if (tab && !tab.hidden && !tab.disabled) {
      return i;
    }
  }
  return menu.length > 0 ? 0 : null;
}
