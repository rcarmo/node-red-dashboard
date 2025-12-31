import { html } from "htm/preact";
import type { VNode } from "preact";
import { useCallback, useState } from "preact/hooks";
import { resolveToastToneColor } from "./widgets/toast";
import type { ToastMessage } from "../state";
import { useI18n } from "../lib/i18n";

export type DialogResult = {
  ok: boolean;
  value?: string;
};

export type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";

function DialogToast(props: {
  toast: ToastMessage;
  onResult: (result: DialogResult) => void;
  t: (key: string, fallback: string) => string;
}): VNode {
  const { toast, onResult, t } = props;
  const [inputValue, setInputValue] = useState<string>(toast.promptDefault || "");
  const toneColor = resolveToastToneColor(toast.level ?? "info");
  const borderColor = toast.highlight || toneColor;
  const isPrompt = toast.dialogType === "prompt";

  const handleOk = useCallback(() => {
    onResult({ ok: true, value: isPrompt ? inputValue : undefined });
  }, [onResult, isPrompt, inputValue]);

  const handleCancel = useCallback(() => {
    onResult({ ok: false });
  }, [onResult]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleOk();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  }, [handleOk, handleCancel]);

  const messageNode = toast.raw
    ? html`<div class="nr-dashboard-toast-message" dangerouslySetInnerHTML=${{ __html: String(toast.message ?? "") }}></div>`
    : html`<div class="nr-dashboard-toast-message">${String(toast.message ?? "")}</div>`;

  return html`<div class="nr-dashboard-dialog-backdrop" onClick=${handleCancel}>
    <div
      class=${`nr-dashboard-dialog ${toast.className || ""}`.trim()}
      style=${{ borderTop: `4px solid ${borderColor}` }}
      role="dialog"
      aria-modal="true"
      aria-labelledby=${`dialog-title-${toast.id}`}
      onClick=${(e: Event) => e.stopPropagation()}
      onKeyDown=${handleKeyDown}
    >
      <div id=${`dialog-title-${toast.id}`} class="nr-dashboard-dialog__title" style=${{ color: toneColor }}>
        ${toast.title || t("toast_overlay_title", "Notification")}
      </div>
      ${messageNode}
      ${isPrompt ? html`<div class="nr-dashboard-dialog__input-row">
        <input
          type="text"
          class="nr-dashboard-dialog__input"
          value=${inputValue}
          onInput=${(e: Event) => setInputValue((e.target as HTMLInputElement).value)}
          placeholder=${toast.promptPlaceholder || ""}
          autofocus
        />
      </div>` : null}
      <div class="nr-dashboard-dialog__buttons">
        ${toast.showCancel !== false ? html`<button
          type="button"
          class="nr-dashboard-dialog__btn nr-dashboard-dialog__btn--cancel"
          onClick=${handleCancel}
        >
          ${toast.cancelLabel || t("dialog_cancel", "Cancel")}
        </button>` : null}
        <button
          type="button"
          class="nr-dashboard-dialog__btn nr-dashboard-dialog__btn--ok"
          style=${{ background: toneColor }}
          onClick=${handleOk}
        >
          ${toast.okLabel || t("dialog_ok", "OK")}
        </button>
      </div>
    </div>
  </div>`;
}

function NotificationToast(props: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  t: (key: string, fallback: string) => string;
}): VNode {
  const { toast, onDismiss, t } = props;
  const toneColor = resolveToastToneColor(toast.level ?? "info");
  const borderColor = toast.highlight || toneColor;
  const liveMode = toast.level === "error" ? "assertive" : "polite";

  const messageNode = toast.raw
    ? html`<div class="nr-dashboard-toast-message" dangerouslySetInnerHTML=${{ __html: String(toast.message ?? "") }}></div>`
    : html`<div class="nr-dashboard-toast-message">${String(toast.message ?? "")}</div>`;

  return html`<div
    key=${toast.id}
    class=${`nr-dashboard-toast-card ${toast.className || ""}`.trim()}
    style=${{ borderLeft: `4px solid ${borderColor}` }}
    role="status"
    aria-live=${liveMode}
    aria-atomic="true"
  >
    <div class="nr-dashboard-toast-title" style=${{ color: toneColor }}>
      ${toast.title || t("toast_overlay_title", "Notification")}
    </div>
    ${messageNode}
    ${toast.dismissible !== false ? html`<button
      type="button"
      class="nr-dashboard-toast-close"
      onClick=${() => onDismiss(toast.id)}
      aria-label=${t("toast_close", "Close notification")}
    >×</button>` : null}
  </div>`;
}

export function ToastOverlay(props: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onDialogResult?: (id: string, result: DialogResult) => void;
}): VNode {
  const { toasts, onDismiss, onDialogResult } = props;
  if (!toasts.length) return null;
  const { t } = useI18n();

  // Separate dialog toasts from notification toasts
  const dialogs = toasts.filter((toast) => toast.dialogType === "dialog" || toast.dialogType === "prompt");
  const notifications = toasts.filter((toast) => !toast.dialogType || toast.dialogType === "notification");

  // Group notifications by position
  const positions: Record<ToastPosition, ToastMessage[]> = {
    "top-right": [],
    "top-left": [],
    "bottom-right": [],
    "bottom-left": [],
    "top-center": [],
    "bottom-center": [],
  };

  notifications.forEach((toast) => {
    const pos = (toast.position as ToastPosition) || "top-right";
    if (positions[pos]) {
      positions[pos].push(toast);
    } else {
      positions["top-right"].push(toast);
    }
  });

  const handleDialogResult = (toast: ToastMessage, result: DialogResult) => {
    onDismiss(toast.id);
    onDialogResult?.(toast.id, result);
  };

  return html`<div class="nr-dashboard-toast-wrapper">
    ${dialogs.map((toast) => html`<${DialogToast}
      key=${toast.id}
      toast=${toast}
      onResult=${(result: DialogResult) => handleDialogResult(toast, result)}
      t=${t}
    />`)}
    ${Object.entries(positions).map(([pos, posToasts]) => {
      if (!posToasts.length) return null;
      return html`<div key=${pos} class=${`nr-dashboard-toast-overlay nr-dashboard-toast-overlay--${pos}`}>
        ${posToasts.map((toast) => html`<${NotificationToast}
          key=${toast.id}
          toast=${toast}
          onDismiss=${onDismiss}
          t=${t}
        />`)}
      </div>`;
    })}
  </div>`;
}
