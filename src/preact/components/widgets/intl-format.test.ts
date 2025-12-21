import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { render } from "@testing-library/preact";
import { SliderWidget } from "./slider";
import { NumericWidget } from "./numeric";
import { DatePickerWidget } from "./date-picker";
import { I18nProvider } from "../../lib/i18n";

const renderWithI18n = (node: preact.VNode, lang: string) =>
  render(h(I18nProvider, { lang, locales: { [lang]: {} } }, node));

describe("Locale formatting", () => {
  test("Slider shows localized value", () => {
    const { container } = renderWithI18n(
      h(SliderWidget, {
        control: { value: 1234, min: 0, max: 2000, step: 1, outs: "all" },
        index: 0,
      }),
      "de",
    );

    const value = container.querySelector(".nr-dashboard-slider__value") as HTMLElement;
    expect(value.textContent).toContain("1.234");
    const input = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(input.getAttribute("aria-valuetext")).toContain("1.234");
  });

  test("Numeric shows localized value label", () => {
    const { container } = renderWithI18n(
      h(NumericWidget, {
        control: { value: 1234, min: 0, max: 2000, step: 1 },
        index: 0,
      }),
      "de",
    );

    const label = container.querySelector("span[style]") as HTMLElement;
    expect(container.textContent).toContain("1.234");
    const input = container.querySelector("input[type=number]") as HTMLInputElement;
    expect(input.getAttribute("aria-valuetext")).toContain("1.234");
  });

  test("Date picker aria-valuetext uses locale", () => {
    const { getByLabelText } = renderWithI18n(
      h(DatePickerWidget, {
        control: { label: "Date", value: "2024-12-31", mode: "date" },
        index: 0,
      }),
      "de",
    );

    const input = getByLabelText("Date") as HTMLInputElement;
    expect(input.getAttribute("aria-valuetext")).toContain("31.12.2024");
  });
});
