import { describe, expect, test } from "bun:test";
import { buildSegments, formatGaugeValue } from "./gauge";

describe("Gauge helpers", () => {
  test("formats value with fallback template", () => {
    const fmt = new Intl.NumberFormat("en-US");
    expect(formatGaugeValue(12.3, undefined, "V", fmt)).toBe("12.3");
    expect(formatGaugeValue(5, "{{ value }} {{ units }}", "kPa", fmt)).toBe("5 kPa");
  });

  test("builds segment thresholds with defaults", () => {
    const segments = buildSegments({}, 0, 10);
    expect(segments[0][0]).toBeCloseTo(1 / 3);
    expect(segments[1][0]).toBeCloseTo(2 / 3);
    expect(segments[2][0]).toBe(1);
  });
});
