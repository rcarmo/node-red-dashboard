import { describe, expect, test } from "bun:test";
import { resolveToastToneColor } from "./toast";

describe("Toast helpers", () => {
  test("resolves tone colors", () => {
    expect(resolveToastToneColor()).toBe("var(--nr-dashboard-infoColor, #60a5fa)");
    expect(resolveToastToneColor("info")).toBe("var(--nr-dashboard-infoColor, #60a5fa)");
    expect(resolveToastToneColor("warn")).toBe("var(--nr-dashboard-warnColor, #facc15)");
    expect(resolveToastToneColor("error")).toBe("var(--nr-dashboard-errorColor, #f87171)");
  });
});
