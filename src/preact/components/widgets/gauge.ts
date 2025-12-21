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

function computeGaugeHeight(ctrl: GaugeControl): number {
  const gtype = (ctrl.gtype || "gage").toString().toLowerCase();
  if (gtype === "wave") return 260;
  if (gtype === "compass") return 240;
  if (gtype === "donut") return 220;
  return 220;
}

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

export function formatGaugeDetail(value: number, delta: number | undefined, format: string | undefined, units: string | undefined, formatter: Intl.NumberFormat): string {
  const base = formatGaugeValue(value, format, units, formatter);
  if (delta === undefined) return base;
  const deltaFormatted = formatter.format(delta);
  const sign = delta > 0 ? "+" : "";
  return `${base} ${delta === 0 ? "(0)" : `(${sign}${deltaFormatted})`}`;
}

export function buildSegments(ctrl: GaugeControl, min: number, max: number): Array<[number, string]> {
  const colors = ctrl.colors && ctrl.colors.length >= 3
    ? ctrl.colors
    : [
        "var(--nr-dashboard-widgetColor, #00B500)",
        "var(--nr-dashboard-warnColor, #E6E600)",
        "var(--nr-dashboard-errorColor, #CA3838)",
      ];
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
  const prevValue = useRef<number>(value);

  useEffect(() => {
    setValue(clamp(toNumber(asGauge.value ?? min, min), min, max));
  }, [asGauge.value, min, max]);

  const segments = useMemo(() => buildSegments(asGauge, min, max), [asGauge, min, max]);
  const showMinMax = !asGauge.hideMinMax;
  const showTicks = asGauge.gtype === "gage" || asGauge.gtype === "donut" || asGauge.gtype === "compass" || !asGauge.gtype;
  const gtype = (asGauge.gtype || "gage").toString().toLowerCase();
  const isDonut = gtype === "donut";
  const isWave = gtype === "wave";
  const isCompass = gtype === "compass";
  const diffEnabled = Boolean(asGauge.diff);
  const delta = diffEnabled ? value - prevValue.current : undefined;
  const formatted = formatGaugeDetail(value, delta, asGauge.format, asGauge.units, formatter);
  const ariaLabel = t("gauge_value_label", "{label}: {value} {units}", {
    label,
    value: formatNumber(value, lang),
    units: asGauge.units ?? "",
  });
  const reverse = Boolean(asGauge.reverse);
  const chartHeight = computeGaugeHeight(asGauge);

  useEffect(() => {
    prevValue.current = value;
  }, [value]);

  useECharts(
    chartRef,
    [value, min, max, segments, showTicks, showMinMax, isDonut, isWave, isCompass, formatted, label, reverse, formatter, chartHeight],
    () => ({
      backgroundColor: "transparent",
      series: [
        {
          type: "gauge",
          min,
          max,
          startAngle: isCompass ? 90 : reverse ? 45 : 225,
          endAngle: isCompass ? -270 : reverse ? -225 : -45,
          splitNumber: isCompass ? 8 : showTicks ? 10 : 0,
          progress: {
            show: true,
            width: isDonut || isWave ? 16 : 10,
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
          axisTick: { show: showTicks, distance: isCompass ? -8 : -12, length: isCompass ? 8 : 6 },
          splitLine: { show: showTicks, length: isCompass ? 12 : 10, distance: isCompass ? -10 : -14 },
          axisLabel: {
            show: showMinMax || isCompass,
            distance: isCompass ? 22 : 16,
            color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
            formatter: (val: number) => {
              if (!isCompass) return formatter.format(val);
              const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
              const idx = Math.round(((val % 360) / 45)) % 8;
              return dirs[idx];
            },
          },
          pointer: { show: !isDonut && !isWave, width: 4, itemStyle: { color: "var(--nr-dashboard-widgetTextColor, #fff)" } },
          anchor: { show: !isDonut && !isWave, showAbove: true, size: 10, itemStyle: { color: "var(--nr-dashboard-widgetTextColor, #fff)" } },
          detail: {
            valueAnimation: true,
            formatter: () => formatted,
            color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
            fontSize: 16,
            offsetCenter: isWave ? [0, "40%"] : [0, "60%"],
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
      minHeight: `${chartHeight}px`,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      alignItems: "center",
      justifyContent: "center",
    }}
    aria-label=${ariaLabel}
  >
    <div style=${{ fontWeight: 600 }}>${label}</div>
    <div ref=${chartRef} style=${{ width: "100%", height: `${chartHeight}px` }}></div>
  </div>`;
}
