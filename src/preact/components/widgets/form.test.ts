import { describe, expect, test } from "bun:test";
import { buildFormEmit } from "./form";

describe("Form helpers", () => {
  test("builds emit payload with fallback topic", () => {
    const payload = buildFormEmit({}, "Form 1", { name: "Ada" });
    expect(payload).toEqual({ payload: { name: "Ada" }, topic: "Form 1", type: "form" });
  });

  test("uses explicit topic when provided", () => {
    const payload = buildFormEmit({ topic: "custom" }, "Form 1", { ok: "yes" });
    expect(payload).toEqual({ payload: { ok: "yes" }, topic: "custom", type: "form" });
  });
});
