import { describe, expect, test } from "bun:test";
import { resolveTemplateHtml } from "./template";

describe("Template helpers", () => {
  test("prefers template then format then empty", () => {
    expect(resolveTemplateHtml({ template: "<b>hi</b>" })).toBe("<b>hi</b>");
    expect(resolveTemplateHtml({ format: "<i>x</i>" })).toBe("<i>x</i>");
    expect(resolveTemplateHtml({})).toBe("");
  });
});
