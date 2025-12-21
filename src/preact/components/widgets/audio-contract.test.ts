import { describe, expect, test } from "bun:test";
import { h } from "preact";
import { render } from "@testing-library/preact";
import { Window } from "happy-dom";
import { AudioWidget } from "./audio";

if (typeof document === "undefined") {
  const { window } = new Window();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).document = window.document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLElement = window.HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLAudioElement = window.HTMLAudioElement;
}

describe("Audio widget parity", () => {
  test("play intent toggles with control flags", () => {
    const { container, rerender } = render(
      h(AudioWidget, {
        control: { label: "A", url: "https://example.com/a.mp3", play: true },
        index: 0,
      }),
    );

    const audio = container.querySelector("audio") as HTMLAudioElement;
    expect(audio.getAttribute("data-play-intent")).toBe("true");

    rerender(
      h(AudioWidget, {
        control: { label: "A", url: "https://example.com/a.mp3", stop: true },
        index: 0,
      }),
    );

    expect(audio.getAttribute("data-play-intent")).toBe("false");
  });

  test("reset clears playback position", () => {
    const { container, rerender } = render(
      h(AudioWidget, {
        control: { label: "A", url: "https://example.com/a.mp3", play: true },
        index: 0,
      }),
    );

    const audio = container.querySelector("audio") as HTMLAudioElement;
    audio.currentTime = 5;

    rerender(
      h(AudioWidget, {
        control: { label: "A", url: "https://example.com/a.mp3", reset: true },
        index: 0,
      }),
    );

    expect(audio.currentTime).toBe(0);
  });
});
