import { html } from "htm/preact";
import type { VNode } from "preact";
import { useEffect, useRef } from "preact/hooks";
import type { UiControl } from "../../state";

export type AudioControl = UiControl & {
  name?: string;
  label?: string;
  url?: string;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
};

export function shouldAutoPlay(isDisabled: boolean, autoplay?: boolean): boolean {
  return Boolean(autoplay) && !isDisabled;
}

export function AudioWidget(props: { control: UiControl; index: number; disabled?: boolean }): VNode {
  const { control, index, disabled } = props;
  const c = control as AudioControl;
  const label = c.label || c.name || `Audio ${index + 1}`;
  const ref = useRef<HTMLAudioElement | null>(null);
  const isDisabled = Boolean(disabled);

  useEffect(() => {
    if (!ref.current) return;
    if (isDisabled) {
      ref.current.pause();
      return;
    }
    if (shouldAutoPlay(isDisabled, c.autoplay)) {
      void ref.current.play().catch(() => undefined);
    }
  }, [c.autoplay, c.url, isDisabled]);

  return html`<div class=${c.className || ""}>
    <div style=${{ fontSize: "12px", opacity: 0.7, marginBottom: "4px" }}>${label}</div>
    <audio
      ref=${ref}
      src=${c.url || ""}
      controls
      loop=${Boolean(c.loop)}
      aria-disabled=${isDisabled}
      tabIndex=${isDisabled ? -1 : undefined}
      style=${{ width: "100%", pointerEvents: isDisabled ? "none" : "auto" }}
    ></audio>
  </div>`;
}
