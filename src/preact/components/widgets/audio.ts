import { html } from "htm/preact";
import type { VNode } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

export type AudioControl = UiControl & {
  name?: string;
  label?: string;
  url?: string;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
  play?: boolean;
  stop?: boolean;
  reset?: boolean;
};

export function shouldAutoPlay(isDisabled: boolean, autoplay?: boolean): boolean {
  return Boolean(autoplay) && !isDisabled;
}

export function AudioWidget(props: { control: UiControl; index: number; disabled?: boolean }): VNode {
  const { control, index, disabled } = props;
  const c = control as AudioControl;
  const { t } = useI18n();
  const label = c.label || c.name || t("audio_label", "Audio {index}", { index: index + 1 });
  const ref = useRef<HTMLAudioElement | null>(null);
  const isDisabled = Boolean(disabled);
  const [playIntent, setPlayIntent] = useState<boolean>(false);

  useEffect(() => {
    if (!ref.current) return;
    if (isDisabled) {
      ref.current.pause();
      setPlayIntent(false);
      return;
    }
    if (c.reset) {
      ref.current.pause();
      ref.current.currentTime = 0;
      setPlayIntent(false);
      return;
    }
    if (c.stop) {
      ref.current.pause();
      setPlayIntent(false);
      return;
    }
    if (shouldAutoPlay(isDisabled, c.autoplay) || c.play) {
      setPlayIntent(true);
      if (typeof ref.current.play === "function") {
        void ref.current.play().catch(() => undefined);
      }
    } else {
      setPlayIntent(false);
    }
  }, [c.autoplay, c.play, c.stop, c.reset, c.url, isDisabled]);

  return html`<div class=${`nr-dashboard-audio__outer ${c.className || ""}`.trim()}>
    <div class="nr-dashboard-audio__header">
      <i class="fa fa-volume-up nr-dashboard-audio__icon" aria-hidden="true"></i>
      <div class="nr-dashboard-audio__label">${label}</div>
    </div>
    <audio
      ref=${ref}
      src=${c.url || ""}
      controls
      loop=${Boolean(c.loop)}
      data-play-intent=${playIntent ? "true" : "false"}
      aria-disabled=${isDisabled}
      aria-label=${t("audio_controls", "Audio controls for {label}", { label })}
      tabIndex=${isDisabled ? -1 : undefined}
      class="nr-dashboard-audio__player"
      style=${{ pointerEvents: isDisabled ? "none" : "auto" }}
    ></audio>
  </div>`;
}
