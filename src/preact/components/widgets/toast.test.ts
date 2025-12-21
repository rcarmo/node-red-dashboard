import { describe, expect, test } from "bun:test";
import { resolveToastToneColor } from "./toast";

describe("Toast helpers", () => {
  test("resolves tone colors", () => {
    expect(resolveToastToneColor()).toBe("#60a5fa");
    expect(resolveToastToneColor("info")).toBe("#60a5fa");
    expect(resolveToastToneColor("warn")).toBe("#facc15");
    expect(resolveToastToneColor("error")).toBe("#f87171");
  });
});
