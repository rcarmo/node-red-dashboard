import { describe, expect, test } from "bun:test";
import { App } from "./index";

describe("App shell", () => {
  test("App is a function component", () => {
    expect(typeof App).toBe("function");
  });
});
