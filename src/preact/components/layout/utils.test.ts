import { describe, expect, test } from "bun:test";
import { groupColumnSpan } from "./utils";

describe("Layout utils", () => {
  test("caps span when width exceeds columns", () => {
    const span = groupColumnSpan({ header: { config: { width: 30 } } }, 6);
    expect(span).toBe(6);
  });

  test("parses string widths and defaults to max when invalid", () => {
    expect(groupColumnSpan({ header: { config: { width: "3" } } }, 6)).toBe(3);
    expect(groupColumnSpan({ header: { config: { width: "abc" } } }, 4)).toBe(4);
  });
});
