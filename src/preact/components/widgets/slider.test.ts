import { describe, expect, test } from "bun:test";
import { buildSliderEmit, clampSliderValue, normalizeSliderRange } from "./slider";

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

  test("normalizes inverted ranges", () => {
    const { min, max, invert } = normalizeSliderRange(100, 0, false);
    expect(min).toBe(0);
    expect(max).toBe(100);
    expect(invert).toBe(true);
  });

  test("honors explicit invert flag without swapping", () => {
    const { min, max, invert } = normalizeSliderRange(0, 10, true);
    expect(min).toBe(0);
    expect(max).toBe(10);
    expect(invert).toBe(true);
  });
});
