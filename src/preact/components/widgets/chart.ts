import { html } from "htm/preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import {
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
} from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
} from "echarts/components";
import type { EChartsOption } from "echarts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { registerEChartsModules, useECharts } from "../../lib/echarts";
import { useI18n } from "../../lib/i18n";
import { formatNumber } from "../../lib/format";

registerEChartsModules([
  LineChart,
  BarChart,
  PieChart,
  RadarChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
]);

dayjs.extend(utc);

export type ChartLook = "line" | "bar" | "horizontalBar" | "pie" | "polar-area" | "radar";

export type ChartControl = UiControl & {
  label?: string;
  name?: string;
  look?: ChartLook | string;
  legend?: boolean;
  interpolate?: "cubic" | "monotone" | "linear" | "bezier" | "step" | string;
  nodata?: boolean;
  width?: number | string;
  height?: number | string;
  ymin?: number | string;
  ymax?: number | string;
  dot?: boolean;
  xformat?: string;
  cutout?: number | string;
  colors?: string[];
  useOneColor?: boolean;
  useDifferentColor?: boolean;
  useUTC?: boolean;
  animation?: boolean;
  spanGaps?: boolean;
  className?: string;
  value?: unknown;
};

export type ChartSeries = {
  name: string;
  data: Array<number | [number, number]>;
};

export type ChartData = {
  labels: string[];
  series: ChartSeries[];
  isTimeSeries: boolean;
};

const DEFAULT_COLORS = [
  "#1F77B4",
  "#AEC7E8",
  "#FF7F0E",
  "#2CA02C",
  "#98DF8A",
  "#D62728",
  "#FF9896",
  "#9467BD",
  "#C5B0D5",
  "#7EB3C6",
  "#BC5879",
  "#6DC2DF",
  "#D7D185",
  "#91CA96",
  "#DEB64D",
];

export function normalizeLook(look?: string): ChartLook {
  const l = (look || "line").toLowerCase();
  if (l === "horizontalbar" || l === "horizontal-bar") return "horizontalBar";
  if (l === "bar") return "bar";
  if (l === "pie") return "pie";
  if (l === "polar-area" || l === "polar") return "polar-area";
  if (l === "radar") return "radar";
  return "line";
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cloneData(data: ChartData): ChartData {
  return {
    labels: [...data.labels],
    isTimeSeries: data.isTimeSeries,
    series: data.series.map((s) => ({ name: s.name, data: [...s.data] })),
  };
}

function findSeries(data: ChartData, name: string): ChartSeries {
  const found = data.series.find((s) => s.name === name);
  if (found) return found;
  const created: ChartSeries = { name, data: [] };
  data.series.push(created);
  return created;
}

export function applyChartPayload(look: ChartLook, payload: unknown, prev: ChartData): ChartData {
  if (!Array.isArray(payload) || payload.length === 0) {
    return { labels: [], series: [], isTimeSeries: false };
  }

  const entry = payload[0] as Record<string, unknown>;
  const next = cloneData(prev);
  const values = (entry.values || entry) as Record<string, unknown>;
  const seriesArr = Array.isArray(values.series) ? (values.series as string[]) : [];
  const labelsArr = Array.isArray(values.labels) ? (values.labels as string[]) : [];
  const dataArr = Array.isArray(values.data) ? (values.data as unknown[]) : [];

  if (look === "line" && entry.update) {
    const seriesName = (values.series as string) || "";
    const point = values.data as { x?: number; y?: number };
    if (point && typeof point === "object" && point.x != null && point.y != null) {
      const s = findSeries(next, seriesName);
      s.data.push([Number(point.x), Number(point.y)]);
      next.isTimeSeries = true;
      const remove = Number((entry as { remove?: number }).remove ?? 0);
      if (Number.isFinite(remove) && remove > 0) {
        s.data.splice(0, remove);
      }
    }
    return next;
  }

  // Replace dataset
  next.labels = labelsArr;
  next.series = [];
  next.isTimeSeries = false;

  seriesArr.forEach((name, idx) => {
    const seriesData = Array.isArray(dataArr[idx]) ? (dataArr[idx] as unknown[]) : [];
    const mapped: Array<number | [number, number]> = seriesData.map((d) => {
      if (d && typeof d === "object" && "x" in (d as { x: number }) && "y" in (d as { y: number })) {
        next.isTimeSeries = true;
        const asPoint = d as { x: number; y: number };
        return [Number(asPoint.x), Number(asPoint.y)];
      }
      const n = toNumber(d);
      return n ?? 0;
    });
    next.series.push({ name, data: mapped });
  });

  return next;
}

function buildLineSeries(control: ChartControl, data: ChartData): EChartsOption["series"] {
  const interpolate = (control.interpolate || "").toString();
  const dot = Boolean(control.dot);
  const spanGaps = Boolean(control.spanGaps);

  return data.series.map((s) => {
    const series: Record<string, unknown> = {
      type: "line",
      name: s.name,
      data: s.data,
      showSymbol: dot,
      smooth: interpolate === "cubic" || interpolate === "bezier" || interpolate === "monotone",
      connectNulls: spanGaps,
    };
    if (interpolate === "monotone") {
      series.smoothMonotone = "x";
    }
    if (interpolate === "step") {
      series.step = "middle";
      series.smooth = false;
    }
    return series;
  });
}

function buildBarSeries(look: ChartLook, data: ChartData): EChartsOption["series"] {
  return data.series.map((s) => {
    const series: Record<string, unknown> = {
      type: "bar",
      name: s.name,
      data: s.data,
      label: { show: false },
    };
    if (look === "horizontalBar") {
      series.type = "bar";
    }
    return series;
  });
}

function buildPieSeries(look: ChartLook, control: ChartControl, data: ChartData): EChartsOption["series"] {
  const radiusInner = Math.max(0, Number(control.cutout ?? 0));
  const hasMultiple = data.series.length > 1;
  const radiusBase = radiusInner > 0 ? [radiusInner, "70%"] : [0, "70%"];

  return data.series.map((s, idx) => {
    const radius = hasMultiple ? [radiusInner, `${50 + idx * 15}%`] : radiusBase;
    return {
      type: "pie",
      name: s.name,
      radius,
      roseType: look === "polar-area" ? "area" : undefined,
      data: data.labels.map((label, i) => ({ name: label, value: (s.data[i] as number) ?? 0 })),
      label: { show: true },
    };
  });
}

function buildRadarSeries(data: ChartData): EChartsOption["series"] {
  return data.series.map((s) => ({
    type: "radar",
    name: s.name,
    data: [{ value: s.data as number[] }],
  }));
}

export function buildChartOption(control: ChartControl, data: ChartData, lang: string | null, t: (k: string, dflt: string, vars?: Record<string, unknown>) => string): EChartsOption {
  const look = normalizeLook(control.look);
  const colors = control.colors && control.colors.length > 0 ? control.colors : DEFAULT_COLORS;
  const useUTC = Boolean(control.useUTC);
  const animation = control.animation !== false;

  const option: EChartsOption = {
    color: colors,
    animation,
    useUTC,
    textStyle: { color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)" },
    tooltip: { trigger: look === "pie" || look === "polar-area" ? "item" : "axis" },
    legend: control.legend ? {} : { show: false },
  };

  const valueFormatter = (v: number) => formatNumber(v, lang ?? undefined);
  const timeFormatter = (ts: number) => {
    const d = useUTC ? dayjs.utc(ts) : dayjs(ts);
    const fmt = control.xformat || "HH:mm:ss";
    return d.isValid() ? d.format(fmt) : String(ts);
  };

  if (look === "line" || look === "bar" || look === "horizontalBar") {
    const categoryAxis = {
      type: data.isTimeSeries ? "time" : "category",
      data: data.isTimeSeries ? undefined : data.labels,
      axisLabel: {
        formatter: data.isTimeSeries ? (val: number) => timeFormatter(val) : (val: unknown) => String(val ?? ""),
        color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
      },
    };

    const valueAxis = {
      type: "value",
      min: toNumber(control.ymin) ?? undefined,
      max: toNumber(control.ymax) ?? undefined,
      axisLabel: {
        formatter: (val: number) => valueFormatter(val),
        color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
      },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } },
    };

    if (look === "horizontalBar") {
      option.yAxis = categoryAxis;
      option.xAxis = valueAxis;
    } else {
      option.xAxis = categoryAxis;
      option.yAxis = valueAxis;
    }

    option.grid = { left: 10, right: 10, top: 24, bottom: 20, containLabel: true };
    option.series = look === "line" ? buildLineSeries(control, data) : buildBarSeries(look, data);
  } else if (look === "pie" || look === "polar-area") {
    option.series = buildPieSeries(look, control, data);
  } else if (look === "radar") {
    option.radar = {
      indicator: data.labels.map((l) => ({ name: l })),
      axisName: { color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
      splitArea: { areaStyle: { color: "transparent" } },
    };
    option.series = buildRadarSeries(data);
  }

  option.title = {
    show: true,
    text: control.label || control.name || t("chart_label", "Chart"),
    textStyle: { color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)", fontSize: 14, fontWeight: 600 },
  };

  return option;
}

export function ChartWidget(props: { control: UiControl; index: number; disabled?: boolean }): VNode {
  const { control, index, disabled } = props;
  const c = control as ChartControl;
  const { t, lang } = useI18n();
  const look = normalizeLook(c.look);
  const [data, setData] = useState<ChartData>({ labels: [], series: [], isTimeSeries: false });
  const chartRef = useRef<HTMLDivElement | null>(null);
  const label = c.label || c.name || t("chart_label_index", "Chart {index}", { index: index + 1 });

  useEffect(() => {
    setData((prev) => applyChartPayload(look, c.value, prev));
  }, [c.value, look]);

  const option = useMemo(() => buildChartOption({ ...c, label }, data, lang, t), [c, data, label, lang, t]);

  useECharts(chartRef, [option], () => option);

  return html`<div
    class=${c.className || ""}
    style=${{
      width: "100%",
      minHeight: "260px",
      opacity: disabled ? 0.55 : 1,
      pointerEvents: disabled ? "none" : "auto",
    }}
    aria-label=${t("chart_value_label", "{label} chart", { label })}
  >
    <div ref=${chartRef} style=${{ width: "100%", height: "260px" }}></div>
  </div>`;
}
