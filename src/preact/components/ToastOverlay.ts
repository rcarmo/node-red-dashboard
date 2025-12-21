import { html } from "htm/preact";
import type { VNode } from "preact";
import { resolveToastToneColor } from "./widgets/toast";
import type { ToastMessage } from "../state";

export function ToastOverlay(props: { toasts: ToastMessage[]; onDismiss: (id: string) => void }): VNode {
  const { toasts, onDismiss } = props;
  if (!toasts.length) return null;

  return html`<div
    style=${{
      position: "fixed",
      top: "16px",
      right: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      zIndex: 9999,
      pointerEvents: "none",
    }}
  >
    ${toasts.map((toast) => {
      const toneColor = resolveToastToneColor(toast.level ?? "info");
      return html`<div
        key=${toast.id}
        style=${{
          border: `1px solid ${toneColor}`,
          padding: "10px 12px",
          borderRadius: "8px",
          background: "rgba(20,22,28,0.9)",
          color: "#fff",
          minWidth: "260px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          pointerEvents: "auto",
          position: "relative",
        }}
      >
        <div style=${{ fontWeight: 700, marginBottom: "4px" }}>${toast.title || "Notification"}</div>
        <div style=${{ fontSize: "13px" }}>${String(toast.message ?? "")}</div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick=${() => onDismiss(toast.id)}
          style=${{
            position: "absolute",
            top: "6px",
            right: "6px",
            background: "transparent",
            border: "none",
            color: toneColor,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >x</button>
      </div>`;
    })}
  </div>`;
}
