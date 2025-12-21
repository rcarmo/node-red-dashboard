import { describe, expect, test } from "bun:test";
import { resolveLinkHref } from "./link";

describe("Link helpers", () => {
  test("prefers url then link then fallback", () => {
    expect(resolveLinkHref({ url: "https://a" })).toBe("https://a");
    expect(resolveLinkHref({ link: "https://b" }, "#" as string)).toBe("https://b");
    expect(resolveLinkHref({}, "#" as string)).toBe("#");
  });
});
