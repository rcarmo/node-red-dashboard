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
import { DatePickerWidget } from "./widgets/date-picker";
import { ColourPickerWidget } from "./widgets/colour-picker";
import { AudioWidget } from "./widgets/audio";
import { ToastWidget } from "./widgets/toast";
import { LinkWidget } from "./widgets/link";
import { TemplateWidget } from "./widgets/template";
import { FormWidget } from "./widgets/form";
import { ChartWidget } from "./widgets/chart";
import { WidgetPreview } from "./widget-preview";
import { WidgetFrame } from "./WidgetFrame";

function getControlType(control: UiControl): string {
  const asAny = control as { type?: string; widget?: string; mode?: string };
  return (asAny.type || asAny.widget || asAny.mode || "").toString().toLowerCase();
}

export function WidgetRenderer(props: { control: UiControl; index: number; onEmit?: (event: string, msg?: Record<string, unknown>) => void }): VNode {
  const { control, index, onEmit } = props;
  const type = getControlType(control);
  const disabled = Boolean((control as { disabled?: boolean }).disabled === true || (control as { enabled?: boolean }).enabled === false);

  if (type === "text" || type === "ui_text") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${TextWidget} control=${control} index=${index} /></${WidgetFrame}>`;
  }

  if (type === "text-input" || type === "text-input-cr" || type === "ui_text_input") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${TextInputWidget} control=${control} index=${index} onEmit=${onEmit} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "numeric" || type === "ui_numeric") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${NumericWidget} control=${control} index=${index} onEmit=${onEmit} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "dropdown" || type === "ui_dropdown") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${DropdownWidget} control=${control} index=${index} onEmit=${onEmit} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "slider" || type === "ui_slider") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${SliderWidget} control=${control} index=${index} onEmit=${onEmit} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "button" || type === "ui_button") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${ButtonWidget} control=${control} index=${index} onEmit=${onEmit} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "switch" || type === "ui_switch") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${SwitchWidget} control=${control} index=${index} onEmit=${onEmit} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "gauge" || type === "ui_gauge") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${GaugeWidget} control=${control} index=${index} /></${WidgetFrame}>`;
  }

  if (type === "chart" || type === "ui_chart") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${ChartWidget} control=${control} index=${index} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "date" || type === "date-picker" || type === "ui_date_picker") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${DatePickerWidget} control=${control} index=${index} onEmit=${onEmit} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "colour" || type === "color" || type === "ui_colour_picker") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${ColourPickerWidget} control=${control} index=${index} onEmit=${onEmit} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "audio" || type === "ui_audio") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${AudioWidget} control=${control} index=${index} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "toast" || type === "notification" || type === "ui_toast") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${ToastWidget} control=${control} index=${index} /></${WidgetFrame}>`;
  }

  if (type === "link" || type === "ui_link") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${LinkWidget} control=${control} index=${index} disabled=${disabled} /></${WidgetFrame}>`;
  }

  if (type === "template" || type === "ui_template") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${TemplateWidget} control=${control} index=${index} /></${WidgetFrame}>`;
  }

  if (type === "form" || type === "ui_form") {
    return html`<${WidgetFrame} control=${control} disabled=${disabled}><${FormWidget} control=${control} index=${index} onEmit=${onEmit} disabled=${disabled} /></${WidgetFrame}>`;
  }

  return html`<${WidgetFrame} control=${control} disabled=${disabled}><${WidgetPreview} control=${control} index=${index} /></${WidgetFrame}>`;
}
