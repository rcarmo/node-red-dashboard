import { describe, expect, test } from "bun:test";
import { buildSegments, formatGaugeValue } from "./gauge";

describe("Gauge helpers", () => {
  test("formats value with fallback template", () => {
    const fmt = new Intl.NumberFormat("en-US");
    expect(formatGaugeValue(12.3, undefined, "V", fmt)).toBe("12.3");
    expect(formatGaugeValue(5, "{{ value }} {{ units }}", "kPa", fmt)).toBe("5 kPa");
  });

  test("formats value with locale", () => {
    const fmt = new Intl.NumberFormat("de-DE");
    expect(formatGaugeValue(1234.5, "{{value}}", undefined, fmt)).toBe("1.234,5");
  });

  test("builds segment thresholds with defaults", () => {
    const segments = buildSegments({}, 0, 10);
    expect(segments[0][0]).toBeCloseTo(1 / 3);
    expect(segments[1][0]).toBeCloseTo(2 / 3);
    expect(segments[2][0]).toBe(1);
  });
});
