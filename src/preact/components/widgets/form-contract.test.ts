import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { render } from "@testing-library/preact";
import { Window } from "happy-dom";
import { FormWidget } from "./form";

if (typeof document === "undefined") {
  const { window } = new Window();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).document = window.document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLElement = window.HTMLElement;
}

describe("Form widget parity", () => {
  test("applies required and placeholder to fields", () => {
    const { getByLabelText } = render(
      h(FormWidget, {
        control: {
          label: "Account",
          fields: [
            { name: "username", label: "Username", required: true, placeholder: "Enter user" },
          ],
        },
        index: 0,
      }),
    );

    const input = getByLabelText("Username") as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.placeholder).toBe("Enter user");
  });
});
