import { html } from "htm/preact";
import type { VNode } from "preact";
import { resolveToastToneColor } from "./widgets/toast";
import type { ToastMessage } from "../state";
import { useI18n } from "../lib/i18n";

export function ToastOverlay(props: { toasts: ToastMessage[]; onDismiss: (id: string) => void }): VNode {
  const { toasts } = props;
  if (!toasts.length) return null;
  const { t } = useI18n();

  return html`<div class="nr-dashboard-toast-overlay">
    ${toasts.map((toast) => {
      const toneColor = resolveToastToneColor(toast.level ?? "info");
      const borderColor = toast.highlight || toneColor;
      const liveMode = toast.level === "error" ? "assertive" : "polite";
      const messageNode =
        typeof toast.message === "string"
          ? html`<div class="nr-dashboard-toast-message" dangerouslySetInnerHTML=${{ __html: toast.message }}></div>`
          : html`<div class="nr-dashboard-toast-message">${String(toast.message ?? "")}</div>`;

      return html`<div
        key=${toast.id}
        class=${`nr-dashboard-toast-card ${toast.className || ""}`.trim()}
        style=${{ border: `4px solid ${borderColor}` }}
        role="status"
        aria-live=${liveMode}
        aria-atomic="true"
      >
        <div class="nr-dashboard-toast-title">${toast.title || t("toast_overlay_title", "Notification")}</div>
        ${messageNode}
      </div>`;
    })}
  </div>`;
}
