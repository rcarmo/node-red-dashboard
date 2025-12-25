import { html } from "htm/preact";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { useElementSize } from "../../hooks/useElementSize";
import { useI18n } from "../../lib/i18n";

type TextControl = UiControl & {
  label?: string;
  name?: string;
  value?: unknown;
  text?: unknown;
  color?: string;
  fontSize?: number | string;
  font?: string;
  fontWeight?: number | string;
  layout?: string;
  layoutAlign?: string;
  className?: string;
  style?: string;
  format?: string;
};

export function applyFormat(format: string | undefined, value: unknown): string {
  if (!format) return value === undefined || value === null ? "" : String(value);
  return format.replace(/{{\s*payload\s*}}/g, String(value ?? ""));
}

export function layoutStyles(ctrl: TextControl): Record<string, string> {
  const align = ctrl.layoutAlign || "space-between center";
  const [justify = "flex-start", alignItems = "center"] = align.split(" ");
  const dir = ctrl.layout === "column" || ctrl.layout === "col" || ctrl.layout === "col-center" ? "column" : "row";
  return {
    display: "flex",
    flexDirection: dir,
    justifyContent: justify,
    alignItems,
    gap: dir === "row" ? "8px" : "4px",
  };
}

export function mergeStyleString(base: Record<string, string>, style?: string): Record<string, string> {
  if (!style) return base;
  const decls = style.split(";").map((s) => s.trim()).filter(Boolean);
  const merged = { ...base } as Record<string, string>;
  decls.forEach((d) => {
    const [k, v] = d.split(":");
    if (k && v) {
      merged[k.trim() as keyof typeof merged] = v.trim();
    }
  });
  return merged;
}

export function TextWidget(props: { control: UiControl; index: number }): VNode {
  const { control, index } = props;
  const asText = control as TextControl;
  const { t } = useI18n();
  const label = asText.label || asText.name || t("text_label", "Text {index}", { index: index + 1 });
  const labelHtml = { __html: label as string };
  const raw = asText.value ?? asText.text ?? "";
  const formatted = applyFormat(asText.format, raw);
  const color = typeof asText.color === "string" ? asText.color : undefined;
  const fontSize = asText.fontSize ? `${asText.fontSize}px` : undefined;
  const fontFamily = asText.font;
  const fontWeight = asText.fontWeight ?? 700;
  const [ref] = useElementSize<HTMLDivElement>();

  const container = mergeStyleString(
    {
      ...layoutStyles(asText),
      width: "100%",
      padding: "0 12px",
    },
    asText.style,
  );

  const isColumn = container.flexDirection === "column";

  return html`<div ref=${ref} class=${`nr-dashboard-text ${asText.className || ""}`.trim()} style=${container}>
    <p
      class=${`nr-dashboard-text__label ${label ? "" : "is-hidden"}`.trim()}
      dangerouslySetInnerHTML=${labelHtml}
    ></p>
    <p
      class="nr-dashboard-text__value"
      style=${{
        fontSize: fontSize || "14px",
        fontWeight,
        color: color || "var(--nr-dashboard-widgetTextColor, inherit)",
        fontFamily: fontFamily,
      }}
    >
      ${formatted}
    </p>
  </div>`;
}
