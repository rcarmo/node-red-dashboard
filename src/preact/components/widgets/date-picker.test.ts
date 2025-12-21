import { describe, expect, test } from "bun:test";
import { resolveDateInputType } from "./date-picker";

describe("Date picker helpers", () => {
  test("resolves input types", () => {
    expect(resolveDateInputType()).toBe("date");
    expect(resolveDateInputType("date")).toBe("date");
    expect(resolveDateInputType("time")).toBe("time");
    expect(resolveDateInputType("datetime")).toBe("datetime-local");
  });
});
