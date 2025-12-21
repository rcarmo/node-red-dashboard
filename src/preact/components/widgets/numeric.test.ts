import { describe, expect, test } from "bun:test";
import { buildNumericEmit, clampValue } from "./numeric";

describe("Numeric helpers", () => {
  test("clamps with wrap", () => {
    expect(clampValue(11, 1, 10, true)).toBe(1);
    expect(clampValue(0, 1, 10, true)).toBe(10);
  });

  test("clamps without wrap", () => {
    expect(clampValue(11, 1, 10, false)).toBe(10);
    expect(clampValue(0, 1, 10, false)).toBe(1);
  });

  test("builds emit payload", () => {
    const payload = buildNumericEmit({}, "Label", 3.14);
    expect(payload).toEqual({ payload: 3.14, topic: "Label", type: "numeric" });
  });
});
