import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { fireEvent, render, cleanup } from "@testing-library/preact";
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
    cleanup();
  });

  test("select fields render options and emit selection", () => {
    const emitted: Array<{ event: string; payload?: Record<string, unknown> }> = [];
    const { getByLabelText, getByRole } = render(
      h(FormWidget, {
        control: {
          label: "Account",
          fields: [
            {
              name: "role",
              label: "Role",
              type: "select",
              options: [
                { label: "Admin", value: "admin" },
                { label: "User", value: "user" },
              ],
            },
          ],
        },
        index: 0,
        onEmit: (event: string, payload?: Record<string, unknown>) => emitted.push({ event, payload }),
      }),
    );

    const select = getByLabelText("Role") as HTMLSelectElement;
    expect(select.options.length).toBe(2);

    fireEvent.change(select, { target: { value: "user" } });
    const button = getByRole("button") as HTMLButtonElement;
    fireEvent.submit(button.closest("form") as HTMLFormElement);

    const payload = emitted[0]?.payload as { payload?: Record<string, unknown> } | undefined;
    expect(emitted[0]?.event).toBe("ui-control");
    expect(payload?.payload?.role).toBe("user");
    cleanup();
  });

  test("radio fields enforce required selection", () => {
    const emitted: Array<{ event: string; payload?: Record<string, unknown> }> = [];
    const { getByLabelText, getByRole, queryByText } = render(
      h(FormWidget, {
        control: {
          label: "Survey",
          fields: [
            {
              name: "choice",
              label: "Pick one",
              type: "radio",
              required: true,
              options: [
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
              ],
            },
          ],
        },
        index: 0,
        onEmit: (event: string, payload?: Record<string, unknown>) => emitted.push({ event, payload }),
      }),
    );

    const button = getByRole("button") as HTMLButtonElement;
    fireEvent.submit(button.closest("form") as HTMLFormElement);

    expect(emitted.length).toBe(0);
    expect(queryByText("This field is required.")).not.toBeNull();

    fireEvent.click(getByLabelText("Yes") as HTMLInputElement);
    fireEvent.submit(button.closest("form") as HTMLFormElement);

    const payload = emitted[0]?.payload as { payload?: Record<string, unknown> } | undefined;
    expect(queryByText("This field is required.")).toBeNull();
    expect(payload?.payload?.choice).toBe("yes");
    cleanup();
  });
});
