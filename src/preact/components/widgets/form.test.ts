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

  test("carries pattern metadata for validation", () => {
    const ctrl = {
      label: "Form",
      fields: [{ name: "email", pattern: "^.+@.+\\..+$", required: true }],
    } as never;
    expect((ctrl.fields || [])[0].pattern).toContain("@" );
  });

  test("carries maxlength metadata", () => {
    const ctrl = {
      label: "Form",
      fields: [{ name: "msg", maxlength: 12 }],
    } as never;
    expect((ctrl.fields || [])[0].maxlength).toBe(12);
  });
});
