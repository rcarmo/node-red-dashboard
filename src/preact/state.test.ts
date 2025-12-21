import { describe, expect, test } from "bun:test";
import { getFirstVisibleTab } from "./state";

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
