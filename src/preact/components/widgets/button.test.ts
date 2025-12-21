import { describe, expect, test } from "bun:test";
import { buildButtonEmit, resolveButtonColor } from "./button";
import type { ButtonControl } from "./button";

const base: ButtonControl = {};

describe("Button widget helpers", () => {
  test("resolves colors with bgcolor fallback", () => {
    expect(resolveButtonColor({ ...base, bgcolor: "#111" })).toBe("#111");
    expect(resolveButtonColor({ ...base, color: "#222" })).toBe("#222");
    expect(resolveButtonColor(base)).toBe("#1f8af2");
  });

  test("builds emit payload with defaults", () => {
    const payload = buildButtonEmit(base, "Label");
    expect(payload).toEqual({ payload: true, topic: "Label", type: "button" });
    const custom = buildButtonEmit({ ...base, payload: 123, topic: "t" }, "Label");
    expect(custom).toEqual({ payload: 123, topic: "t", type: "button" });
  });

  test("builds typed payloads", () => {
    expect(buildButtonEmit({ payload: "123", payloadType: "num" }, "Label").payload).toBe(123);
    expect(buildButtonEmit({ payloadType: "date" }, "Label").payload).toBeGreaterThan(0);
    expect(buildButtonEmit({ payload: "{\"a\":1}", payloadType: "json" }, "Label").payload).toEqual({ a: 1 });
  });
});
