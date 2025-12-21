import { describe, expect, test } from "bun:test";
import { buildSwitchEmit, resolveSwitchColors } from "./switch";
import type { SwitchControl } from "./switch";

const base: SwitchControl = {};

describe("Switch widget helpers", () => {
  test("resolves colors based on state", () => {
    expect(resolveSwitchColors({ ...base, oncolor: "#0f0" }, true)).toBe("#0f0");
    expect(resolveSwitchColors({ ...base, offcolor: "#f00" }, false)).toBe("#f00");
    expect(resolveSwitchColors(base, true)).toBe("#3ddc97");
  });

  test("builds emit payload with defaults", () => {
    const payload = buildSwitchEmit(base, "Label", true);
    expect(payload).toEqual({ payload: true, topic: "Label", type: "switch" });
    const custom = buildSwitchEmit({ ...base, topic: "t" }, "Label", false);
    expect(custom).toEqual({ payload: false, topic: "t", type: "switch" });
  });

  test("emits custom on/off values", () => {
    const ctrl: SwitchControl = { onvalue: "YES", offvalue: "NO" };
    expect(buildSwitchEmit(ctrl, "L", true).payload).toBe("YES");
    expect(buildSwitchEmit(ctrl, "L", false).payload).toBe("NO");
  });
});
