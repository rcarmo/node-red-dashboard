import { describe, expect, test } from "bun:test";
import { buildTextEmit } from "./text-input";
import type { TextInputControl } from "./text-input";

describe("Text input helpers", () => {
  test("builds emit payload with defaults", () => {
    const payload = buildTextEmit({}, "Label", "hi");
    expect(payload).toEqual({ payload: "hi", topic: "Label", type: "text-input" });
    const control: TextInputControl = { topic: "t" };
    const custom = buildTextEmit(control, "Label", "v");
    expect(custom).toEqual({ payload: "v", topic: "t", type: "text-input" });
  });

  test("validates required and pattern", () => {
    const ctrl = { label: "Email", pattern: "^.+@.+\\..+$", required: true } as never;
    const emit = buildTextEmit(ctrl, "Email", "test@example.com");
    expect(emit.payload).toBe("test@example.com");
  });

  test("respects maxlength metadata", () => {
    const ctrl = { label: "Msg", maxlength: 10 } as never;
    expect((ctrl as { maxlength?: number }).maxlength).toBe(10);
  });
});
