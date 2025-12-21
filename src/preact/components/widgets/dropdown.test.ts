import { describe, expect, test } from "bun:test";
import { buildDropdownEmit } from "./dropdown";

describe("Dropdown helpers", () => {
  test("builds emit payload", () => {
    const payload = buildDropdownEmit({}, "Label", "x");
    expect(payload).toEqual({ payload: "x", topic: "Label", type: "dropdown" });
  });
});
