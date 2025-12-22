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

  useEffect(() => {
    setVisible(true);
    if (displayMs > 0) {
      const timer = window.setTimeout(() => setVisible(false), displayMs);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [c.message, c.label, c.level, displayMs]);

        border: "1px solid transparent",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        padding: "10px 12px",
        background: "var(--nr-dashboard-widgetBackgroundColor, rgba(0,0,0,0.55))",
        position: "relative",
        borderRadius: "4px",
    style=${{
      border: `1px solid ${toneColor}`,
      padding: "8px 10px",
      background: "var(--nr-dashboard-widgetBackgroundColor, rgba(255,255,255,0.06))",
      position: "relative",
    }}
    role="status"
    aria-live="polite"
  >
    <div style=${{ fontWeight: 600, marginBottom: "4px" }}>${label}</div>
    <div style=${{ fontSize: "13px" }}>${msg}</div>
    ${dismissible
      ? html`<button
          type="button"
          aria-label=${t("toast_close", "Close notification")}
              background: "transparent",
              border: "none",
              color: toneColor,
              cursor: "pointer",
              fontWeight: 700,
              padding: 0,
            background: "transparent",
            border: "none",
            color: toneColor,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >×</button>`
      : null}
  </div>`;
}
