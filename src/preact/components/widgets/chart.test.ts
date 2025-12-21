import { describe, expect, test } from "bun:test";
import { applyChartPayload, buildChartOption, normalizeLook, type ChartControl, type ChartData } from "./chart";

const t = (key: string, def: string, vars?: Record<string, unknown>) => {
  if (!vars) return def;
  return def.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
};

function emptyData(): ChartData {
  return { labels: [], series: [], isTimeSeries: false };
}

describe("Chart adapter", () => {
  test("parses dataset payload for line with timestamps", () => {
    const payload = [
      {
        values: {
          series: ["s1"],
          labels: ["t1", "t2"],
          data: [
            [
              { x: 1000, y: 1 },
              { x: 2000, y: 2 },
            ],
          ],
        },
      },
    ];
    const next = applyChartPayload("line", payload, emptyData());
    expect(next.isTimeSeries).toBe(true);
    expect(next.series[0].data[0]).toEqual([1000, 1]);
  });

  test("applies streaming update with removal", () => {
    const start = applyChartPayload("line", [
      {
        values: {
          series: ["s1"],
          labels: ["l1"],
          data: [[{ x: 1, y: 1 }]],
        },
      },
    ], emptyData());

    const after = applyChartPayload(
      "line",
      [
        {
          update: true,
          remove: 1,
          values: { series: "s1", data: { x: 2, y: 5 } },
        },
      ],
      start,
    );
    expect(after.series[0].data).toEqual([[2, 5]]);
  });

  test("builds line option with smoothing and span gaps", () => {
    const data: ChartData = {
      labels: [],
      series: [{ name: "s1", data: [[1, 2]] }],
      isTimeSeries: true,
    };
    const control: ChartControl = { look: "line", interpolate: "monotone", spanGaps: true, dot: true };
    const option = buildChartOption(control, data, "en", t);
    const series = option.series as Array<Record<string, unknown>>;
    expect(series[0].smooth).toBe(true);
    expect(series[0].smoothMonotone).toBe("x");
    expect(series[0].connectNulls).toBe(true);
    expect(series[0].showSymbol).toBe(true);
    const xAxis = option.xAxis as { type: string };
    expect(xAxis.type).toBe("time");
  });

  test("builds horizontal bar axes", () => {
    const data: ChartData = {
      labels: ["A", "B"],
      series: [{ name: "S", data: [1, 2] }],
      isTimeSeries: false,
    };
    const option = buildChartOption({ look: "horizontalBar" }, data, "en", t);
    const xAxis = option.xAxis as { type: string };
    const yAxis = option.yAxis as { type: string };
    expect(xAxis.type).toBe("value");
    expect(yAxis.type).toBe("category");
  });

  test("builds pie data from labels", () => {
    const data: ChartData = {
      labels: ["X", "Y"],
      series: [{ name: "S", data: [5, 10] }],
      isTimeSeries: false,
    };
    const option = buildChartOption({ look: "pie" }, data, "en", t);
    const series = option.series as Array<{ data: Array<{ name: string; value: number }> }>;
    expect(series[0].data[0]).toEqual({ name: "X", value: 5 });
    expect(series[0].data[1]).toEqual({ name: "Y", value: 10 });
  });

  test("normalizes look", () => {
    expect(normalizeLook("HorizontalBar")).toBe("horizontalBar");
    expect(normalizeLook("radar")).toBe("radar");
    expect(normalizeLook(undefined)).toBe("line");
  });
});
