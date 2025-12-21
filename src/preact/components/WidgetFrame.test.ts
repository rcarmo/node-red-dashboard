import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { render } from "@testing-library/preact";
import { Window } from "happy-dom";
import { WidgetFrame } from "./WidgetFrame";

if (typeof document === "undefined") {
  const { window } = new Window();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).document = window.document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLElement = window.HTMLElement;
}

describe("WidgetFrame disabled handling", () => {
  test("respects explicit disabled prop", () => {
    const { container } = render(
      h(
        WidgetFrame,
        { control: {}, disabled: true },
        h("div", { "data-testid": "child" }, "child"),
      ),
    );

    const frame = container.firstElementChild as HTMLElement;
    expect(frame.getAttribute("aria-disabled")).toBe("true");
    expect(frame.style.pointerEvents).toBe("none");
  });

  test("disables when control.disabled is true", () => {
    const { container } = render(h(WidgetFrame, { control: { disabled: true } }, h("div", null)));
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.getAttribute("aria-disabled")).toBe("true");
  });

  test("disables when control.enabled is false", () => {
    const { container } = render(h(WidgetFrame, { control: { enabled: false } }, h("div", null)));
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.getAttribute("aria-disabled")).toBe("true");
  });

  test("stays enabled by default", () => {
    const { container } = render(h(WidgetFrame, { control: {} }, h("div", null)));
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.getAttribute("aria-disabled")).toBe("false");
    expect(frame.style.pointerEvents).toBe("auto");
  });
});
