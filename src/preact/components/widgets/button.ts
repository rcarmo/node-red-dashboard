import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useElementSize } from "../../hooks/useElementSize";

export type ButtonControl = UiControl & {
  label?: string;
  name?: string;
  color?: string;
  bgcolor?: string;
  icon?: string;
  payload?: unknown;
  topic?: string;
  className?: string;
  tooltip?: string;
};

export function resolveButtonColor(ctrl: ButtonControl): string {
  if (typeof ctrl.bgcolor === "string" && ctrl.bgcolor) return ctrl.bgcolor;
  if (typeof ctrl.color === "string" && ctrl.color) return ctrl.color;
  return "#1f8af2";
}

export function buildButtonEmit(ctrl: ButtonControl, fallbackLabel: string): Record<string, unknown> {
  return {
    payload: ctrl.payload ?? true,
    topic: ctrl.topic ?? fallbackLabel,
    type: "button",
  };
}

export function ButtonWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const asButton = control as ButtonControl;
  const label = asButton.label || asButton.name || `Button ${index + 1}`;
  const color = resolveButtonColor(asButton);
  const [ref, size] = useElementSize<HTMLButtonElement>();

  const handleClick = () => {
    const payload = buildButtonEmit(asButton, label);
    onEmit?.("ui-control", payload);
  };

  return html`<button
    ref=${ref}
    type="button"
    title=${asButton.tooltip || undefined}
    class=${asButton.className || ""}
    disabled=${Boolean(disabled)}
    onClick=${onEmit ? handleClick : undefined}
    style=${{
      width: "100%",
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.18)",
      background: color,
      color: "#fff",
      fontWeight: 600,
      cursor: onEmit ? "pointer" : "default",
    }}
  >
    ${asButton.icon ? html`<span class="fa ${asButton.icon}" style=${{ marginRight: "6px" }}></span>` : null}
    ${label}
    <span style=${{ opacity: 0.65, fontSize: "10px", marginLeft: "8px" }}>
      ${Math.round(size.width)}×${Math.round(size.height)} px
    </span>
  </button>`;
}
