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
  stacked?: boolean;
  stackKey?: string;
  stackMap?: Record<string, string>;
  stackLabel?: boolean;
  interpolate?: "cubic" | "monotone" | "linear" | "bezier" | "step" | string;
  nodata?: boolean;
  width?: number | string;
  height?: number | string;
  ymin?: number | string;
  ymax?: number | string;
  dot?: boolean;
  xformat?: string;
  cutout?: number | string;
  startAngle?: number | string;
  radarStartAngle?: number | string;
  radarSplitNumber?: number | string;
  radarShape?: "polygon" | "circle" | string;
  colors?: string[];
  useOneColor?: boolean;
  useDifferentColor?: boolean;
  useUTC?: boolean;
  animation?: boolean;
  animationDuration?: number | string;
  spanGaps?: boolean;
  removeOlder?: number | string;
  removeOlderUnit?: number | string;
  removeOlderPoints?: number | string;
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

type Windowing = {
  removeOlderMs?: number;
  removeOlderPoints?: number;
};

const DEFAULT_COLORS = [
  "var(--nr-dashboard-widgetColor, #1F77B4)",
  "var(--nr-dashboard-chartColor1, #AEC7E8)",
  "var(--nr-dashboard-chartColor2, #FF7F0E)",
  "var(--nr-dashboard-chartColor3, #2CA02C)",
  "var(--nr-dashboard-chartColor4, #98DF8A)",
  "var(--nr-dashboard-chartColor5, #D62728)",
  "var(--nr-dashboard-chartColor6, #FF9896)",
  "var(--nr-dashboard-chartColor7, #9467BD)",
  "var(--nr-dashboard-chartColor8, #C5B0D5)",
  "var(--nr-dashboard-chartColor9, #7EB3C6)",
  "var(--nr-dashboard-chartColor10, #BC5879)",
  "var(--nr-dashboard-chartColor11, #6DC2DF)",
  "var(--nr-dashboard-chartColor12, #D7D185)",
  "var(--nr-dashboard-chartColor13, #91CA96)",
  "var(--nr-dashboard-chartColor14, #DEB64D)",
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

function toPositiveNumber(value: unknown): number | undefined {
  const n = toNumber(value);
  return n != null && Number.isFinite(n) ? n : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
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

export function applyChartPayload(look: ChartLook, payload: unknown, prev: ChartData, windowing?: Windowing): ChartData {
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
      const cutoff = windowing?.removeOlderMs;
      if (cutoff && cutoff > 0) {
        const latestTs = Number(point.x);
        const threshold = latestTs - cutoff;
        s.data = s.data.filter((p) => Array.isArray(p) && (p[0] as number) >= threshold);
      }
      const maxPoints = windowing?.removeOlderPoints;
      if (maxPoints && maxPoints > 0 && s.data.length > maxPoints) {
        s.data.splice(0, s.data.length - maxPoints);
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

  if (windowing && next.isTimeSeries) {
    let maxTs = 0;
    next.series.forEach((s) => {
      s.data.forEach((pt) => {
        if (Array.isArray(pt) && typeof pt[0] === "number") {
          if (pt[0] > maxTs) maxTs = pt[0];
        }
      });
    });
    const threshold = windowing.removeOlderMs && maxTs > 0 ? maxTs - windowing.removeOlderMs : undefined;
    next.series = next.series.map((s) => {
      let filtered = s.data;
      if (threshold) {
        filtered = filtered.filter((pt) => Array.isArray(pt) && (pt[0] as number) >= threshold);
      }
      const maxPoints = windowing.removeOlderPoints;
      if (maxPoints && maxPoints > 0 && filtered.length > maxPoints) {
        filtered = filtered.slice(filtered.length - maxPoints);
      }
      return { ...s, data: filtered };
    });
  }

  return next;
}

function buildLineSeries(control: ChartControl, data: ChartData): EChartsOption["series"] {
  const interpolate = (control.interpolate || "").toString();
  const dot = Boolean(control.dot);
  const spanGaps = Boolean(control.spanGaps);
  const stacked = Boolean(control.stacked);
  const stackName = control.stackKey || (stacked ? "stack" : undefined);

  return data.series.map((s) => {
    const series: Record<string, unknown> = {
      type: "line",
      name: s.name,
      data: s.data,
      showSymbol: dot,
      smooth: interpolate === "cubic" || interpolate === "bezier" || interpolate === "monotone",
      connectNulls: spanGaps,
    };
    if (stackName) series.stack = stackName;
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

function buildBarSeries(
  look: ChartLook,
  data: ChartData,
  stacked: boolean,
  stackKey: string | undefined,
  stackMap: Record<string, string> | undefined,
  showStackLabel: boolean,
  valueFormatter: (v: number) => string,
): EChartsOption["series"] {
  const stackName = stackKey || (stacked ? "stack" : undefined);
  return data.series.map((s) => {
    const series: Record<string, unknown> = {
      type: "bar",
      name: s.name,
      data: s.data,
      label: showStackLabel
        ? {
            show: true,
            position: "inside",
            formatter: ({ value }) => valueFormatter(Number(value)),
          }
        : { show: false },
    };
    if (look === "horizontalBar") {
      series.type = "bar";
    }
    const stackForSeries = stackMap?.[s.name] || stackName;
    if (stackForSeries) series.stack = stackForSeries;
    return series;
  });
}

function buildPieSeries(look: ChartLook, control: ChartControl, data: ChartData, colors: string[]): EChartsOption["series"] {
  const radiusInner = Math.max(0, Number(control.cutout ?? 0));
  const hasMultiple = data.series.length > 1;
  const radiusBase = radiusInner > 0 ? [radiusInner, "70%"] : [0, "70%"];
  const startAngle = toPositiveNumber(control.startAngle);

  return data.series.map((s, idx) => {
    const radius = hasMultiple ? [radiusInner, `${50 + idx * 15}%`] : radiusBase;
    const dataWithColor = s.data.map((val, i) => {
      const base = colors[i % colors.length];
      if (look === "polar-area" && control.useDifferentColor) {
        const alpha = Math.max(0.25, 0.7 - i * 0.06);
        const hex = Math.round(alpha * 255)
          .toString(16)
          .padStart(2, "0");
        return { name: data.labels[i], value: (s.data[i] as number) ?? 0, itemStyle: { color: `${base}${hex}` } };
      }
      return { name: data.labels[i], value: (s.data[i] as number) ?? 0 };
    });
    return {
      type: "pie",
      name: s.name,
      radius,
      startAngle,
      roseType: look === "polar-area" ? "area" : undefined,
      data: dataWithColor,
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

export function buildChartOption(
  control: ChartControl,
  data: ChartData,
  lang: string | null,
  t: (k: string, dflt: string, vars?: Record<string, unknown>) => string,
  hiddenSeries?: Set<string>,
): EChartsOption {
  const look = normalizeLook(control.look);
  const colors = control.colors && control.colors.length > 0 ? control.colors : DEFAULT_COLORS;
  const useUTC = Boolean(control.useUTC);
  const animation = control.animation !== false;
  const stacked = Boolean(control.stacked);
  const stackKey = control.stackKey;
  const stackMap = control.stackMap;
  const stackLabel = Boolean(control.stackLabel && stacked);
  const animationDuration = toOptionalNumber(control.animationDuration);

  const option: EChartsOption = {
    color: colors,
    animation,
    animationDuration,
    useUTC,
      textStyle: { color: "var(--nr-dashboard-widgetTextColor, #000)" },
    tooltip: {
      trigger: look === "pie" || look === "polar-area" ? "item" : "axis",
      axisPointer: stacked && (look === "bar" || look === "horizontalBar") ? { type: "shadow" } : undefined,
      backgroundColor: "rgba(136,136,136,0.95)",
      borderColor: "rgba(0,0,0,0.25)",
      textStyle: { color: "#fff" },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        if (!items.length) return "";
        const first = items[0];
        const axisValue = first.axisValueLabel ?? first.name;
        const header = data.isTimeSeries ? timeFormatter(Number(first.axisValue ?? first.value?.[0] ?? Date.now())) : axisValue;
        const lines = items.map((it: any) => {
          const val = Array.isArray(it.value) ? it.value[1] : it.value;
          return `${it.marker || ""}${it.seriesName}: ${valueFormatter(Number(val))}`;
        });
        return [header, ...lines].join("\n");
      },
    },
    legend: control.legend
      ? {
          selected: hiddenSeries
            ? Array.from(hiddenSeries).reduce<Record<string, boolean>>((acc, name) => {
                acc[name] = false;
                return acc;
              }, {} )
            : undefined,
        }
      : { show: false },
  };

  const valueFormatter = (v: number) => formatNumber(v, lang ?? undefined);
  const timeFormatter = (ts: number) => {
    const d = useUTC ? dayjs.utc(ts) : dayjs(ts);
    const fmt = control.xformat;
    if (!fmt || fmt === "auto") {
      return d.isValid()
        ? d.calendar(undefined, {
            sameDay: "HH:mm:ss",
            lastDay: "MMM D HH:mm",
            lastWeek: "MMM D HH:mm",
            sameElse: "lll",
            nextDay: "HH:mm",
            nextWeek: "MMM D HH:mm",
          })
        : String(ts);
    }
    return d.isValid() ? d.format(fmt) : String(ts);
  };

  if (look === "line" || look === "bar" || look === "horizontalBar") {
    const categoryAxis = {
      type: data.isTimeSeries ? "time" : "category",
      data: data.isTimeSeries ? undefined : data.labels,
      axisLabel: {
        formatter: data.isTimeSeries ? (val: number) => timeFormatter(val) : (val: unknown) => String(val ?? ""),
          color: "var(--nr-dashboard-widgetTextColor, #000)",
      },
      axisLine: { lineStyle: { color: "var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.24))" } },
    };

    const valueAxis = {
      type: "value",
      min: toNumber(control.ymin) ?? undefined,
      max: toNumber(control.ymax) ?? undefined,
      axisLabel: {
        formatter: (val: number) => valueFormatter(val),
          color: "var(--nr-dashboard-widgetTextColor, #000)",
      },
      splitLine: {
          lineStyle: { color: "var(--nr-dashboard-chartSplitLineColor, rgba(0,0,0,0.12))" },
      },
      axisLine: { lineStyle: { color: "var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.18))" } },
    };

    if (look === "horizontalBar") {
      option.yAxis = categoryAxis;
      option.xAxis = valueAxis;
    } else {
      option.xAxis = categoryAxis;
      option.yAxis = valueAxis;
    }

    option.grid = { left: 10, right: 10, top: 24, bottom: 20, containLabel: true };
    option.series = look === "line"
      ? buildLineSeries(control, data)
      : buildBarSeries(look, data, stacked, stackKey, stackMap, stackLabel, valueFormatter);
  } else if (look === "pie" || look === "polar-area") {
    option.series = buildPieSeries(look, control, data, colors);
  } else if (look === "radar") {
    const radarStartAngle = toOptionalNumber(control.radarStartAngle);
    const radarSplitNumber = toOptionalNumber(control.radarSplitNumber);
    const radarShape = control.radarShape === "circle" ? "circle" : control.radarShape === "polygon" ? "polygon" : undefined;
    option.radar = {
      indicator: data.labels.map((l) => ({ name: l })),
      startAngle: radarStartAngle,
      splitNumber: radarSplitNumber,
      shape: radarShape,
        axisName: { color: "var(--nr-dashboard-widgetTextColor, #000)" },
      splitLine: { lineStyle: { color: "var(--nr-dashboard-chartSplitLineColor, rgba(255,255,255,0.15))" } },
      splitArea: {
        areaStyle: {
          color: [
            "var(--nr-dashboard-chartSplitAreaLow, rgba(255,255,255,0.02))",
            "var(--nr-dashboard-chartSplitAreaHigh, rgba(255,255,255,0.05))",
          ],
        },
      },
      axisLine: { lineStyle: { color: "var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.24))" } },
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
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const chartRef = useRef<HTMLDivElement | null>(null);
  const label = c.label || c.name || t("chart_label_index", "Chart {index}", { index: index + 1 });

  const removeOlderMs = useMemo(() => {
    const base = Number(c.removeOlder);
    const unit = Number(c.removeOlderUnit ?? 1);
    if (!Number.isFinite(base) || base <= 0) return undefined;
    return base * unit * 1000;
  }, [c.removeOlder, c.removeOlderUnit]);

  const removeOlderPoints = useMemo(() => {
    const n = Number(c.removeOlderPoints);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [c.removeOlderPoints]);

  useEffect(() => {
    setData((prev) => applyChartPayload(look, c.value, prev, { removeOlderMs, removeOlderPoints }));
  }, [c.value, look, removeOlderMs, removeOlderPoints]);

  useEffect(() => {
    setHidden((prev) => {
      const next = new Set<string>();
      prev.forEach((name) => {
        if (data.series.some((s) => s.name === name)) next.add(name);
      });
      return next;
    });
  }, [data.series]);

  const option = useMemo(
    () => buildChartOption({ ...c, label }, data, lang, t, hidden),
    [c, data, label, lang, t, hidden],
  );

  const { instance } = useECharts(chartRef, [option], () => option, (chart) => {
    chart.off("legendselectchanged");
    chart.on("legendselectchanged", (ev) => {
      const selected = (ev as { selected?: Record<string, boolean> }).selected;
      if (!selected) return;
      setHidden(new Set(Object.entries(selected).filter(([, v]) => v === false).map(([name]) => name)));
    });
  });

  useEffect(() => {
    if (!instance) return;
    instance.setOption(option, { replaceMerge: ["series", "legend"] });
  }, [instance, option]);

  return html`<div
    class=${c.className || ""}
    style=${{  
      width: "100%",
      minHeight: "260px",
      padding: "5px",
      boxSizing: "border-box",
      opacity: disabled ? 0.55 : 1,
      pointerEvents: disabled ? "none" : "auto",
    }}
    aria-label=${t("chart_value_label", "{label} chart", { label })}
  >
    <div ref=${chartRef} style=${{ width: "100%", height: "260px" }}></div>
  </div>`;
}
