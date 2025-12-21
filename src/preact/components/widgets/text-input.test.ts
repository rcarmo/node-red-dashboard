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
});
