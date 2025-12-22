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

  return html`<div class=${c.className || ""} style=${{ width: "100%" }}>
    <div
      style=${{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 10px",
        borderRadius: "8px",
        background: "var(--nr-dashboard-widgetBackgroundColor, transparent)",
        border: "1px solid var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.12))",
        marginBottom: "6px",
      }}
    >
      <i class="fa fa-volume-up" aria-hidden="true" style=${{ fontSize: "16px" }}></i>
      <div style=${{ fontSize: "13px", opacity: 0.78 }}>${label}</div>
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
      style=${{ width: "100%", pointerEvents: isDisabled ? "none" : "auto", borderRadius: "6px" }}
    ></audio>
  </div>`;
}
