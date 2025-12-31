import { html } from "htm/preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { VNode } from "preact";
import type { UiControl } from "../../state";
import {
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  FunnelChart,
  HeatmapChart,
} from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  VisualMapComponent,
  DataZoomComponent,
  MarkLineComponent,
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
  ScatterChart,
  FunnelChart,
  HeatmapChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  VisualMapComponent,
  DataZoomComponent,
  MarkLineComponent,
]);

dayjs.extend(utc);

export type ChartLook = "line" | "bar" | "horizontalBar" | "pie" | "polar-area" | "radar" | "scatter" | "funnel" | "heatmap";

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
  nodata?: string;
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
  options?: Record<string, unknown>;
  // Scatter options
  symbolSize?: number | string;
  // Funnel options
  funnelSort?: "ascending" | "descending" | "none" | string;
  funnelAlign?: "left" | "center" | "right" | string;
  funnelGap?: number | string;
  // Heatmap options
  heatmapMin?: number | string;
  heatmapMax?: number | string;
  heatmapXLabels?: string[];
  heatmapYLabels?: string[];
  // Data zoom options
  dataZoom?: boolean;
  dataZoomType?: "slider" | "inside" | "both" | string;
  dataZoomStart?: number | string;
  dataZoomEnd?: number | string;
  // Mark line options (threshold lines)
  markLines?: Array<{
    value: number;
    label?: string;
    color?: string;
    lineStyle?: "solid" | "dashed" | "dotted";
    axis?: "x" | "y";
  }>;
};

export type ChartSeries = {
  name: string;
  data: Array<number | [number, number] | [number, number, number]>;
};

export type ChartData = {
  labels: string[];
  series: ChartSeries[];
  isTimeSeries: boolean;
  // Heatmap-specific: matrix data as [xIndex, yIndex, value]
  heatmapData?: Array<[number, number, number]>;
  heatmapXLabels?: string[];
  heatmapYLabels?: string[];
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
  if (l === "scatter") return "scatter";
  if (l === "funnel") return "funnel";
  if (l === "heatmap" || l === "heat-map") return "heatmap";
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

function buildDataZoom(control: ChartControl, look: ChartLook): EChartsOption["dataZoom"] {
  if (!control.dataZoom) return undefined;

  const zoomType = control.dataZoomType || "slider";
  const start = toOptionalNumber(control.dataZoomStart) ?? 0;
  const end = toOptionalNumber(control.dataZoomEnd) ?? 100;
  const isHorizontal = look !== "horizontalBar";
  const result: EChartsOption["dataZoom"] = [];

  // Slider zoom (visible handle at bottom/right)
  if (zoomType === "slider" || zoomType === "both") {
    result.push({
      type: "slider",
      xAxisIndex: isHorizontal ? 0 : undefined,
      yAxisIndex: isHorizontal ? undefined : 0,
      start,
      end,
      height: isHorizontal ? 20 : undefined,
      width: isHorizontal ? undefined : 20,
      bottom: isHorizontal ? 0 : undefined,
      right: isHorizontal ? undefined : 0,
      borderColor: "var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.24))",
      backgroundColor: "var(--nr-dashboard-chartSplitAreaLow, rgba(0,0,0,0.05))",
      fillerColor: "var(--nr-dashboard-widgetColor, rgba(31,119,180,0.2))",
      handleStyle: { color: "var(--nr-dashboard-widgetColor, #1F77B4)" },
      textStyle: { color: "var(--nr-dashboard-widgetTextColor, #000)" },
      dataBackground: {
        lineStyle: { color: "var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.24))" },
        areaStyle: { color: "var(--nr-dashboard-chartSplitAreaHigh, rgba(0,0,0,0.1))" },
      },
    });
  }

  // Inside zoom (scroll/pinch to zoom)
  if (zoomType === "inside" || zoomType === "both") {
    result.push({
      type: "inside",
      xAxisIndex: isHorizontal ? 0 : undefined,
      yAxisIndex: isHorizontal ? undefined : 0,
      start,
      end,
      zoomOnMouseWheel: true,
      moveOnMouseMove: true,
      moveOnMouseWheel: false,
    });
  }

  return result.length > 0 ? result : undefined;
}

type MarkLineItem = {
  value: number;
  label?: string;
  color?: string;
  lineStyle?: "solid" | "dashed" | "dotted";
  axis?: "x" | "y";
};

function buildMarkLine(markLines: MarkLineItem[] | undefined, look: ChartLook): Record<string, unknown> | undefined {
  if (!markLines || markLines.length === 0) return undefined;

  const isHorizontal = look !== "horizontalBar";

  return {
    silent: true,
    symbol: "none",
    data: markLines.map((ml) => {
      const isYAxis = ml.axis === "y" || (ml.axis == null && isHorizontal);
      return {
        [isYAxis ? "yAxis" : "xAxis"]: ml.value,
        label: {
          show: Boolean(ml.label),
          formatter: ml.label || String(ml.value),
          position: isYAxis ? "end" : "start",
          color: ml.color || "var(--nr-dashboard-widgetTextColor, #000)",
        },
        lineStyle: {
          color: ml.color || "var(--nr-dashboard-chartColor5, #D62728)",
          type: ml.lineStyle || "dashed",
          width: 2,
        },
      };
    }),
  };
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
  // Match Angular: if (newValue !== undefined && newValue.length > 0)
  if (!Array.isArray(payload) || payload.length === 0) {
    // Keep previous data if series exist (don't clear on empty)
    if (prev.series.length > 0) return prev;
    return { labels: [], series: [], isTimeSeries: false };
  }

  // Angular: newValue = newValue[0]
  const entry = payload[0] as Record<string, unknown>;
  const next = cloneData(prev);
  
  // Angular accesses newValue.values.series, newValue.values.data, etc.
  const values = (entry.values || {}) as Record<string, unknown>;
  
  // Angular UPDATE mode: type === 'line' && newValue.update
  // In this mode: values.series is STRING, values.data is SINGLE POINT {x, y}
  if ((look === "line" || look === "scatter") && entry.update) {
    // Angular: var seriesName = newValue.values.series (string)
    const seriesName = String(values.series ?? "");
    if (!seriesName) return next;
    
    // Angular: find or create series
    let s = next.series.find((ser) => ser.name === seriesName);
    if (!s) {
      s = { name: seriesName, data: [] };
      next.series.push(s);
    }
    next.isTimeSeries = true;
    
    // Angular: if (newValue.remove) { scope.config.data[seriesIndex].splice(0, newValue.remove); }
    const remove = Number((entry as { remove?: number }).remove ?? 0);
    if (Number.isFinite(remove) && remove > 0) {
      s.data.splice(0, remove);
    }
    
    // Angular: scope.config.data[seriesIndex].push(newValue.values.data)
    // values.data is a single point {x, y}
    const point = values.data as { x?: number; y?: number } | undefined;
    if (point && typeof point === "object" && point.x != null && point.y != null) {
      s.data.push([Number(point.x), Number(point.y)]);
      
      // Apply time-based windowing
      const cutoff = windowing?.removeOlderMs;
      if (cutoff && cutoff > 0) {
        const threshold = Number(point.x) - cutoff;
        s.data = s.data.filter((p) => Array.isArray(p) && (p[0] as number) >= threshold);
      }
      
      // Apply point-count windowing
      const maxPoints = windowing?.removeOlderPoints;
      if (maxPoints && maxPoints > 0 && s.data.length > maxPoints) {
        s.data.splice(0, s.data.length - maxPoints);
      }
    }
    
    return next;
  }

  // Angular REPLACE mode: Bar charts and non-update line charts replace the data
  // In this mode: values.series is ARRAY, values.data is ARRAY of ARRAYS
  const seriesArr = Array.isArray(values.series) ? (values.series as string[]) : [];
  const labelsArr = Array.isArray(values.labels) ? (values.labels as string[]) : [];
  const dataArr = Array.isArray(values.data) ? (values.data as unknown[]) : [];
  
  // Angular: scope.config.data = newValue.values.data
  // Angular: scope.config.series = newValue.values.series  
  // Angular: scope.config.labels = newValue.values.labels
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
      symbol: "circle",
      symbolSize: dot ? 6 : 4,
      lineStyle: { width: 2 },
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
  useOneColor: boolean,
  colors: string[],
): EChartsOption["series"] {
  const stackName = stackKey || (stacked ? "stack" : undefined);
  // When useOneColor is false and there's only one series, color each bar differently
  const applyPerBarColor = !useOneColor && data.series.length === 1;

  return data.series.map((s) => {
    const seriesData = applyPerBarColor
      ? s.data.map((val, i) => ({
          value: val,
          itemStyle: { color: colors[i % colors.length] },
        }))
      : s.data;

    const series: Record<string, unknown> = {
      type: "bar",
      name: s.name,
      data: seriesData,
      label: showStackLabel
        ? {
            show: true,
            position: "inside",
            formatter: ({ value }: { value: unknown }) => valueFormatter(Number(value)),
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

function buildScatterSeries(data: ChartData, control: ChartControl): EChartsOption["series"] {
  const symbolSize = toOptionalNumber(control.symbolSize) ?? 10;
  return data.series.map((s) => ({
    type: "scatter",
    name: s.name,
    data: s.data,
    symbolSize,
  }));
}

function buildFunnelSeries(data: ChartData, control: ChartControl, colors: string[]): EChartsOption["series"] {
  const sort = control.funnelSort === "ascending" ? "ascending" : control.funnelSort === "none" ? "none" : "descending";
  const align = control.funnelAlign === "left" ? "left" : control.funnelAlign === "right" ? "right" : "center";
  const gap = toOptionalNumber(control.funnelGap) ?? 2;

  // Funnel expects data as [{name, value}, ...]
  // Use labels as names and first series data as values
  const funnelData = data.labels.map((label, i) => {
    const val = data.series[0]?.data[i];
    const value = typeof val === "number" ? val : Array.isArray(val) ? val[1] ?? val[0] : 0;
    return { name: label, value, itemStyle: { color: colors[i % colors.length] } };
  });

  return [
    {
      type: "funnel",
      data: funnelData,
      sort,
      funnelAlign: align,
      gap,
      left: "10%",
      right: "10%",
      top: 40,
      bottom: 20,
      label: {
        show: true,
        position: "inside",
        formatter: "{b}: {c}",
        color: "var(--nr-dashboard-widgetTextColor, #fff)",
      },
      labelLine: { show: false },
      itemStyle: {
        borderColor: "var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.2))",
        borderWidth: 1,
      },
    },
  ];
}

function buildHeatmapSeries(data: ChartData): EChartsOption["series"] {
  // Heatmap expects data as [[xIdx, yIdx, value], ...]
  // If heatmapData is provided, use it directly
  // Otherwise, try to convert from series data
  const heatmapData = data.heatmapData ?? [];

  if (heatmapData.length === 0 && data.series.length > 0) {
    // Try to build from series: assume each series is a row (yIdx) and data points are columns (xIdx)
    data.series.forEach((s, yIdx) => {
      s.data.forEach((val, xIdx) => {
        const v = typeof val === "number" ? val : Array.isArray(val) && val.length >= 3 ? val[2] : Array.isArray(val) ? val[1] ?? val[0] : 0;
        heatmapData.push([xIdx, yIdx, v as number]);
      });
    });
  }

  return [
    {
      type: "heatmap",
      data: heatmapData,
      label: {
        show: true,
        color: "var(--nr-dashboard-widgetTextColor, #000)",
        formatter: ({ value }: { value: unknown }) => {
          const arr = value as [number, number, number];
          return arr && arr[2] != null ? String(arr[2]) : "";
        },
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    },
  ];
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
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params];
        if (!items.length) return "";
        const first = items[0] as Record<string, unknown>;
        const axisValue = first.axisValueLabel ?? first.name;
        const header = data.isTimeSeries ? timeFormatter(Number(first.axisValue ?? (first.value as number[])?.[0] ?? Date.now())) : axisValue;
        const lines = items.map((it: Record<string, unknown>) => {
          const val = Array.isArray(it.value) ? (it.value as number[])[1] : it.value;
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

    option.grid = { left: 10, right: 10, top: 24, bottom: control.dataZoom ? 40 : 20, containLabel: true };
    const useOneColor = Boolean(control.useOneColor);
    const baseSeries = look === "line"
      ? buildLineSeries(control, data)
      : buildBarSeries(look, data, stacked, stackKey, stackMap, stackLabel, valueFormatter, useOneColor, colors);

    // Add mark lines to first series if configured
    const markLine = buildMarkLine(control.markLines, look);
    if (markLine && Array.isArray(baseSeries) && baseSeries.length > 0) {
      (baseSeries[0] as Record<string, unknown>).markLine = markLine;
    }
    option.series = baseSeries;

    // Add data zoom if enabled
    const dataZoom = buildDataZoom(control, look);
    if (dataZoom) {
      option.dataZoom = dataZoom;
    }
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
  } else if (look === "scatter") {
    // Scatter chart with value axes
    const xAxis = {
      type: data.isTimeSeries ? "time" : "value",
      axisLabel: {
        formatter: data.isTimeSeries ? (val: number) => timeFormatter(val) : (val: number) => valueFormatter(val),
        color: "var(--nr-dashboard-widgetTextColor, #000)",
      },
      axisLine: { lineStyle: { color: "var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.24))" } },
      splitLine: { lineStyle: { color: "var(--nr-dashboard-chartSplitLineColor, rgba(0,0,0,0.12))" } },
    };
    const yAxis = {
      type: "value",
      min: toNumber(control.ymin) ?? undefined,
      max: toNumber(control.ymax) ?? undefined,
      axisLabel: {
        formatter: (val: number) => valueFormatter(val),
        color: "var(--nr-dashboard-widgetTextColor, #000)",
      },
      splitLine: { lineStyle: { color: "var(--nr-dashboard-chartSplitLineColor, rgba(0,0,0,0.12))" } },
      axisLine: { lineStyle: { color: "var(--nr-dashboard-widgetBorderColor, rgba(255,255,255,0.18))" } },
    };
    option.xAxis = xAxis;
    option.yAxis = yAxis;
    option.grid = { left: 10, right: 10, top: 24, bottom: control.dataZoom ? 40 : 20, containLabel: true };

    const scatterSeries = buildScatterSeries(data, control);
    // Add mark lines to first series if configured
    const markLine = buildMarkLine(control.markLines, look);
    if (markLine && Array.isArray(scatterSeries) && scatterSeries.length > 0) {
      (scatterSeries[0] as Record<string, unknown>).markLine = markLine;
    }
    option.series = scatterSeries;

    // Add data zoom if enabled
    const dataZoom = buildDataZoom(control, look);
    if (dataZoom) {
      option.dataZoom = dataZoom;
    }
  } else if (look === "funnel") {
    option.series = buildFunnelSeries(data, control, colors);
  } else if (look === "heatmap") {
    // Heatmap requires category axes for x and y
    const xLabels = data.heatmapXLabels ?? data.labels;
    const yLabels = data.heatmapYLabels ?? data.series.map((s) => s.name);
    option.xAxis = {
      type: "category",
      data: xLabels,
      splitArea: { show: true },
      axisLabel: { color: "var(--nr-dashboard-widgetTextColor, #000)" },
      axisLine: { lineStyle: { color: "var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.24))" } },
    };
    option.yAxis = {
      type: "category",
      data: yLabels,
      splitArea: { show: true },
      axisLabel: { color: "var(--nr-dashboard-widgetTextColor, #000)" },
      axisLine: { lineStyle: { color: "var(--nr-dashboard-widgetBorderColor, rgba(0,0,0,0.24))" } },
    };
    option.grid = { left: 10, right: 60, top: 24, bottom: 20, containLabel: true };

    // VisualMap for color range
    const heatMin = toNumber(control.heatmapMin) ?? 0;
    const heatMax = toNumber(control.heatmapMax) ?? 10;
    option.visualMap = {
      min: heatMin,
      max: heatMax,
      calculable: true,
      orient: "vertical",
      right: 0,
      top: "center",
      inRange: {
        color: colors.length >= 2 ? colors.slice(0, 5) : ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"],
      },
      textStyle: { color: "var(--nr-dashboard-widgetTextColor, #000)" },
    };
    option.series = buildHeatmapSeries(data);
  }

  option.title = {
    show: true,
    text: control.label || control.name || t("chart_label", "Chart"),
    textStyle: { color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)", fontSize: 14, fontWeight: 600 },
  };

  // Allow override of any options if really required (matches legacy behavior)
  if (control.options && typeof control.options === "object") {
    Object.assign(option, control.options);
  }

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

  // Show nodata message when chart is empty
  const isEmpty = data.series.length === 0 || data.series.every((s) => s.data.length === 0);
  const nodataText = c.nodata || "";

  return html`<div
    class=${`nr-dashboard-chart__container ${c.className || ""}`.trim()}
    style=${{  
      opacity: disabled ? 0.55 : 1,
      pointerEvents: disabled ? "none" : "auto",
    }}
    aria-label=${t("chart_value_label", "{label} chart", { label })}
  >
    ${isEmpty && nodataText
      ? html`<div class="nr-dashboard-chart__nodata">${nodataText}</div>`
      : null}
    <div ref=${chartRef} class="nr-dashboard-chart__chart" style=${{ visibility: isEmpty && nodataText ? "hidden" : "visible" }}></div>
  </div>`;
}
