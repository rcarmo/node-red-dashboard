import { html } from "htm/preact";
import { useEffect, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useElementSize } from "../../hooks/useElementSize";
import { useI18n } from "../../lib/i18n";

export type SwitchControl = UiControl & {
  label?: string;
  name?: string;
  value?: boolean;
  state?: boolean;
  onvalue?: unknown;
  offvalue?: unknown;
  topic?: string;
  oncolor?: string;
  offcolor?: string;
  onicon?: string;
  officon?: string;
  className?: string;
  passthru?: boolean;
  decouple?: boolean;
};

export function resolveSwitchColors(ctrl: SwitchControl, checked: boolean): string {
  if (checked) return ctrl.oncolor || "var(--nr-dashboard-widgetColor, #3ddc97)";
  return ctrl.offcolor || "var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.12))";
}

export function buildSwitchEmit(ctrl: SwitchControl, fallbackLabel: string, next: boolean): Record<string, unknown> {
  return {
    payload: next ? ctrl.onvalue ?? true : ctrl.offvalue ?? false,
    topic: ctrl.topic ?? fallbackLabel,
    type: "switch",
  };
}

function matchesValue(candidate: unknown, target: unknown): boolean {
  if (candidate === target) return true;
  try {
    return JSON.stringify(candidate) === JSON.stringify(target);
  } catch {
    return false;
  }
}

export function SwitchWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const asSwitch = control as SwitchControl;
  const { t } = useI18n();
  const label = asSwitch.label || asSwitch.name || t("switch_label", "Switch {index}", { index: index + 1 });

  const toChecked = (val: unknown): boolean => {
    if (asSwitch.onvalue !== undefined || asSwitch.offvalue !== undefined) {
      if (matchesValue(val, asSwitch.onvalue)) return true;
      if (matchesValue(val, asSwitch.offvalue)) return false;
    }
    return Boolean(val);
  };

  const [checked, setChecked] = useState<boolean>(toChecked(asSwitch.value ?? asSwitch.state));
  const [ref, size] = useElementSize<HTMLLabelElement>();

  useEffect(() => {
    setChecked(toChecked(asSwitch.value ?? asSwitch.state));
  }, [asSwitch.value, asSwitch.state, asSwitch.onvalue, asSwitch.offvalue]);

  const toggle = () => {
    if (disabled) return;
    const next = !checked;
    setChecked(next);
    if (!onEmit) return;
    if (asSwitch.passthru === false && asSwitch.decouple) {
      const payload = buildSwitchEmit(asSwitch, label, next);
      onEmit("ui-control", payload);
      return;
    }
    const payload = buildSwitchEmit(asSwitch, label, next);
    onEmit("ui-control", payload);
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
        boxShadow: "0 1px 3px var(--nr-dashboard-switch-shadow, rgba(0,0,0,0.35))",
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
          background: "var(--nr-dashboard-widgetTextColor, #fff)",
          boxShadow: "0 1px 2px var(--nr-dashboard-switch-shadow, rgba(0,0,0,0.35))",
          transition: "left 120ms ease",
        }}
      ></div>
    </div>
    <div style=${{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style=${{ fontWeight: 600, color: "var(--nr-dashboard-widgetTextColor, inherit)" }}>
        ${checked && asSwitch.onicon ? html`<span class="fa ${asSwitch.onicon}" style=${{ marginRight: "6px" }}></span>` : null}
        ${!checked && asSwitch.officon ? html`<span class="fa ${asSwitch.officon}" style=${{ marginRight: "6px" }}></span>` : null}
        ${label}
      </span>
      <span style=${{ opacity: 0.7, fontSize: "12px", color: "var(--nr-dashboard-widgetTextColor, inherit)" }}>
        ${checked ? t("switch_on", "On") : t("switch_off", "Off")}
      </span>
      <span style=${{ opacity: 0.5, fontSize: "10px", color: "var(--nr-dashboard-widgetTextColor, inherit)" }}>
        ${Math.round(size.width)}×${Math.round(size.height)} px
      </span>
    </div>
  </label>`;
}
