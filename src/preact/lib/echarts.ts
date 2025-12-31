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
    
    // Also listen for layout changes
    window.addEventListener("dashboard:layout", handleResize);
    
    // ResizeObserver for container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && ref.current) {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => chart.resize());
      });
      resizeObserver.observe(ref.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("dashboard:layout", handleResize);
      if (resizeObserver) resizeObserver.disconnect();
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
