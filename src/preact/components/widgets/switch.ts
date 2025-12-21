import { html } from "htm/preact";
import { useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useElementSize } from "../../hooks/useElementSize";

export type SwitchControl = UiControl & {
  label?: string;
  name?: string;
  value?: boolean;
  state?: boolean;
  topic?: string;
  oncolor?: string;
  offcolor?: string;
  onicon?: string;
  officon?: string;
  className?: string;
};

export function resolveSwitchColors(ctrl: SwitchControl, checked: boolean): string {
  if (checked) return ctrl.oncolor || "#3ddc97";
  return ctrl.offcolor || "rgba(255,255,255,0.12)";
}

export function buildSwitchEmit(ctrl: SwitchControl, fallbackLabel: string, next: boolean): Record<string, unknown> {
  return {
    payload: next,
    topic: ctrl.topic ?? fallbackLabel,
    type: "switch",
  };
}

export function SwitchWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const asSwitch = control as SwitchControl;
  const label = asSwitch.label || asSwitch.name || `Switch ${index + 1}`;
  const initial = Boolean(asSwitch.value ?? asSwitch.state);
  const [checked, setChecked] = useState<boolean>(initial);
  const [ref, size] = useElementSize<HTMLLabelElement>();

  const toggle = () => {
    if (disabled) return;
    const next = !checked;
    setChecked(next);
    if (onEmit) {
      const payload = buildSwitchEmit(asSwitch, label, next);
      onEmit("ui-control", payload);
    }
  };

  const bg = resolveSwitchColors(asSwitch, checked);

  return html`<label
    ref=${ref}
    class=${asSwitch.className || ""}
    style=${{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: !disabled && onEmit ? "pointer" : "default",
      userSelect: "none",
      opacity: disabled ? 0.55 : 1,
    }}
  >
    <div
      onClick=${onEmit ? toggle : undefined}
      style=${{
        width: "46px",
        height: "24px",
        borderRadius: "12px",
        background: bg,
        position: "relative",
        transition: "background 120ms ease, transform 120ms ease",
      }}
    >
      <div
        style=${{
          position: "absolute",
          top: "2px",
          left: checked ? "24px" : "2px",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
          transition: "left 120ms ease",
        }}
      ></div>
    </div>
    <div style=${{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style=${{ fontWeight: 600 }}>
        ${checked && asSwitch.onicon ? html`<span class="fa ${asSwitch.onicon}" style=${{ marginRight: "6px" }}></span>` : null}
        ${!checked && asSwitch.officon ? html`<span class="fa ${asSwitch.officon}" style=${{ marginRight: "6px" }}></span>` : null}
        ${label}
      </span>
      <span style=${{ opacity: 0.7, fontSize: "12px" }}>${checked ? "On" : "Off"}</span>
      <span style=${{ opacity: 0.5, fontSize: "10px" }}>
        ${Math.round(size.width)}×${Math.round(size.height)} px
      </span>
    </div>
  </label>`;
}
