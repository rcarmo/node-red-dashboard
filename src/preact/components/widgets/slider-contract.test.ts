import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { render } from "@testing-library/preact";
import { Window } from "happy-dom";
import { SliderWidget } from "./slider";

if (typeof document === "undefined") {
  const { window } = new Window();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).document = window.document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLElement = window.HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLInputElement = window.HTMLInputElement;
}

describe("Slider widget parity", () => {
  test("shows sign and applies invert on vertical sliders", () => {
    const { container } = render(
      h(SliderWidget, {
        control: {
          label: "Volume",
          value: 3,
          min: 0,
          max: 10,
          width: 10,
          height: 120,
          showSign: true,
          invert: true,
        },
        index: 0,
      }),
    );

    const sign = container.querySelector(".nr-dashboard-slider__sign") as HTMLElement;
    expect(sign).toBeTruthy();
    expect(sign.textContent).toBe("3");

    const input = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(input.getAttribute("style") || "").toContain("rotate(180deg)");
  });
});
