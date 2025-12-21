import { html } from "htm/preact";
import type { VNode } from "preact";
import { resolveToastToneColor } from "./widgets/toast";
import type { ToastMessage } from "../state";
import {
  overlayStyles,
  cardBaseStyles,
  titleStyles,
  messageStyles,
  closeButtonStyles,
} from "./styles/toastStyles";
import { useI18n } from "../lib/i18n";

export function ToastOverlay(props: { toasts: ToastMessage[]; onDismiss: (id: string) => void }): VNode {
  const { toasts, onDismiss } = props;
  if (!toasts.length) return null;
  const { t } = useI18n();

  return html`<div
    style=${overlayStyles}
  >
    ${toasts.map((toast) => {
      const toneColor = resolveToastToneColor(toast.level ?? "info");
      return html`<div
        key=${toast.id}
        style=${{ ...cardBaseStyles, border: `1px solid ${toneColor}` }}
      >
        <div style=${titleStyles}>${toast.title || t("toast_overlay_title", "Notification")}</div>
        <div style=${messageStyles}>${String(toast.message ?? "")}</div>
        <button
          type="button"
          aria-label=${t("toast_overlay_close", "Dismiss notification")}
          onClick=${() => onDismiss(toast.id)}
          style=${{
            ...closeButtonStyles,
            color: toneColor,
          }}
        >x</button>
      </div>`;
    })}
  </div>`;
}
