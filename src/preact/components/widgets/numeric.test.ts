import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { render, screen } from "@testing-library/preact";
import { buildNumericEmit, clampValue, NumericWidget } from "./numeric";
import { I18nProvider } from "../../lib/i18n";

describe("Numeric helpers", () => {
  test("clamps with wrap", () => {
    expect(clampValue(11, 1, 10, true)).toBe(1);
    expect(clampValue(0, 1, 10, true)).toBe(10);
  });

  test("clamps without wrap", () => {
    expect(clampValue(11, 1, 10, false)).toBe(10);
    expect(clampValue(0, 1, 10, false)).toBe(1);
  });

  test("builds emit payload", () => {
    const payload = buildNumericEmit({}, "Label", 3.14);
    expect(payload).toEqual({ payload: 3.14, topic: "Label", type: "numeric" });
  });

  test("updates when control value changes", async () => {
    const renderWithI18n = (control: Record<string, unknown>) =>
      render(h(I18nProvider, { lang: "en", locales: { en: {} } }, h(NumericWidget, { control, index: 0 })));

    const control = { value: 1, min: 0, max: 10, step: 1 };
    const { rerender, container } = renderWithI18n(control);

    const input = container.querySelector("input[type=number]") as HTMLInputElement;
    expect(input.value).toBe("1");
    expect(screen.getByText(/Number 1:/).textContent).toContain("1");

    const nextControl = { ...control, value: 5 };
    rerender(h(I18nProvider, { lang: "en", locales: { en: {} } }, h(NumericWidget, { control: nextControl, index: 0 })));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(input.value).toBe("5");
    expect(screen.getByText(/Number 1:/).textContent).toContain("5");
  });
});
