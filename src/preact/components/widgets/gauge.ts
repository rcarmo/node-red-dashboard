import { html } from "htm/preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import { GaugeChart } from "echarts/charts";
import { registerEChartsModules, useECharts } from "../../lib/echarts";
import { useI18n } from "../../lib/i18n";
import { formatNumber } from "../../lib/format";

registerEChartsModules([GaugeChart]);

export type GaugeControl = UiControl & {
  label?: string;
  name?: string;
  units?: string;
  value?: number | string;
  format?: string;
  gtype?: "gage" | "donut" | "compass" | "wave" | string;
  min?: number | string;
  max?: number | string;
  seg1?: number | string;
  seg2?: number | string;
  reverse?: boolean;
  hideMinMax?: boolean;
  colors?: string[];
  diff?: boolean;
  className?: string;
};

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatGaugeValue(value: number, format: string | undefined, units: string | undefined, formatter: Intl.NumberFormat): string {
  const tpl = format && format.includes("{{") ? format : "{{value}}";
  const formattedValue = formatter.format(value);
  return tpl.replace(/{{\s*value\s*}}/g, formattedValue).replace(/{{\s*units\s*}}/g, units ?? "");
}

export function buildSegments(ctrl: GaugeControl, min: number, max: number): Array<[number, string]> {
  const colors = ctrl.colors && ctrl.colors.length >= 3 ? ctrl.colors : ["#00B500", "#E6E600", "#CA3838"];
  const seg1 = toNumber(ctrl.seg1, (min + max) / 3);
  const seg2 = toNumber(ctrl.seg2, ((min + max) / 3) * 2);
  const span = max - min || 1;
  const p1 = clamp((seg1 - min) / span, 0, 1);
  const p2 = clamp((seg2 - min) / span, 0, 1);
  return [
    [Math.min(p1, p2), colors[0]],
    [Math.max(p1, p2), colors[1]],
    [1, colors[2]],
  ];
}

export function GaugeWidget(props: { control: UiControl; index: number }): VNode {
  const { control, index } = props;
  const asGauge = control as GaugeControl;
  const { t, lang } = useI18n();
  const label = asGauge.label || asGauge.name || t("gauge_label", "Gauge {index}", { index: index + 1 });
  const min = toNumber(asGauge.min, 0);
  const max = toNumber(asGauge.max, 10);
  const [value, setValue] = useState<number>(clamp(toNumber(asGauge.value ?? min, min), min, max));
  const formatter = useMemo(() => new Intl.NumberFormat(lang || undefined), [lang]);
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setValue(clamp(toNumber(asGauge.value ?? min, min), min, max));
  }, [asGauge.value, min, max]);

  const segments = useMemo(() => buildSegments(asGauge, min, max), [asGauge, min, max]);
  const showMinMax = !asGauge.hideMinMax;
  const showTicks = asGauge.gtype === "gage" || asGauge.gtype === "donut" || !asGauge.gtype;
  const isDonut = asGauge.gtype === "donut";
  const formatted = formatGaugeValue(value, asGauge.format, asGauge.units, formatter);
  const ariaLabel = t("gauge_value_label", "{label}: {value} {units}", {
    label,
    value: formatNumber(value, lang),
    units: asGauge.units ?? "",
  });
  const reverse = Boolean(asGauge.reverse);

  useECharts(
    chartRef,
    [value, min, max, segments, showTicks, showMinMax, isDonut, formatted, label, reverse, formatter],
    () => ({
      backgroundColor: "transparent",
      series: [
        {
          type: "gauge",
          min,
          max,
          startAngle: reverse ? 45 : 225,
          endAngle: reverse ? -225 : -45,
          splitNumber: showTicks ? 10 : 0,
          progress: {
            show: true,
            width: isDonut ? 16 : 10,
            roundCap: true,
            itemStyle: {
              color: segments[segments.length - 1][1],
            },
          },
          axisLine: {
            lineStyle: {
              width: isDonut ? 16 : 10,
              color: segments,
            },
          },
          axisTick: { show: showTicks, distance: -12, length: 6 },
          splitLine: { show: showTicks, length: 10, distance: -14 },
          axisLabel: {
            show: showMinMax,
            distance: 16,
            color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
            formatter: (val: number) => formatter.format(val),
          },
          pointer: { show: !isDonut, width: 4, itemStyle: { color: "#fff" } },
          anchor: { show: !isDonut, showAbove: true, size: 10, itemStyle: { color: "#fff" } },
          detail: {
            valueAnimation: true,
            formatter: () => formatted,
            color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
            fontSize: 16,
            offsetCenter: [0, "60%"],
          },
          data: [
            {
              value,
              name: label,
            },
          ],
        },
      ],
    }),
  );

  return html`<div
    class=${asGauge.className || ""}
    style=${{
      width: "100%",
      minHeight: "220px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      alignItems: "center",
      justifyContent: "center",
    }}
    aria-label=${ariaLabel}
  >
    <div style=${{ fontWeight: 600 }}>${label}</div>
    <div ref=${chartRef} style=${{ width: "100%", height: "220px" }}></div>
  </div>`;
}
