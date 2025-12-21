import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { render } from "@testing-library/preact";
import { Window } from "happy-dom";
import { DropdownWidget } from "./dropdown";

if (typeof document === "undefined") {
  const { window } = new Window();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).document = window.document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLElement = window.HTMLElement;
}

describe("Dropdown ui_control updates", () => {
  test("updates options and selection when control changes", () => {
    const { container, rerender } = render(
      h(DropdownWidget, {
        control: {
          label: "Choose",
          options: [
            { label: "One", value: 1 },
            { label: "Two", value: 2 },
          ],
          value: 1,
        },
        index: 0,
      }),
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select.value).toBe("1");

    rerender(
      h(DropdownWidget, {
        control: {
          label: "Choose",
          options: [
            { label: "Three", value: 3 },
            { label: "Four", value: 4 },
          ],
          value: 4,
        },
        index: 0,
      }),
    );

    const options = Array.from(select.options).map((o) => o.textContent?.trim());
    expect(options).toEqual(["Three", "Four"]);
    expect(select.value).toBe("4");
  });
});
