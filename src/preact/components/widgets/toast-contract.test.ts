import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { fireEvent, render } from "@testing-library/preact";
import { Window } from "happy-dom";
import { ToastWidget } from "./toast";

if (typeof document === "undefined") {
  const { window } = new Window();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).document = window.document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLElement = window.HTMLElement;
}

describe("Toast widget parity", () => {
  test("auto-dismisses after displayTime", async () => {
    const { container } = render(
      h(ToastWidget, {
        control: { label: "Notice", message: "Hello", displayTime: 10 },
        index: 0,
      }),
    );

    expect(container.textContent || "").toContain("Hello");
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(container.textContent || "").toBe("");
  });

  test("dismiss button hides toast", async () => {
    const { getByLabelText, container } = render(
      h(ToastWidget, {
        control: { label: "Alert", message: "Closable", displayTime: 0, dismissible: true },
        index: 0,
      }),
    );

    fireEvent.click(getByLabelText(/close notification/i));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.textContent || "").toBe("");
  });
});
