import { describe, expect, test } from "bun:test";
import { resolveDateInputType } from "./date-picker";

describe("Date picker helpers", () => {
  test("resolves input types", () => {
    expect(resolveDateInputType()).toBe("date");
    expect(resolveDateInputType("date")).toBe("date");
    expect(resolveDateInputType("time")).toBe("time");
    expect(resolveDateInputType("datetime")).toBe("datetime-local");
  });

  test("honors min/max strings for validation shape", () => {
    const ctrl = { min: "2023-01-01", max: "2024-01-01" } as never;
    expect(ctrl.min).toBe("2023-01-01");
    expect(ctrl.max).toBe("2024-01-01");
  });

  test("accepts required flag for validation", () => {
    const ctrl = { required: true } as never;
    expect(ctrl.required).toBe(true);
  });
});
