import { describe, expect, test } from "bun:test";
import { applyFormat, layoutStyles, mergeStyleString } from "./text";
import type { TextControl } from "./text";

const baseCtrl: Partial<TextControl> = { layoutAlign: "space-between center" };

describe("Text widget helpers", () => {
  test("applyFormat replaces payload token", () => {
    expect(applyFormat("Value: {{payload}}", 42)).toBe("Value: 42");
    expect(applyFormat(undefined, "abc")).toBe("abc");
  });

  test("layoutStyles respects row and column", () => {
    const row = layoutStyles({ ...baseCtrl, layout: "row-spread" });
    expect(row.flexDirection).toBe("row");
    const col = layoutStyles({ ...baseCtrl, layout: "column" });
    expect(col.flexDirection).toBe("column");
  });

  test("mergeStyleString overlays inline styles", () => {
    const merged = mergeStyleString({ color: "red", padding: "4px" }, "color: blue; margin: 2px;");
    expect(merged.color).toBe("blue");
    expect(merged.margin).toBe("2px");
    expect(merged.padding).toBe("4px");
  });
});
