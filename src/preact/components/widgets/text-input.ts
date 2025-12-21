import { html } from "htm/preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";

export type TextInputControl = UiControl & {
  label?: string;
  name?: string;
  mode?: string;
  delay?: number;
  sendOnBlur?: boolean;
  tooltip?: string;
  className?: string;
  value?: string;
};

function inputType(mode?: string): string {
  if (!mode) return "text";
  if (mode.startsWith("time")) return "time";
  if (mode === "date") return "date";
  if (mode === "datetime-local") return "datetime-local";
  if (mode === "password") return "password";
  if (mode === "email") return "email";
  if (mode === "number") return "number";
  return "text";
}

export function buildTextEmit(ctrl: TextInputControl, fallbackLabel: string, value: string): Record<string, unknown> {
  return {
    payload: value,
    topic: (ctrl as { topic?: string }).topic ?? fallbackLabel,
    type: "text-input",
  };
}

export function TextInputWidget(props: { control: UiControl; index: number; disabled?: boolean; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, disabled, onEmit } = props;
  const asInput = control as TextInputControl;
  const label = asInput.label || asInput.name || `Input ${index + 1}`;
  const [value, setValue] = useState<string>((asInput.value as string) ?? "");
  const delay = Number.isFinite(asInput.delay) ? Number(asInput.delay) : 0;
  const sendOnEnter = delay <= 0 || (control as { type?: string }).type === "text-input-CR";
  const timer = useRef<number | undefined>(undefined);
  const type = useMemo(() => inputType(asInput.mode), [asInput.mode]);

  useEffect(() => () => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
    }
  }, []);

  const emitValue = (next: string) => {
    if (!onEmit) return;
    const payload = buildTextEmit(asInput, label, next);
    onEmit("ui-control", payload);
  };

  const scheduleEmit = (next: string) => {
    if (!onEmit) return;
    if (delay <= 0) return;
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => emitValue(next), delay);
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const next = target.value;
    setValue(next);
    if (!sendOnEnter) {
      scheduleEmit(next);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (sendOnEnter && e.key === "Enter") {
      emitValue(value);
    }
  };

  const handleBlur = () => {
    if (asInput.sendOnBlur) {
      emitValue(value);
    }
  };

  return html`<label style=${{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
    <span style=${{ fontSize: "13px", opacity: 0.8 }}>${label}</span>
    <input
      class=${asInput.className || ""}
      type=${type}
      value=${value}
      title=${asInput.tooltip || undefined}
      disabled=${Boolean(disabled)}
      onInput=${handleChange}
      onKeyDown=${handleKeyDown}
      onBlur=${handleBlur}
      style=${{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.05)",
        color: "inherit",
      }}
    />
  </label>`;
}
