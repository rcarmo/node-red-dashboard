import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { fireEvent, render } from "@testing-library/preact";
import { Window } from "happy-dom";
import { SliderWidget } from "./slider";
import { FormWidget } from "./form";
import { DatePickerWidget } from "./date-picker";
import { ColourPickerWidget } from "./colour-picker";
import { AudioWidget } from "./audio";
import { LinkWidget } from "./link";

if (typeof document === "undefined") {
  const { window } = new Window();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).document = window.document;
  // Mirror common constructors for tests that rely on them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLElement = window.HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLInputElement = window.HTMLInputElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLAudioElement = window.HTMLAudioElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).navigator = window.navigator;
}

const flushTimers = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Widget disabled behavior", () => {
  test("Slider does not emit when disabled", async () => {
    const emitted: Array<{ event: string; payload?: Record<string, unknown> }> = [];
    const { container } = render(
      h(SliderWidget, {
        control: { value: 1, min: 0, max: 10, step: 1 },
        index: 0,
        disabled: true,
        onEmit: (event: string, payload?: Record<string, unknown>) => emitted.push({ event, payload }),
      }),
    );

    const input = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "5" } });
    await flushTimers();

    expect(input.disabled).toBe(true);
    expect(emitted.length).toBe(0);
  });

  test("Slider emits when enabled", async () => {
    const emitted: Array<{ event: string; payload?: Record<string, unknown> }> = [];
    const { container } = render(
      h(SliderWidget, {
        control: { value: 1, min: 0, max: 10, step: 1 },
        index: 0,
        disabled: false,
        onEmit: (event: string, payload?: Record<string, unknown>) => emitted.push({ event, payload }),
      }),
    );

    const input = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "6" } });
    await flushTimers();

    expect(emitted.length).toBeGreaterThan(0);
    expect(emitted[0].event).toBe("ui-control");
    expect(emitted[0].payload?.payload).toBe(6);
  });

  test("Form disables fields and blocks submit", () => {
    const emitted: Array<Record<string, unknown>> = [];
    const { getByText, getByLabelText } = render(
      h(FormWidget, {
        control: { fields: [{ name: "username", label: "User" }] },
        index: 0,
        disabled: true,
        onEmit: (_event: string, payload?: Record<string, unknown>) => emitted.push(payload ?? {}),
      }),
    );

    const input = getByLabelText("User") as HTMLInputElement;
    const button = getByText(/submit/i) as HTMLButtonElement;
    expect(input.disabled).toBe(true);
    expect(button.disabled).toBe(true);

    fireEvent.submit(button.closest("form") as HTMLFormElement);
    expect(emitted.length).toBe(0);
  });

  test("Date picker blocks emit when disabled", () => {
    const emitted: Array<Record<string, unknown>> = [];
    const { getByLabelText } = render(
      h(DatePickerWidget, {
        control: { label: "Date", value: "" },
        index: 0,
        disabled: true,
        onEmit: (_event: string, payload?: Record<string, unknown>) => emitted.push(payload ?? {}),
      }),
    );

    const input = getByLabelText("Date") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "2024-01-01" } });
    expect(input.disabled).toBe(true);
    expect(emitted.length).toBe(0);
  });

  test("Colour picker blocks emit when disabled", () => {
    const emitted: Array<Record<string, unknown>> = [];
    const { getByLabelText } = render(
      h(ColourPickerWidget, {
        control: { label: "Colour", value: "#000000" },
        index: 0,
        disabled: true,
        onEmit: (_event: string, payload?: Record<string, unknown>) => emitted.push(payload ?? {}),
      }),
    );

    const input = getByLabelText("Colour") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "#ffffff" } });
    expect(input.disabled).toBe(true);
    expect(emitted.length).toBe(0);
  });

  test("Audio honors disabled state", () => {
    const { container } = render(
      h(AudioWidget, {
        control: { label: "Audio", url: "https://example.com/sound.mp3", autoplay: true },
        index: 0,
        disabled: true,
      }),
    );

    const audio = container.querySelector("audio") as HTMLAudioElement;
    expect(audio.getAttribute("aria-disabled")).toBe("true");
    expect(audio.tabIndex).toBe(-1);
  });

  test("Link disables navigation when disabled", () => {
    const { container } = render(
      h(LinkWidget, {
        control: { label: "Docs", url: "https://example.com" },
        index: 0,
        disabled: true,
      }),
    );

    const anchor = container.querySelector("a") as HTMLAnchorElement;
    expect(anchor.getAttribute("href")).toBe(null);
    expect(anchor.getAttribute("aria-disabled")).toBe("true");
    expect(anchor.tabIndex).toBe(-1);
  });
});
