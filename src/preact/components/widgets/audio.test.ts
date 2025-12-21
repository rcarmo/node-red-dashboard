import { describe, expect, test } from "bun:test";
import { shouldAutoPlay } from "./audio";

describe("Audio helpers", () => {
  test("autoplay obeys disabled flag", () => {
    expect(shouldAutoPlay(true, true)).toBe(false);
    expect(shouldAutoPlay(false, true)).toBe(true);
    expect(shouldAutoPlay(false, false)).toBe(false);
  });
});
