import { html } from "htm/preact";
import { useEffect, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useI18n } from "../../lib/i18n";

export type ToastControl = UiControl & {
  name?: string;
  label?: string;
  message?: string;
  level?: "info" | "warn" | "error";
  displayTime?: number; // milliseconds; <=0 means persistent
  dismissible?: boolean;
  className?: string;
};

export function resolveToastToneColor(level?: "info" | "warn" | "error"): string {
  if (level === "error") return "var(--nr-dashboard-errorColor, #f87171)";
  if (level === "warn") return "var(--nr-dashboard-warnColor, #facc15)";
  return "var(--nr-dashboard-infoColor, #60a5fa)";
}

export function ToastWidget(props: { control: UiControl; index: number }): VNode {
  const { control, index } = props;
  const c = control as ToastControl;
  const { t } = useI18n();
  const label = c.label || c.name || t("toast_label", "Toast {index}", { index: index + 1 });
  const msg = c.message || t("toast_message", "Toast message");
  const tone = c.level || "info";
  const toneColor = resolveToastToneColor(tone);
  const [visible, setVisible] = useState<boolean>(true);
  const dismissible = c.dismissible !== false;
  const displayMs = Number.isFinite(c.displayTime) ? Math.max(0, Number(c.displayTime)) : 3000;
  const [stackOffset, setStackOffset] = useState<number>(index * 4);

  useEffect(() => {
    setVisible(true);
    setStackOffset(index * 4);
    if (displayMs > 0) {
      const timer = window.setTimeout(() => setVisible(false), displayMs);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [c.message, c.label, c.level, displayMs]);

  if (!visible) return null;

  return html`<div
    class=${`nr-dashboard-toast__container ${c.className || ""}`.trim()}
    style=${{  
      borderLeft: `4px solid ${toneColor}`,
      margin: `${6 + stackOffset}px 0 6px 0`,
    }}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <div class="nr-dashboard-toast__title" style=${{ color: toneColor }}>${label}</div>
    <div class="nr-dashboard-toast__body">${msg}</div>
    ${dismissible
      ? html`<button
          type="button"
          class="nr-dashboard-toast__close"
          aria-label=${t("toast_close", "Close notification")}
          onClick=${() => setVisible(false)}
          style=${{ color: toneColor }}
        >×</button>`
      : null}
  </div>`;
}
