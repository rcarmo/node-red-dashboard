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
  waveoptions?: {
    circleColor?: string;
    waveColor?: string;
    textColor?: string;
    waveTextColor?: string;
  };
};

function computeGaugeHeight(ctrl: GaugeControl): number {
  const gtype = (ctrl.gtype || "gage").toString().toLowerCase();
  if (gtype === "wave") return 240;
  if (gtype === "compass") return 220;
  if (gtype === "donut") return 200;
  return 200;
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

type WaveGaugeProps = {
  value: number;
  min: number;
  max: number;
  label: string;
  units?: string;
  formatter: Intl.NumberFormat;
  circleColor?: string;
  waveColor?: string;
  textColor?: string;
  waveTextColor?: string;
};

function WaveGauge({ value, min, max, label, units, formatter, circleColor, waveColor, textColor, waveTextColor }: WaveGaugeProps): VNode {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animationRef = useRef<number>(0);
  const [waveOffset, setWaveOffset] = useState<number>(0);
  const size = 200;
  const radius = size / 2 - 10;
  const strokeWidth = 4;
  const fillPercent = clamp((value - min) / (max - min || 1), 0, 1);
  const fillHeight = radius * 2 * fillPercent;
  const centerY = size / 2;
  const centerX = size / 2;
  
  const circleStroke = circleColor || "var(--nr-dashboard-widgetColor, #178BCA)";
  const waveFill = waveColor || "var(--nr-dashboard-widgetColor, #178BCA)";
  const textFill = textColor || "var(--nr-dashboard-widgetTextColor, #045681)";
  const waveTextFill = waveTextColor || "var(--nr-dashboard-widgetBackgroundColor, #A4DBf8)";
  
  // Animate wave
  useEffect(() => {
    let startTime: number | null = null;
    const duration = 3000; // 3 seconds for full wave cycle
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      setWaveOffset(progress * Math.PI * 4);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);
  
  // Generate wave path
  const generateWavePath = (): string => {
    const waveHeight = 8;
    const waveCount = 2;
    const fillY = centerY + radius - fillHeight;
    const points: string[] = [];
    
    // Start from left edge
    points.push(`M ${centerX - radius} ${fillY}`);
    
    // Generate wave points
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = centerX - radius + (i / steps) * radius * 2;
      const normalizedX = (i / steps) * Math.PI * 2 * waveCount + waveOffset;
      const waveY = Math.sin(normalizedX) * waveHeight;
      points.push(`L ${x} ${fillY + waveY}`);
    }
    
    // Complete the path to fill the bottom of circle
    points.push(`L ${centerX + radius} ${centerY + radius + 10}`);
    points.push(`L ${centerX - radius} ${centerY + radius + 10}`);
    points.push("Z");
    
    return points.join(" ");
  };
  
  const formattedValue = formatter.format(value);
  const displayText = units ? `${formattedValue}${units}` : formattedValue;
  
  const clipId = `wave-clip-${label.replace(/\s/g, "-")}`;
  
  return html`
    <svg
      ref=${svgRef}
      viewBox="0 0 ${size} ${size}"
      width=${size}
      height=${size}
      class="nr-dashboard-gauge__wave"
      role="img"
      aria-label=${`${label}: ${displayText}`}
    >
      <defs>
        <clipPath id=${clipId}>
          <circle cx=${centerX} cy=${centerY} r=${radius - strokeWidth / 2} />
        </clipPath>
      </defs>
      
      <!-- Outer circle -->
      <circle
        cx=${centerX}
        cy=${centerY}
        r=${radius}
        fill="none"
        stroke=${circleStroke}
        stroke-width=${strokeWidth}
      />
      
      <!-- Wave fill clipped to circle -->
      <g clip-path=${`url(#${clipId})`}>
        <!-- Background circle -->
        <circle
          cx=${centerX}
          cy=${centerY}
          r=${radius}
          fill="var(--nr-dashboard-widgetBackgroundColor, #1a1f2a)"
        />
        <!-- Wave path -->
        <path
          d=${generateWavePath()}
          fill=${waveFill}
          opacity="0.8"
        />
        <!-- Text above wave (different color) -->
        <text
          x=${centerX}
          y=${centerY}
          text-anchor="middle"
          dominant-baseline="middle"
          fill=${waveTextFill}
          font-size="28"
          font-weight="500"
        >${displayText}</text>
      </g>
      
      <!-- Text outside wave (clipped inverse) - shows when wave is below text -->
      <text
        x=${centerX}
        y=${centerY}
        text-anchor="middle"
        dominant-baseline="middle"
        fill=${textFill}
        font-size="28"
        font-weight="500"
        clip-path=${`url(#${clipId})`}
        style="pointer-events: none"
      >${displayText}</text>
    </svg>
  `;
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
  const showTicks = asGauge.gtype === "gage" || asGauge.gtype === "compass" || !asGauge.gtype;
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

  // Render wave gauge using custom SVG component
  if (isWave) {
    const waveOpts = asGauge.waveoptions ?? {};
    return html`<div
      class=${`${asGauge.className || ""}`.trim()}
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
      <div class="nr-dashboard-gauge__title">${label}</div>
      <${WaveGauge}
        value=${value}
        min=${min}
        max=${max}
        label=${label}
        units=${asGauge.units}
        formatter=${formatter}
        circleColor=${waveOpts.circleColor}
        waveColor=${waveOpts.waveColor}
        textColor=${waveOpts.textColor}
        waveTextColor=${waveOpts.waveTextColor}
      />
    </div>`;
  }

  // Compute the color based on value position in segments
  const getValueColor = (): string => {
    const span = max - min || 1;
    const pct = clamp((value - min) / span, 0, 1);
    for (let i = 0; i < segments.length; i++) {
      if (pct <= segments[i][0]) return segments[i][1];
    }
    return segments[segments.length - 1][1];
  };
  const valueColor = getValueColor();

  useECharts(
    chartRef,
    [value, min, max, segments, showTicks, showMinMax, isDonut, isWave, isCompass, formatted, label, reverse, formatter, chartHeight, valueColor],
    () => ({
      backgroundColor: "transparent",
      series: [
        {
          type: "gauge",
          min,
          max,
          radius: "90%",
          startAngle: isCompass ? 90 : reverse ? 45 : 200,
          endAngle: isCompass ? -270 : reverse ? -225 : -20,
          splitNumber: isCompass ? 8 : showTicks ? 5 : 0,
          progress: {
            show: true,
            width: isDonut ? 18 : 12,
            roundCap: true,
            itemStyle: {
              color: valueColor,
              shadowColor: valueColor,
              shadowBlur: 6,
            },
          },
          axisLine: {
            lineStyle: {
              width: isDonut ? 18 : 12,
              color: [[1, "var(--nr-dashboard-gaugeTrackColor, rgba(128,128,128,0.2))"]],
            },
            roundCap: true,
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: {
            show: showMinMax && !isDonut,
            distance: 20,
            fontSize: 11,
            color: "var(--nr-dashboard-widgetTextColor, rgba(255,255,255,0.6))",
            formatter: (val: number) => {
              if (!isCompass) return formatter.format(val);
              const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
              const idx = Math.round(((val % 360) / 45)) % 8;
              return dirs[idx];
            },
          },
          pointer: {
            show: !isDonut,
            length: "60%",
            width: 5,
            itemStyle: {
              color: valueColor,
              shadowColor: "rgba(0,0,0,0.3)",
              shadowBlur: 4,
              shadowOffsetY: 2,
            },
          },
          anchor: {
            show: !isDonut,
            showAbove: true,
            size: 14,
            itemStyle: {
              color: "var(--nr-dashboard-widgetBackgroundColor, #1f2937)",
              borderColor: valueColor,
              borderWidth: 3,
            },
          },
          title: {
            show: false,
          },
          detail: {
            valueAnimation: true,
            formatter: () => formatted,
            color: "var(--nr-dashboard-widgetTextColor, #e9ecf1)",
            fontSize: 20,
            fontWeight: 500,
            offsetCenter: [0, isDonut ? "0%" : "70%"],
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
    class=${`${asGauge.className || ""}`.trim()}
    style=${{  
      width: "100%",
      height: "100%",
      minHeight: `${chartHeight}px`,
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      alignItems: "center",
      justifyContent: "flex-start",
    }}
    aria-label=${ariaLabel}
  >
    <div class="nr-dashboard-gauge__title">${label}</div>
    <div ref=${chartRef} class="nr-dashboard-gauge__chart" style=${{ flex: "1 1 auto", width: "100%", minHeight: `${chartHeight - 40}px` }}></div>
  </div>`;
}
