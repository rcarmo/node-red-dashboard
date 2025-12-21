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

  test("emits typed values (number/json) and multi-select arrays", () => {
    const emitted: unknown[] = [];
    const { container } = render(
      h(DropdownWidget, {
        control: {
          label: "Choose",
          multiple: true,
          options: [
            { label: "One", value: "1", type: "num" },
            { label: "Obj", value: { a: 1 }, type: "json" },
          ],
        },
        index: 0,
        onEmit: (_ev: string, msg?: Record<string, unknown>) => {
          emitted.push(msg?.payload);
        },
      }),
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    select.options[0].selected = true;
    select.options[1].selected = true;
    select.dispatchEvent(new window.Event("change", { bubbles: true }));

    expect(Array.isArray(emitted[0])).toBe(true);
    const payload = emitted[0] as unknown[];
    expect(payload[0]).toBe(1); // number coerced
    expect(payload[1]).toEqual({ a: 1 });
  });
});
