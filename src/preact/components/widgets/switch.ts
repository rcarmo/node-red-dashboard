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
  if (checked) return ctrl.oncolor || "var(--nr-dashboard-widgetBackgroundColor, #0094d9)";
  return ctrl.offcolor || "rgba(111,111,111,0.5)";
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
  const label = (asSwitch.label || asSwitch.name || t("switch_label", "Switch {index}", { index: index + 1 })) as string;
  const labelHtml = { __html: label };

  const toChecked = (val: unknown): boolean => {
    if (asSwitch.onvalue !== undefined || asSwitch.offvalue !== undefined) {
      if (matchesValue(val, asSwitch.onvalue)) return true;
      if (matchesValue(val, asSwitch.offvalue)) return false;
    }
    return Boolean(val);
  };

  const [checked, setChecked] = useState<boolean>(toChecked(asSwitch.value ?? asSwitch.state));
  const [_focused, setFocused] = useState(false);

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

  const isCenter = (asSwitch.className || "").split(" ").includes("center");
  const showLabel = !(Number(asSwitch.width) === 1);

  const renderIcon = (icon?: string) => {
    if (!icon) return null;
    const trimmed = icon.trim();
    if (!trimmed) return null;

    const isUrl = /^https?:\/\//i.test(trimmed);
    if (isUrl) return html`<img class="nr-dashboard-switch__icon-wrapper" src=${trimmed} alt="" />`;

    if (trimmed.startsWith("mi-")) {
      const glyph = trimmed.slice(3);
      return html`<span class=${`material-icons ${trimmed}`} aria-hidden="true">${glyph}</span>`;
    }
    if (trimmed.startsWith("fa-")) return html`<i class=${`fa fa-fw ${trimmed}`} aria-hidden="true"></i>`;
    if (trimmed.startsWith("wi-")) return html`<i class=${`wi wi-fw ${trimmed}`} aria-hidden="true"></i>`;
    if (trimmed.startsWith("icofont-")) return html`<i class=${`icofont icofont-fw ${trimmed}`} aria-hidden="true"></i>`;
    if (trimmed.startsWith("iconify-")) {
      const [, size] = trimmed.split(" ");
      const iconName = trimmed.split(" ")[0].slice(8);
      return html`<i class="iconify" data-icon=${iconName} data-width=${size ?? "1.3em"} data-height=${size ?? "1.3em"} aria-hidden="true"></i>`;
    }
    if (/^[A-Za-z0-9_-]+$/.test(trimmed)) return html`<span class="material-icons" aria-hidden="true">${trimmed}</span>`;
    return null;
  };

  const resolvedColor = resolveSwitchColors(asSwitch, checked);
  const trackBg = checked ? resolvedColor : resolveSwitchColors(asSwitch, false);
  const thumbBg = checked ? "var(--nr-dashboard-widgetBackgroundColor, #0094d9)" : "rgb(148,148,148)";
  const thumbLeft = checked ? "18px" : "-2px";

  const switchLabel = asSwitch.onicon && asSwitch.officon 
    ? t("switch_toggle_label", "Toggle {label}", { label })
    : t("switch_state_label", "{label}, currently {state}", { label, state: checked ? "on" : "off" });

  const track = html`<div
    class="nr-dashboard-switch__track"
    onClick=${onEmit ? toggle : undefined}
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
    aria-label=${switchLabel}
    aria-disabled=${disabled}
    style=${{
      "--nr-switch-track-bg": trackBg,
    }}
  >
    <div
      class="nr-dashboard-switch__thumb"
      style=${{
        "--nr-switch-thumb-left": thumbLeft,
        "--nr-switch-thumb-bg": thumbBg,
      }}
    ></div>
  </div>`;

  const customIconsActive = Boolean(asSwitch.onicon && asSwitch.officon && asSwitch.oncolor && asSwitch.offcolor);

  const customIcons = customIconsActive
    ? html`<div
        onClick=${onEmit ? toggle : undefined}
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
        aria-label=${switchLabel}
        aria-disabled=${disabled}
        class="nr-dashboard-switch__custom-icon-container"
      >
        <span
          class=${`nr-dashboard-switch__custom-icon ${asSwitch.animate || ""}`.trim()}
          style=${{ color: checked ? asSwitch.oncolor : "transparent" }}
          aria-hidden="true"
        >${renderIcon(asSwitch.onicon)}</span>
        <span
          class=${`nr-dashboard-switch__custom-icon ${asSwitch.animate || ""}`.trim()}
          style=${{ color: !checked ? asSwitch.offcolor : "transparent" }}
          aria-hidden="true"
        >${renderIcon(asSwitch.officon)}</span>
      </div>`
    : track;

  const containerClass = [
    "nr-dashboard-switch",
    asSwitch.className || "",
    disabled ? "is-disabled" : "",
    isCenter ? "is-centered" : "",
  ].filter(Boolean).join(" ");

  return html`<div
    class=${containerClass}
    title=${asSwitch.tooltip || undefined}
  >
    ${showLabel
      ? html`<p
          class="nr-dashboard-switch__label"
          dangerouslySetInnerHTML=${labelHtml}
        ></p>`
      : null}
    ${customIcons}
  </div>`;
}
