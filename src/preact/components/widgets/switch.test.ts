import { describe, expect, test } from "bun:test";
import { buildSwitchEmit, resolveSwitchColors } from "./switch";

const base = {} as any;

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
});
