import { useEffect, useRef } from "preact/hooks";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

// Register core renderer once
const registered: { renderer: boolean } = { renderer: false };

function ensureRenderer(): void {
  if (!registered.renderer) {
    echarts.use([CanvasRenderer]);
    registered.renderer = true;
  }
}

type EChartsModule = Parameters<typeof echarts.use>[0][number];

export type EChartsInstance = echarts.ECharts;

export function registerEChartsModules(modules: EChartsModule[]): void {
  ensureRenderer();
  echarts.use(modules);
}

export function useECharts(
  ref: { current: HTMLDivElement | null },
  deps: unknown[],
  buildOption: () => echarts.EChartsOption,
  onInit?: (chart: EChartsInstance) => void,
): { instance: EChartsInstance | null } {
  const instanceRef = useRef<EChartsInstance | null>(null);

  useEffect(() => {
    ensureRenderer();
    if (!ref.current) return undefined;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    instanceRef.current = chart;
    if (onInit) onInit(chart);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
      instanceRef.current = null;
    };
  }, [ref]);

  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;
    const option = buildOption();
    chart.setOption(option, true);
  }, deps);

  return { instance: instanceRef.current };
}
