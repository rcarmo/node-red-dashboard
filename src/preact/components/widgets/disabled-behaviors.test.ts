import { describe, expect, test } from "bun:test";
import { h } from "preact";
import type { VNode } from "preact";
import { Window } from "happy-dom";
import { fireEvent, render, cleanup } from "@testing-library/preact";
import { SliderWidget } from "./slider";
import { FormWidget } from "./form";
import { DatePickerWidget } from "./date-picker";
import { ColourPickerWidget } from "./colour-picker";
import { AudioWidget } from "./audio";
import { LinkWidget } from "./link";
import { I18nProvider } from "../../lib/i18n";

if (typeof document === "undefined") {
  const { window } = new Window();
  (globalThis as { window?: Window }).window = window;
  (globalThis as { document?: Document }).document = window.document as unknown as Document;
  (globalThis as { HTMLElement?: typeof HTMLElement }).HTMLElement = window.HTMLElement as typeof HTMLElement;
  (globalThis as { HTMLInputElement?: typeof HTMLInputElement }).HTMLInputElement = window.HTMLInputElement as typeof HTMLInputElement;
  (globalThis as { HTMLAudioElement?: typeof HTMLAudioElement }).HTMLAudioElement = window.HTMLAudioElement as typeof HTMLAudioElement;
  (globalThis as { navigator?: Navigator }).navigator = window.navigator as Navigator;
  if (!(globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame) {
    (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame = (cb: (ts: number) => void) =>
      setTimeout(() => cb(performance.now()), 16);
  }
}

const flushTimers = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

const withI18n = (node: VNode) => render(h(I18nProvider, { lang: "en", locales: { en: {} } }, node));

describe("Widget disabled behavior", () => {
  test("Slider does not emit when disabled", async () => {
    const emitted: Array<{ event: string; payload?: Record<string, unknown> }> = [];
    const { container } = withI18n(
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
    cleanup();
  });

  test("Slider emits when enabled", async () => {
    const emitted: Array<{ event: string; payload?: Record<string, unknown> }> = [];
    const { container } = withI18n(
      h(SliderWidget, {
        control: { value: 1, min: 0, max: 10, step: 1, outs: "all" },
        index: 0,
        disabled: false,
        onEmit: (event: string, payload?: Record<string, unknown>) => emitted.push({ event, payload }),
      }),
    );

    const input = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "6" } });
    fireEvent.change(input, { target: { value: "6" } });
    await flushTimers(40);

    expect(emitted.length).toBeGreaterThan(0);
    expect(emitted[0].event).toBe("ui-control");
    expect(emitted[0].payload?.payload).toBe(6);
    cleanup();
  });

  test("Form disables fields and blocks submit", () => {
    const emitted: Array<Record<string, unknown>> = [];
    const { getByLabelText, getByRole } = withI18n(
      h(FormWidget, {
        control: { fields: [{ name: "username", label: "User" }] },
        index: 0,
        disabled: true,
        onEmit: (_event: string, payload?: Record<string, unknown>) => emitted.push(payload ?? {}),
      }),
    );

    const input = getByLabelText("User") as HTMLInputElement;
    const button = getByRole("button") as HTMLButtonElement;
    expect(input.disabled).toBe(true);
    expect(button.disabled).toBe(true);

    fireEvent.submit(button.closest("form") as HTMLFormElement);
    expect(emitted.length).toBe(0);
    cleanup();
  });

  test("Date picker blocks emit when disabled", () => {
    const emitted: Array<Record<string, unknown>> = [];
    const { getByLabelText } = withI18n(
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
    cleanup();
  });

  test("Colour picker blocks emit when disabled", () => {
    const emitted: Array<Record<string, unknown>> = [];
    const { getByLabelText } = withI18n(
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
    cleanup();
  });

  test("Audio honors disabled state", () => {
    const { container } = withI18n(
      h(AudioWidget, {
        control: { label: "Audio", url: "https://example.com/sound.mp3", autoplay: true },
        index: 0,
        disabled: true,
      }),
    );

    const audio = container.querySelector("audio") as HTMLAudioElement;
    expect(audio.getAttribute("aria-disabled")).toBe("true");
    expect(audio.tabIndex).toBe(-1);
    cleanup();
  });

  test("Link disables navigation when disabled", () => {
    const { container } = withI18n(
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
    cleanup();
  });
});
