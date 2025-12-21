import { describe, expect, test } from "bun:test";
import { resolveColourValue } from "./colour-picker";

describe("Colour picker helpers", () => {
  test("returns provided value when non-empty", () => {
    expect(resolveColourValue("#123456")).toBe("#123456");
  });

  test("falls back when value is missing or empty", () => {
    expect(resolveColourValue(undefined)).toBe("#ff0000");
    expect(resolveColourValue("   ")).toBe("#ff0000");
  });
});
