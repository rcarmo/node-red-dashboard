import { describe, expect, test } from "bun:test";
import { buildSliderEmit, clampSliderValue } from "./slider";

describe("Slider helpers", () => {
  test("clamps within bounds", () => {
    expect(clampSliderValue(11, 0, 10)).toBe(10);
    expect(clampSliderValue(-1, 0, 10)).toBe(0);
    expect(clampSliderValue(5, 0, 10)).toBe(5);
  });

  test("builds emit payload", () => {
    const payload = buildSliderEmit({}, "Label", 7);
    expect(payload).toEqual({ payload: 7, topic: "Label", type: "slider" });
  });
});
