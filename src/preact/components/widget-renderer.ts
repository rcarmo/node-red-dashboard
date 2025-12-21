import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../state";
import { TextWidget } from "./widgets/text";
import { ButtonWidget } from "./widgets/button";
import { SwitchWidget } from "./widgets/switch";
import { TextInputWidget } from "./widgets/text-input";
import { NumericWidget } from "./widgets/numeric";
import { DropdownWidget } from "./widgets/dropdown";
import { WidgetPreview } from "./widget-preview";

function getControlType(control: UiControl): string {
  const asAny = control as { type?: string; widget?: string; mode?: string };
  return (asAny.type || asAny.widget || asAny.mode || "").toString().toLowerCase();
}

export function WidgetRenderer(props: { control: UiControl; index: number; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, onEmit } = props;
  const type = getControlType(control);

  if (type === "text" || type === "ui_text") {
    return html`<${TextWidget} control=${control} index=${index} />`;
  }

  if (type === "text-input" || type === "text-input-cr" || type === "ui_text_input") {
    return html`<${TextInputWidget} control=${control} index=${index} onEmit=${onEmit} />`;
  }

  if (type === "numeric" || type === "ui_numeric") {
    return html`<${NumericWidget} control=${control} index=${index} onEmit=${onEmit} />`;
  }

  if (type === "dropdown" || type === "ui_dropdown") {
    return html`<${DropdownWidget} control=${control} index=${index} onEmit=${onEmit} />`;
  }

  if (type === "button" || type === "ui_button") {
    return html`<${ButtonWidget} control=${control} index=${index} onEmit=${onEmit} />`;
  }

  if (type === "switch" || type === "ui_switch") {
    return html`<${SwitchWidget} control=${control} index=${index} onEmit=${onEmit} />`;
  }

  return html`<${WidgetPreview} control=${control} index=${index} />`;
}
