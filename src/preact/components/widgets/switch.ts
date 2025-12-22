import { html } from "htm/preact";
import { useEffect, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
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
  if (checked) return ctrl.oncolor || "#3ddc97";
  return ctrl.offcolor || "rgba(255,255,255,0.12)";
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
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

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

  const resolvedColor = resolveSwitchColors(asSwitch, checked);
  const bg = checked
    ? asSwitch.oncolor ?? `var(--nr-dashboard-widgetColor, ${resolvedColor})`
    : asSwitch.offcolor ?? `var(--nr-dashboard-widgetBorderColor, ${resolvedColor})`;
  const isCenter = (asSwitch.className || "").split(" ").includes("center");

  return html`<label
    class=${asSwitch.className || ""}
    style=${{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "default",
      userSelect: "none",
      opacity: disabled ? 0.55 : 1,
      paddingLeft: "12px",
      margin: isCenter ? "0 auto" : undefined,
    }}
  >
    <div
      onClick=${onEmit ? toggle : undefined}
      onMouseEnter=${() => setHovered(true)}
      onMouseLeave=${() => setHovered(false)}
      onFocus=${() => setFocused(true)}
      onBlur=${() => setFocused(false)}
      onKeyDown=${(e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          toggle();
        }
      }}
      tabIndex=${disabled ? -1 : 0}
      role="switch"
      aria-checked=${checked}
      style=${{
        width: "40px",
        height: "20px",
        borderRadius: "10px",
        background: bg,
        position: "relative",
        transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
        boxShadow: focused
          ? "0 0 0 2px color-mix(in srgb, var(--nr-dashboard-widgetColor, #3ddc97) 28%, transparent)"
          : hovered
            ? "0 1px 3px var(--nr-dashboard-switch-shadow, rgba(0,0,0,0.28))"
            : "none",
      }}
    >
      <div
        style=${{
          position: "absolute",
          top: "2px",
          left: checked ? "20px" : "2px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "var(--nr-dashboard-widgetTextColor, #fff)",
          boxShadow: "none",
          transition: "left 120ms ease",
        }}
      ></div>
    </div>
    <div style=${{ display: "flex", flexDirection: "column", gap: "0" }}>
      <span style=${{ fontWeight: 600, color: "var(--nr-dashboard-widgetTextColor, inherit)" }}>
        ${checked && asSwitch.onicon ? html`<span class="fa ${asSwitch.onicon}" style=${{ marginRight: "6px" }}></span>` : null}
        ${!checked && asSwitch.officon ? html`<span class="fa ${asSwitch.officon}" style=${{ marginRight: "6px" }}></span>` : null}
        ${label}
      </span>
    </div>
  </label>`;
}
