import { describe, expect, test } from "bun:test";
import { getFirstVisibleTab, __test } from "./state";

describe("Dashboard state helpers", () => {
  test("selects first non-hidden and non-disabled tab", () => {
    const menu = [
      { id: 0, hidden: true },
      { id: 1, disabled: true },
      { id: 2 },
    ];
    expect(getFirstVisibleTab(menu)).toBe(2);
  });

  test("falls back to first when all hidden/disabled but menu present", () => {
    const menu = [
      { id: 0, hidden: true },
      { id: 1, disabled: true },
    ];
    expect(getFirstVisibleTab(menu)).toBe(0);
  });

  test("returns null when menu empty", () => {
    expect(getFirstVisibleTab([])).toBeNull();
  });
});

describe("Visibility persistence", () => {
  test("persists tab visibility and disabled flags", () => {
    const store: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.window = {
      localStorage: {
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
      },
    } as unknown as Window;

    __test.persistTabVisibility(0, "Main", true, false);
    expect(store[__test.tabHiddenKey(0, "Main")]).toBe("true");
    expect(store[__test.tabDisabledKey(0, "Main")]).toBe("false");

    __test.persistTabVisibility(0, "Main", false, true);
    expect(store[__test.tabHiddenKey(0, "Main")]).toBe("false");
    expect(store[__test.tabDisabledKey(0, "Main")]).toBe("true");
  });

  test("persists group visibility", () => {
    const store: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.window = {
      localStorage: {
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
      },
    } as unknown as Window;

    __test.persistGroupVisibility("Tab_A_Group_A", true);
    expect(store[__test.groupHiddenKey("Tab_A_Group_A")]).toBe("true");

    __test.persistGroupVisibility("Tab_A_Group_A", false);
    expect(store[__test.groupHiddenKey("Tab_A_Group_A")]).toBeUndefined();
  });

  test("applies group collapse/expand", () => {
    const menu = [
      {
        header: "TabA",
        items: [
          {
            header: { name: "GroupA", config: { hidden: false, collapsed: false } },
            items: [],
          },
        ],
      },
    ];

    const updated = __test.applyGroupVisibility(menu, {
      collapse: ["TabA_GroupA"],
    });

    expect(updated[0].items?.[0].header?.config?.collapsed).toBe(true);

    const expanded = __test.applyGroupVisibility(menu, {
      expand: ["TabA_GroupA"],
    });

    expect(expanded[0].items?.[0].header?.config?.collapsed).toBe(false);
  });
});

describe("ui-control handler", () => {
  test("updates tabs and selects first visible", () => {
    const prev = {
      connection: "ready",
      socketId: "abc",
      menu: [
        { header: "A", hidden: true },
        { header: "B", disabled: true },
        { header: "C" },
      ],
      globals: [],
      site: null,
      theme: null,
      selectedTabIndex: 0,
      replayDone: true,
      toasts: [],
    } as const;

    const next = __test.handleUiControl(prev, {
      tabs: { show: ["A"], hide: ["B"] },
    });

    expect(next.selectedTabIndex).toBe(0);
    expect(next.menu[0].hidden).toBe(false);
    expect(next.menu[1].hidden).toBe(true);
  });

  test("applies group collapse via ui-control payload", () => {
    const prev = {
      connection: "ready",
      socketId: "abc",
      menu: [
        {
          header: "A",
          items: [
            {
              header: { name: "G1", config: { collapsed: false } },
              items: [],
            },
          ],
        },
      ],
      globals: [],
      site: null,
      theme: null,
      selectedTabIndex: 0,
      replayDone: true,
      toasts: [],
    } as const;

    const next = __test.handleUiControl(prev, {
      group: { collapse: ["A_G1"] },
    });

    expect(next.menu[0].items?.[0].header?.config?.collapsed).toBe(true);
  });

  test("handles tab navigation via ui-control string and number", () => {
    const prev = {
      connection: "ready",
      socketId: "abc",
      menu: [
        { header: "A" },
        { header: "B", disabled: true },
        { header: "C" },
      ],
      globals: [],
      site: null,
      theme: null,
      selectedTabIndex: 0,
      replayDone: true,
      toasts: [],
    } as const;

    const byName = __test.handleUiControl(prev, { tab: "C" });
    expect(byName.selectedTabIndex).toBe(2);

    const byNumber = __test.handleUiControl(prev, { tab: 2 });
    expect(byNumber.selectedTabIndex).toBe(2);

    const disabledSkip = __test.handleUiControl(prev, { tab: "B" });
    expect(disabledSkip.selectedTabIndex).toBe(0);
  });

  test("patches dropdown options and reset via ui-control", () => {
    const prev = {
      connection: "ready",
      socketId: "abc",
      menu: [
        {
          header: "A",
          items: [
            {
              header: { name: "G1" },
              items: [
                {
                  id: 1,
                  type: "dropdown",
                  options: [{ label: "Old", value: "old" }],
                  value: "old",
                },
              ],
            },
          ],
        },
      ],
      globals: [],
      site: null,
      theme: null,
      selectedTabIndex: 0,
      replayDone: true,
      toasts: [],
    } as const;

    const next = __test.handleUiControl(prev, {
      id: 1,
      options: [{ label: "New", value: "new" }],
      value: "new",
      resetSearch: true,
    });

    const ctrl = next.menu[0].items?.[0].items?.[0] as Record<string, unknown>;
    expect((ctrl.options as Array<{ label: string }>)[0].label).toBe("New");
    expect(ctrl.value).toBe("new");
    expect(ctrl.resetSelection).toBe(true);
  });
});
