import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { render, fireEvent } from "@testing-library/preact";
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

    // Custom dropdown uses button trigger with value display
    const trigger = container.querySelector(".nr-dashboard-dropdown__trigger") as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    const valueSpan = container.querySelector(".nr-dashboard-dropdown__value") as HTMLSpanElement;
    expect(valueSpan.textContent).toBe("One");

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

    expect(valueSpan.textContent).toBe("Four");
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

    // Open the dropdown by clicking trigger
    const trigger = container.querySelector(".nr-dashboard-dropdown__trigger") as HTMLButtonElement;
    fireEvent.click(trigger);

    // Select options by clicking them
    const options = container.querySelectorAll(".nr-dashboard-dropdown__option:not(.nr-dashboard-dropdown__option--all)");
    expect(options.length).toBe(2);
    fireEvent.click(options[0]); // Select first option
    fireEvent.click(options[1]); // Select second option

    // Close the dropdown to trigger emit (multiple mode emits on close)
    fireEvent.click(trigger);

    expect(emitted.length).toBeGreaterThan(0);
    const payload = emitted[emitted.length - 1] as unknown[];
    expect(Array.isArray(payload)).toBe(true);
    // The values should be parsed/typed
    expect(payload).toContainEqual(1); // number coerced
    expect(payload).toContainEqual({ a: 1 });
  });

  test("parses comma-separated initial multi values", () => {
    const { container } = render(
      h(DropdownWidget, {
        control: {
          label: "Roles",
          multiple: true,
          value: "admin,user",
          options: [
            { label: "Admin", value: "admin" },
            { label: "User", value: "user" },
          ],
        },
        index: 0,
      }),
    );

    // Custom dropdown shows count for multiple selections
    const valueSpan = container.querySelector(".nr-dashboard-dropdown__value") as HTMLSpanElement;
    // Should show "2 selected" for two items
    expect(valueSpan.textContent).toContain("2");
  });

  test("placeholder shown when value is empty", () => {
    const { container } = render(
      h(DropdownWidget, {
        control: {
          label: "Choose",
          place: "Pick one",
          options: [
            { label: "One", value: "1" },
            { label: "Two", value: "2" },
          ],
        },
        index: 0,
      }),
    );

    const valueSpan = container.querySelector(".nr-dashboard-dropdown__value") as HTMLSpanElement;
    expect(valueSpan.textContent).toBe("Pick one");
  });

  test("clears selection when options change", () => {
    const { container, rerender } = render(
      h(DropdownWidget, {
        control: {
          label: "Choose",
          options: [
            { label: "One", value: "1" },
            { label: "Two", value: "2" },
          ],
          value: "2",
        },
        index: 0,
      }),
    );

    const valueSpan = container.querySelector(".nr-dashboard-dropdown__value") as HTMLSpanElement;
    expect(valueSpan.textContent).toBe("Two");

    rerender(
      h(DropdownWidget, {
        control: {
          label: "Choose",
          options: [{ label: "Three", value: "3" }],
          value: "2",
        },
        index: 0,
      }),
    );

    // When value is not in options, should show placeholder/default
    expect(valueSpan.textContent).not.toBe("Two");
  });

  test("clears selection when resetSelection is true", () => {
    const { container, rerender } = render(
      h(DropdownWidget, {
        control: {
          label: "Choose",
          options: [
            { label: "One", value: "1" },
            { label: "Two", value: "2" },
          ],
          value: "2",
        },
        index: 0,
      }),
    );

    const valueSpan = container.querySelector(".nr-dashboard-dropdown__value") as HTMLSpanElement;
    expect(valueSpan.textContent).toBe("Two");

    rerender(
      h(DropdownWidget, {
        control: {
          label: "Choose",
          options: [
            { label: "One", value: "1" },
            { label: "Two", value: "2" },
          ],
          value: "2",
          resetSelection: true,
        },
        index: 0,
      }),
    );

    // Should show placeholder when reset
    expect(valueSpan.textContent).not.toBe("Two");
  });
});
