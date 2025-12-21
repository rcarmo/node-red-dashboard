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
});
