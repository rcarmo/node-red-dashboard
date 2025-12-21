import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../state";
import { TextWidget } from "./widgets/text";
import { ButtonWidget } from "./widgets/button";
import { SwitchWidget } from "./widgets/switch";
import { TextInputWidget } from "./widgets/text-input";
import { NumericWidget } from "./widgets/numeric";
import { DropdownWidget } from "./widgets/dropdown";
import { SliderWidget } from "./widgets/slider";
import { GaugeWidget } from "./widgets/gauge";
import { WidgetPreview } from "./widget-preview";
import { WidgetFrame } from "./WidgetFrame";

function getControlType(control: UiControl): string {
  const asAny = control as { type?: string; widget?: string; mode?: string };
  return (asAny.type || asAny.widget || asAny.mode || "").toString().toLowerCase();
}

export function WidgetRenderer(props: { control: UiControl; index: number; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, onEmit } = props;
  const type = getControlType(control);

  if (type === "text" || type === "ui_text") {
    return html`<${WidgetFrame} control=${control}><${TextWidget} control=${control} index=${index} /></${WidgetFrame}>`;
  }

  if (type === "text-input" || type === "text-input-cr" || type === "ui_text_input") {
    return html`<${WidgetFrame} control=${control}><${TextInputWidget} control=${control} index=${index} onEmit=${onEmit} /></${WidgetFrame}>`;
  }

  if (type === "numeric" || type === "ui_numeric") {
    return html`<${WidgetFrame} control=${control}><${NumericWidget} control=${control} index=${index} onEmit=${onEmit} /></${WidgetFrame}>`;
  }

  if (type === "dropdown" || type === "ui_dropdown") {
    return html`<${WidgetFrame} control=${control}><${DropdownWidget} control=${control} index=${index} onEmit=${onEmit} /></${WidgetFrame}>`;
  }

  if (type === "slider" || type === "ui_slider") {
    return html`<${WidgetFrame} control=${control}><${SliderWidget} control=${control} index=${index} onEmit=${onEmit} /></${WidgetFrame}>`;
  }

  if (type === "button" || type === "ui_button") {
    return html`<${WidgetFrame} control=${control}><${ButtonWidget} control=${control} index=${index} onEmit=${onEmit} /></${WidgetFrame}>`;
  }

  if (type === "switch" || type === "ui_switch") {
    return html`<${WidgetFrame} control=${control}><${SwitchWidget} control=${control} index=${index} onEmit=${onEmit} /></${WidgetFrame}>`;
  }

  if (type === "gauge" || type === "ui_gauge") {
    return html`<${WidgetFrame} control=${control}><${GaugeWidget} control=${control} index=${index} /></${WidgetFrame}>`;
  }

  return html`<${WidgetFrame} control=${control}><${WidgetPreview} control=${control} index=${index} /></${WidgetFrame}>`;
}
