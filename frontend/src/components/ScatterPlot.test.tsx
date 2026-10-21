import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FitResponse } from "../lib/api";
import { downloadChart } from "../lib/chartExport";
import { ScatterPlot, type TickDensity } from "./ScatterPlot";

vi.mock("../lib/chartExport", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/chartExport")>();
  return { ...actual, downloadChart: vi.fn() };
});

const downloadChartMock = vi.mocked(downloadChart);

const pairs = [
  { x: 0, y: 0.012 },
  { x: 2.5, y: 0.084 },
  { x: 5, y: 0.121 },
  { x: 10, y: 0.241 },
];

function createFit(overrides: Partial<FitResponse> = {}): FitResponse {
  return {
    x_column: "time_s",
    y_column: "absorbance",
    x_unit: "s",
    y_unit: "mV",
    row_count: pairs.length,
    pair_count: pairs.length,
    skipped_count: 0,
    degree: 1,
    coefficients: [0.0229, 0.012],
    equation: "y = 0.0229x + 0.012",
    r_squared: 0.99,
    pairs,
    fitted: pairs.map((pair) => 0.0229 * pair.x + 0.012),
    residuals: pairs.map(() => 0),
    rmse: 0,
    max_abs_residual: 0,
    warnings: [],
    uncertainty: {
      residual_dof: pairs.length - 2,
      standard_errors: null,
      confidence_intervals: null,
      condition_number: null,
      ill_conditioned: false,
    },
    weighted: false,
    y_error_column: null,
    y_error_unit: null,
    y_errors: null,
    chi_squared: null,
    reduced_chi_squared: null,
    ...overrides,
  };
}

function numberAttribute(element: Element, name: string): number {
  return Number(element.getAttribute(name));
}

function curveCoordinates(element: Element): number[][] {
  return (element.getAttribute("points") ?? "")
    .trim()
    .split(/\s+/)
    .map((part) => part.split(",").map(Number));
}

function tickLabels(axis: "x" | "y"): string[] {
  return screen
    .getAllByTestId(`scatter-${axis}-tick`)
    .map((tick) => tick.textContent ?? "");
}

const sixPairs = [
  { x: 0, y: 0.05 },
  { x: 2, y: 0.1 },
  { x: 4, y: 0.15 },
  { x: 6, y: 0.2 },
  { x: 8, y: 0.22 },
  { x: 10, y: 0.25 },
];

const narrowPairs = [
  { x: 4999995, y: 5000005 },
  { x: 5000000, y: 5000000 },
  { x: 5000005, y: 4999995 },
];

function weightedFit(
  data: { x: number; y: number }[],
  coefficients: number[] = [0.02, 0.05],
): FitResponse {
  return createFit({
    pairs: data,
    pair_count: data.length,
    row_count: data.length,
    coefficients,
    weighted: true,
    y_error_column: "err",
    y_error_unit: "mV",
    y_errors: data.map((_, index) => 0.01 + index * 0.002),
  });
}

function plotSnapshot() {
  const plot = screen.getByTestId("scatter-plot");
  return {
    domains: [
      "data-domain-x-min",
      "data-domain-x-max",
      "data-domain-y-min",
      "data-domain-y-max",
    ].map((name) => plot.getAttribute(name)),
    points: screen
      .getAllByTestId("scatter-point")
      .map((point) => [point.getAttribute("cx"), point.getAttribute("cy")]),
    curve: screen.getByTestId("fit-curve").getAttribute("points"),
    bars: screen.getAllByTestId("error-bar").map((bar) => bar.innerHTML),
  };
}

function expectTicksInsideDomain(density: TickDensity): void {
  const ranges: Record<TickDensity, { min: number; max: number }> = {
    sparse: { min: 3, max: 4 },
    standard: { min: 4, max: 6 },
    dense: { min: 6, max: 9 },
  };
  const plot = screen.getByTestId("scatter-plot");
  for (const axis of ["x", "y"] as const) {
    const labels = tickLabels(axis);
    expect(labels.length).toBeGreaterThanOrEqual(ranges[density].min);
    expect(labels.length).toBeLessThanOrEqual(ranges[density].max);
    const values = labels.map(Number);
    expect(new Set(labels).size).toBe(labels.length);
    const domainMin = numberAttribute(plot, `data-domain-${axis}-min`);
    const domainMax = numberAttribute(plot, `data-domain-${axis}-max`);
    for (const value of values) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(domainMin);
      expect(value).toBeLessThanOrEqual(domainMax);
    }
  }
}

describe("ScatterPlot", () => {
  it("renders one circle and matching data attributes per finite pair", () => {
    render(
      <ScatterPlot pairs={pairs} xColumn="time_s" yColumn="absorbance" />,
    );

    const plot = screen.getByTestId("scatter-plot");
    expect(plot).toHaveAttribute("data-point-count", String(pairs.length));
    expect(screen.getByTestId("scatter-legend")).toHaveTextContent("4 个");

    const points = screen.getAllByTestId("scatter-point");
    expect(points).toHaveLength(pairs.length);
    points.forEach((point, index) => {
      expect(point.getAttribute("data-x")).toBe(String(pairs[index].x));
      expect(point.getAttribute("data-y")).toBe(String(pairs[index].y));
    });

    expect(screen.queryByTestId("fit-curve")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("error-bar")).toHaveLength(0);
  });

  it("draws a deterministic 101-sample fit curve across the visible X domain", () => {
    render(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        fit={createFit()}
      />,
    );

    const plot = screen.getByTestId("scatter-plot");
    const curve = screen.getByTestId("fit-curve");
    expect(curve).toHaveAttribute("data-point-count", "101");
    expect(curve).toHaveAttribute("data-degree", "1");
    expect(numberAttribute(curve, "data-x-min")).toBeCloseTo(
      numberAttribute(plot, "data-domain-x-min"),
      9,
    );
    expect(numberAttribute(curve, "data-x-max")).toBeCloseTo(
      numberAttribute(plot, "data-domain-x-max"),
      9,
    );
    expect(screen.getByTestId("scatter-fit-legend")).toHaveTextContent(
      "实线为拟合曲线",
    );
    expect(plot.getAttribute("aria-label")).toContain("拟合曲线");

    const coordinates = curveCoordinates(curve);
    expect(coordinates).toHaveLength(101);
    for (const [x, y] of coordinates) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
    expect(coordinates[0][0]).toBeLessThan(coordinates[100][0]);
    expect(coordinates[0][0]).toBe(Math.min(...coordinates.map(([x]) => x)));
    expect(coordinates[100][0]).toBe(Math.max(...coordinates.map(([x]) => x)));
  });

  it("draws one Y error bar per finite weighted pair and skips invalid sigma", () => {
    const weighted = createFit({
      weighted: true,
      y_error_column: "absorbance_err",
      y_error_unit: "mV",
      y_errors: [0.05, Number.NaN, 0.02, Number.POSITIVE_INFINITY],
    });
    render(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        fit={weighted}
      />,
    );

    const bars = screen.getAllByTestId("error-bar");
    expect(bars).toHaveLength(2);
    const expected = [pairs[0], pairs[2]];
    bars.forEach((bar, index) => {
      const y = numberAttribute(bar, "data-y");
      const sigma = numberAttribute(bar, "data-sigma");
      expect(numberAttribute(bar, "data-x")).toBe(expected[index].x);
      expect(y).toBeCloseTo(expected[index].y, 12);
      expect(numberAttribute(bar, "data-y-low")).toBeCloseTo(y - sigma, 12);
      expect(numberAttribute(bar, "data-y-high")).toBeCloseTo(y + sigma, 12);
    });

    expect(screen.getByTestId("scatter-error-legend")).toHaveTextContent(
      "竖线为 Y 误差棒（±σ）",
    );
    expect(screen.getByTestId("scatter-plot").getAttribute("aria-label")).toContain(
      "Y 误差棒",
    );
  });

  it("expands the Y domain to cover error bars only when they are shown", () => {
    const { rerender } = render(
      <ScatterPlot pairs={pairs} xColumn="time_s" yColumn="absorbance" />,
    );
    const baseMin = numberAttribute(
      screen.getByTestId("scatter-plot"),
      "data-domain-y-min",
    );
    const baseMax = numberAttribute(
      screen.getByTestId("scatter-plot"),
      "data-domain-y-max",
    );

    rerender(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        fit={createFit({ coefficients: [0, 0.1] })}
      />,
    );
    expect(
      numberAttribute(screen.getByTestId("scatter-plot"), "data-domain-y-min"),
    ).toBe(baseMin);
    expect(
      numberAttribute(screen.getByTestId("scatter-plot"), "data-domain-y-max"),
    ).toBe(baseMax);

    rerender(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        fit={createFit({
          coefficients: [0, 0.1],
          weighted: true,
          y_error_column: "absorbance_err",
          y_errors: pairs.map(() => 0.1),
        })}
      />,
    );

    const plot = screen.getByTestId("scatter-plot");
    const yMin = numberAttribute(plot, "data-domain-y-min");
    const yMax = numberAttribute(plot, "data-domain-y-max");
    expect(yMin).toBeLessThan(Math.min(...pairs.map((pair) => pair.y - 0.1)));
    expect(yMax).toBeGreaterThan(Math.max(...pairs.map((pair) => pair.y + 0.1)));

    const yTicks = screen.getAllByTestId("scatter-y-tick");
    expect(yTicks.length).toBeGreaterThanOrEqual(4);
    expect(yTicks.length).toBeLessThanOrEqual(6);
  });

  it("includes out-of-range cubic samples in the Y domain so the curve stays inside the plot", () => {
    const cubicPairs = [
      { x: 0, y: 0.01 },
      { x: 2.5, y: 0.02 },
      { x: 5, y: 0.015 },
      { x: 7.5, y: 0.025 },
      { x: 10, y: 0.02 },
    ];
    const cubic = createFit({
      pairs: cubicPairs,
      pair_count: cubicPairs.length,
      row_count: cubicPairs.length,
      degree: 3,
      coefficients: [1, -15, 75, -125],
      equation: "y = x^3 - 15x^2 + 75x - 125",
      fitted: cubicPairs.map((pair) => pair.y),
      residuals: cubicPairs.map(() => 0),
    });

    render(
      <ScatterPlot
        pairs={cubicPairs}
        xColumn="time_s"
        yColumn="absorbance"
        fit={cubic}
      />,
    );

    const plot = screen.getByTestId("scatter-plot");
    const yMin = numberAttribute(plot, "data-domain-y-min");
    const yMax = numberAttribute(plot, "data-domain-y-max");

    // (x - 5)^3 reaches about ±166 at the padded X edges, far beyond the data Y range.
    expect(yMin).toBeLessThan(-160);
    expect(yMax).toBeGreaterThan(160);

    const curve = screen.getByTestId("fit-curve");
    const coordinates = curveCoordinates(curve);
    expect(coordinates).toHaveLength(101);
    for (const [x, y] of coordinates) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      // The inner plot area is y ∈ [24, 296]; samples must stay inside it.
      expect(y).toBeGreaterThanOrEqual(24 - 1e-6);
      expect(y).toBeLessThanOrEqual(296 + 1e-6);
    }

    const yTicks = screen.getAllByTestId("scatter-y-tick");
    expect(yTicks.length).toBeGreaterThanOrEqual(4);
    expect(yTicks.length).toBeLessThanOrEqual(6);
    for (const tick of yTicks) {
      const value = Number(tick.textContent);
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(yMin);
      expect(value).toBeLessThanOrEqual(yMax);
    }
  });

  it("keeps curve and error bar coordinates finite for degenerate domains", () => {
    const { rerender } = render(
      <ScatterPlot
        pairs={[{ x: 4, y: 9 }]}
        xColumn="time_s"
        yColumn="absorbance"
        fit={createFit({
          pair_count: 1,
          pairs: [{ x: 4, y: 9 }],
          fitted: [9],
          residuals: [0],
          coefficients: [0.5, 2],
        })}
      />,
    );

    for (const [x, y] of curveCoordinates(screen.getByTestId("fit-curve"))) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }

    rerender(
      <ScatterPlot
        pairs={[
          { x: 5, y: 1 },
          { x: 5, y: 2 },
          { x: 5, y: 3 },
        ]}
        xColumn="time_s"
        yColumn="absorbance"
        fit={createFit({
          pairs: [
            { x: 5, y: 1 },
            { x: 5, y: 2 },
            { x: 5, y: 3 },
          ],
          weighted: true,
          y_error_column: "err",
          y_errors: [0.1, 0.2, 0.3],
        })}
      />,
    );

    for (const bar of screen.getAllByTestId("error-bar")) {
      expect(Number.isFinite(numberAttribute(bar, "data-y-low"))).toBe(true);
      expect(Number.isFinite(numberAttribute(bar, "data-y-high"))).toBe(true);
    }
    for (const [x, y] of curveCoordinates(screen.getByTestId("fit-curve"))) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }

    rerender(
      <ScatterPlot
        pairs={[]}
        xColumn="time_s"
        yColumn="absorbance"
        fit={createFit()}
      />,
    );

    expect(screen.getByTestId("scatter-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("fit-curve")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("error-bar")).toHaveLength(0);
  });

  it("shows column names with units and omits empty parentheses without units", () => {
    const { rerender } = render(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        xUnit="s"
        yUnit="mV"
      />,
    );

    expect(screen.getByTestId("scatter-x-label")).toHaveTextContent("time_s (s)");
    expect(screen.getByTestId("scatter-y-label")).toHaveTextContent(
      "absorbance (mV)",
    );

    rerender(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        xUnit={null}
        yUnit=""
      />,
    );

    const xLabel = screen.getByTestId("scatter-x-label");
    const yLabel = screen.getByTestId("scatter-y-label");
    expect(xLabel.textContent).toBe("time_s");
    expect(yLabel.textContent).toBe("absorbance");
    expect(xLabel.textContent).not.toContain("(");
    expect(yLabel.textContent).not.toContain("(");
  });

  it("pads the automatic domain around the data and keeps ticks inside it", () => {
    render(
      <ScatterPlot pairs={pairs} xColumn="time_s" yColumn="absorbance" />,
    );

    const plot = screen.getByTestId("scatter-plot");
    const xMin = numberAttribute(plot, "data-domain-x-min");
    const xMax = numberAttribute(plot, "data-domain-x-max");
    const yMin = numberAttribute(plot, "data-domain-y-min");
    const yMax = numberAttribute(plot, "data-domain-y-max");
    const dataX = pairs.map((pair) => pair.x);
    const dataY = pairs.map((pair) => pair.y);

    expect(xMin).toBeLessThan(Math.min(...dataX));
    expect(xMax).toBeGreaterThan(Math.max(...dataX));
    expect(yMin).toBeLessThan(Math.min(...dataY));
    expect(yMax).toBeGreaterThan(Math.max(...dataY));

    const xTicks = screen.getAllByTestId("scatter-x-tick");
    const yTicks = screen.getAllByTestId("scatter-y-tick");
    expect(xTicks.length).toBeGreaterThanOrEqual(4);
    expect(xTicks.length).toBeLessThanOrEqual(6);
    expect(yTicks.length).toBeGreaterThanOrEqual(4);
    expect(yTicks.length).toBeLessThanOrEqual(6);

    for (const tick of xTicks) {
      const value = Number(tick.textContent);
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(xMin);
      expect(value).toBeLessThanOrEqual(xMax);
      expect(tick.textContent).not.toContain("NaN");
      expect(tick.textContent).not.toContain("Infinity");
    }
    for (const tick of yTicks) {
      const value = Number(tick.textContent);
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(yMin);
      expect(value).toBeLessThanOrEqual(yMax);
    }
  });

  it("produces finite coordinates when all X or all Y values are identical", () => {
    const { rerender } = render(
      <ScatterPlot
        pairs={[
          { x: 5, y: 1 },
          { x: 5, y: 2 },
          { x: 5, y: 3 },
        ]}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );

    for (const point of screen.getAllByTestId("scatter-point")) {
      expect(Number.isFinite(Number(point.getAttribute("cx")))).toBe(true);
      expect(Number.isFinite(Number(point.getAttribute("cy")))).toBe(true);
    }

    rerender(
      <ScatterPlot
        pairs={[
          { x: 1, y: 7 },
          { x: 2, y: 7 },
          { x: 3, y: 7 },
        ]}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );

    for (const point of screen.getAllByTestId("scatter-point")) {
      expect(Number.isFinite(Number(point.getAttribute("cx")))).toBe(true);
      expect(Number.isFinite(Number(point.getAttribute("cy")))).toBe(true);
      expect(point.getAttribute("cx")).not.toContain("NaN");
      expect(point.getAttribute("cy")).not.toContain("Infinity");
    }
  });

  it("shows a Chinese empty state with no axes or points for zero pairs", () => {
    render(<ScatterPlot pairs={[]} xColumn="time_s" yColumn="absorbance" />);

    expect(screen.getByTestId("scatter-empty")).toHaveTextContent(
      "暂无可绘制的数据点",
    );
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-point-count",
      "0",
    );
    expect(screen.queryAllByTestId("scatter-point")).toHaveLength(0);
    expect(screen.queryAllByTestId("scatter-x-tick")).toHaveLength(0);
    expect(screen.queryAllByTestId("scatter-y-tick")).toHaveLength(0);
    expect(screen.queryByTestId("scatter-x-label")).not.toBeInTheDocument();
  });

  it("keeps the single point and explains that a trend is not derivable", () => {
    render(
      <ScatterPlot
        pairs={[{ x: 4, y: 9 }]}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );

    expect(screen.getAllByTestId("scatter-point")).toHaveLength(1);
    expect(screen.getByTestId("scatter-single-hint")).toHaveTextContent(
      "仅 1 个数据点，无法判断趋势",
    );
  });

  it("filters non-finite points so the SVG never contains invalid coordinates", () => {
    render(
      <ScatterPlot
        pairs={[
          { x: Number.NaN, y: 1 },
          { x: 2, y: Number.POSITIVE_INFINITY },
          { x: 3, y: 4 },
          { x: Number.NEGATIVE_INFINITY, y: 5 },
        ]}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );

    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-point-count",
      "1",
    );
    const points = screen.getAllByTestId("scatter-point");
    expect(points).toHaveLength(1);
    expect(points[0]).toHaveAttribute("data-x", "3");
    expect(points[0]).toHaveAttribute("data-y", "4");

    const svg = screen.getByTestId("scatter-plot").outerHTML;
    expect(svg).not.toContain("NaN");
    expect(svg).not.toContain("Infinity");
  });

  it("keeps four to six ticks on both axes for a single point", () => {
    render(
      <ScatterPlot
        pairs={[{ x: 4, y: 9 }]}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );

    const xTicks = screen.getAllByTestId("scatter-x-tick");
    const yTicks = screen.getAllByTestId("scatter-y-tick");
    expect(xTicks.length).toBeGreaterThanOrEqual(4);
    expect(xTicks.length).toBeLessThanOrEqual(6);
    expect(yTicks.length).toBeGreaterThanOrEqual(4);
    expect(yTicks.length).toBeLessThanOrEqual(6);
  });

  it("keeps four to six Y ticks when every Y value is identical", () => {
    render(
      <ScatterPlot
        pairs={[
          { x: 1, y: 7 },
          { x: 2, y: 7 },
          { x: 3, y: 7 },
        ]}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );

    const xTicks = screen.getAllByTestId("scatter-x-tick");
    const yTicks = screen.getAllByTestId("scatter-y-tick");
    expect(xTicks.length).toBeGreaterThanOrEqual(4);
    expect(xTicks.length).toBeLessThanOrEqual(6);
    expect(yTicks.length).toBeGreaterThanOrEqual(4);
    expect(yTicks.length).toBeLessThanOrEqual(6);
  });

  it("keeps domains and coordinates finite for extreme finite values", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ScatterPlot
        pairs={[{ x: Number.MAX_VALUE, y: -Number.MAX_VALUE }]}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );

    const plot = screen.getByTestId("scatter-plot");
    for (const name of [
      "data-domain-x-min",
      "data-domain-x-max",
      "data-domain-y-min",
      "data-domain-y-max",
    ]) {
      const value = Number(plot.getAttribute(name));
      expect(Number.isFinite(value)).toBe(true);
    }

    for (const point of screen.getAllByTestId("scatter-point")) {
      expect(Number.isFinite(Number(point.getAttribute("cx")))).toBe(true);
      expect(Number.isFinite(Number(point.getAttribute("cy")))).toBe(true);
    }
    expect(plot.outerHTML).not.toContain("NaN");
    expect(plot.outerHTML).not.toContain("Infinity");
    expect(errorSpy.mock.calls.flat().join(" ")).not.toMatch(/NaN|Infinity/);
    errorSpy.mockRestore();
  });

  it("renders a centered, escaped chart title only when it is not blank", () => {
    const { rerender } = render(
      <ScatterPlot pairs={pairs} xColumn="time_s" yColumn="absorbance" />,
    );
    const baselineCy =
      screen.getAllByTestId("scatter-point")[0].getAttribute("cy");
    expect(screen.queryByTestId("chart-title")).not.toBeInTheDocument();

    rerender(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        title="   "
      />,
    );
    expect(screen.queryByTestId("chart-title")).not.toBeInTheDocument();
    expect(
      screen.getAllByTestId("scatter-point")[0].getAttribute("cy"),
    ).toBe(baselineCy);

    const rawTitle = '<script>alert("x")</script> & 标题';
    rerender(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        title={rawTitle}
      />,
    );
    const title = screen.getByTestId("chart-title");
    expect(title).toHaveTextContent(rawTitle);
    expect(title).toHaveAttribute("text-anchor", "middle");
    expect(Number(title.getAttribute("x"))).toBe(320);
    expect(Number(title.getAttribute("y"))).toBeLessThan(24);
    expect(screen.getByTestId("scatter-plot").querySelector("script")).toBeNull();
    expect(screen.getByTestId("scatter-plot").getAttribute("aria-label")).toContain(
      "标题「",
    );
  });

  it("keeps grid lines off by default and draws one dashed line per tick on demand", () => {
    const weighted = createFit({
      weighted: true,
      y_error_column: "absorbance_err",
      y_error_unit: "mV",
      y_errors: [0.01, 0.02, 0.03, 0.04],
    });
    const { rerender } = render(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        fit={weighted}
      />,
    );
    expect(screen.queryAllByTestId("grid-line")).toHaveLength(0);
    expect(screen.queryByTestId("scatter-grid-legend")).not.toBeInTheDocument();
    const before = screen
      .getAllByTestId("scatter-point")
      .map((point) => `${point.getAttribute("cx")},${point.getAttribute("cy")}`);
    const curveBefore = screen.getByTestId("fit-curve").getAttribute("points");
    const barsBefore = screen
      .getAllByTestId("error-bar")
      .map((bar) => bar.innerHTML);

    rerender(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        fit={weighted}
        showGrid
      />,
    );

    const xTicks = screen.getAllByTestId("scatter-x-tick");
    const yTicks = screen.getAllByTestId("scatter-y-tick");
    const lines = screen.getAllByTestId("grid-line");
    expect(lines).toHaveLength(xTicks.length + yTicks.length);
    expect(lines.filter((line) => line.getAttribute("data-axis") === "x")).toHaveLength(
      xTicks.length,
    );
    expect(lines.filter((line) => line.getAttribute("data-axis") === "y")).toHaveLength(
      yTicks.length,
    );
    for (const line of lines) {
      expect(line).toHaveAttribute("stroke-dasharray", "4 4");
      expect(line.getAttribute("stroke")).toBe("#e2e8f0");
    }

    const after = screen
      .getAllByTestId("scatter-point")
      .map((point) => `${point.getAttribute("cx")},${point.getAttribute("cy")}`);
    expect(after).toEqual(before);
    expect(screen.getByTestId("fit-curve").getAttribute("points")).toBe(curveBefore);
    expect(
      screen.getAllByTestId("error-bar").map((bar) => bar.innerHTML),
    ).toEqual(barsBefore);

    const gridGroup = screen.getByTestId("grid-group");
    const lowerLayers = [
      screen.getAllByTestId("scatter-point")[0],
      screen.getByTestId("fit-curve"),
      screen.getAllByTestId("error-bar")[0],
    ];
    for (const layer of lowerLayers) {
      expect(
        gridGroup.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    expect(screen.getByTestId("scatter-grid-legend")).toHaveTextContent(
      "虚线段为网格参考线",
    );
  });

  it("keeps sparse and dense tick counts unique, finite and inside the domain", () => {
    const cases = [
      { name: "regular", data: pairs },
      { name: "single point", data: [{ x: 4, y: 9 }] },
      {
        name: "identical X",
        data: [
          { x: 5, y: 1 },
          { x: 5, y: 2 },
          { x: 5, y: 3 },
        ],
      },
      {
        name: "identical Y",
        data: [
          { x: 1, y: 7 },
          { x: 2, y: 7 },
          { x: 3, y: 7 },
        ],
      },
      {
        name: "extreme finite",
        data: [{ x: Number.MAX_VALUE, y: -Number.MAX_VALUE }],
      },
    ];
    const configs = [
      { density: "sparse" as const, min: 3, max: 4 },
      { density: "dense" as const, min: 6, max: 9 },
    ];

    for (const config of configs) {
      for (const testCase of cases) {
        const { unmount } = render(
          <ScatterPlot
            pairs={testCase.data}
            xColumn="time_s"
            yColumn="absorbance"
            tickDensity={config.density}
          />,
        );
        const plot = screen.getByTestId("scatter-plot");
        for (const axis of ["x", "y"] as const) {
          const ticks = screen.getAllByTestId(`scatter-${axis}-tick`);
          expect(ticks.length).toBeGreaterThanOrEqual(config.min);
          expect(ticks.length).toBeLessThanOrEqual(config.max);
          const values = ticks.map((tick) => Number(tick.textContent));
          expect(new Set(values).size).toBe(values.length);
          const domainMin = numberAttribute(plot, `data-domain-${axis}-min`);
          const domainMax = numberAttribute(plot, `data-domain-${axis}-max`);
          for (const value of values) {
            expect(Number.isFinite(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(domainMin);
            expect(value).toBeLessThanOrEqual(domainMax);
          }
        }
        for (const point of screen.getAllByTestId("scatter-point")) {
          expect(Number.isFinite(Number(point.getAttribute("cx")))).toBe(true);
          expect(Number.isFinite(Number(point.getAttribute("cy")))).toBe(true);
        }
        expect(plot.outerHTML).not.toContain("NaN");
        expect(plot.outerHTML).not.toContain("Infinity");
        unmount();
      }
    }
  });

  it("keeps dense tick labels unique for large values with a narrow span", () => {
    render(
      <ScatterPlot
        pairs={[
          { x: 4808119.117282331, y: 4773716.589715332 },
          { x: 4777127.455105074, y: 4840162.042528391 },
          { x: 4810557.4819026515, y: 4796042.640064843 },
          { x: 4817035.215464421, y: 4848784.694285132 },
        ]}
        xColumn="easting_m"
        yColumn="northing_m"
        tickDensity="dense"
      />,
    );

    for (const axis of ["x", "y"] as const) {
      const labels = tickLabels(axis);
      expect(labels.length).toBeGreaterThanOrEqual(6);
      expect(new Set(labels).size).toBe(labels.length);
      for (const label of labels) {
        expect(Number.isFinite(Number(label))).toBe(true);
      }
    }
  });

  it("keeps dense tick labels unique for narrow spans at large and small scales", () => {
    const cases = [
      {
        name: "5e6 plus or minus 5",
        data: [
          { x: 4999995, y: 5000005 },
          { x: 5000000, y: 5000000 },
          { x: 5000005, y: 4999995 },
        ],
      },
      {
        name: "1e-6 plus or minus 1e-9",
        data: [
          { x: 9.99e-7, y: 1.001e-6 },
          { x: 1e-6, y: 1e-6 },
          { x: 1.001e-6, y: 9.99e-7 },
        ],
      },
    ];

    for (const testCase of cases) {
      const { unmount } = render(
        <ScatterPlot
          pairs={testCase.data}
          xColumn="x"
          yColumn="y"
          tickDensity="dense"
        />,
      );
      for (const axis of ["x", "y"] as const) {
        const labels = tickLabels(axis);
        expect(labels.length).toBeGreaterThanOrEqual(6);
        expect(new Set(labels).size).toBe(labels.length);
        for (const label of labels) {
          expect(Number.isFinite(Number(label))).toBe(true);
        }
      }
      unmount();
    }
  });

  it("keeps domain, points, fit curve and error bars identical across tick densities", () => {
    const cases = [
      { name: "small regular", data: sixPairs, coefficients: [0.02, 0.05] },
      {
        name: "5e6 plus or minus 5",
        data: narrowPairs,
        coefficients: [1, 0.001],
      },
    ];
    const densities: TickDensity[] = ["sparse", "standard", "dense"];

    for (const testCase of cases) {
      const fit = weightedFit(testCase.data, testCase.coefficients);
      let baseline: ReturnType<typeof plotSnapshot> | null = null;
      for (const density of densities) {
        const { unmount } = render(
          <ScatterPlot
            pairs={testCase.data}
            xColumn="time_s"
            yColumn="absorbance"
            fit={fit}
            tickDensity={density}
          />,
        );
        const snapshot = plotSnapshot();
        expectTicksInsideDomain(density);
        if (!baseline) {
          baseline = snapshot;
        } else {
          expect(snapshot.domains).toEqual(baseline.domains);
          expect(snapshot.points).toEqual(baseline.points);
          expect(snapshot.curve).toBe(baseline.curve);
          expect(snapshot.bars).toEqual(baseline.bars);
        }
        unmount();
      }
    }
  });

  it("keeps the QA reproduction datasets on their fixed padded domains", () => {
    const cases = [
      {
        name: "small regular",
        data: sixPairs,
        expected: { x: [-0.5, 10.5], y: [0.04, 0.26] },
      },
      {
        name: "5e6 plus or minus 5",
        data: narrowPairs,
        expected: { x: [4999994.5, 5000005.5], y: [4999994.5, 5000005.5] },
      },
    ];
    const densities: TickDensity[] = ["sparse", "standard", "dense"];

    for (const testCase of cases) {
      let baseline: [string | null, string | null][] | null = null;
      for (const density of densities) {
        const { unmount } = render(
          <ScatterPlot
            pairs={testCase.data}
            xColumn="x"
            yColumn="y"
            tickDensity={density}
          />,
        );
        const plot = screen.getByTestId("scatter-plot");
        expect(
          numberAttribute(plot, "data-domain-x-min"),
        ).toBeCloseTo(testCase.expected.x[0], 9);
        expect(
          numberAttribute(plot, "data-domain-x-max"),
        ).toBeCloseTo(testCase.expected.x[1], 9);
        expect(
          numberAttribute(plot, "data-domain-y-min"),
        ).toBeCloseTo(testCase.expected.y[0], 9);
        expect(
          numberAttribute(plot, "data-domain-y-max"),
        ).toBeCloseTo(testCase.expected.y[1], 9);

        const coordinates = screen
          .getAllByTestId("scatter-point")
          .map(
            (point) =>
              [point.getAttribute("cx"), point.getAttribute("cy")] as [
                string | null,
                string | null,
              ],
          );
        if (!baseline) {
          baseline = coordinates;
        } else {
          expect(coordinates).toEqual(baseline);
        }
        expectTicksInsideDomain(density);
        unmount();
      }
    }
  });

  it("keeps standard tick labels unchanged for the default regular dataset", () => {
    render(<ScatterPlot pairs={pairs} xColumn="time_s" yColumn="absorbance" />);

    expect(tickLabels("x")).toEqual(["0", "2.5", "5", "7.5", "10"]);
    expect(tickLabels("y")).toEqual(["0.05", "0.1", "0.15", "0.2", "0.25"]);
  });

  it("changes title, label and tick font sizes without moving chart geometry", () => {
    const weighted = createFit({
      weighted: true,
      y_error_column: "absorbance_err",
      y_error_unit: "mV",
      y_errors: [0.01, 0.02, 0.03, 0.04],
    });
    const { rerender } = render(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        fit={weighted}
        title="滴定曲线"
      />,
    );

    const snapshot = () => ({
      domains: [
        "data-domain-x-min",
        "data-domain-x-max",
        "data-domain-y-min",
        "data-domain-y-max",
      ].map((name) => screen.getByTestId("scatter-plot").getAttribute(name)),
      points: screen
        .getAllByTestId("scatter-point")
        .map((point) => `${point.getAttribute("cx")},${point.getAttribute("cy")}`),
      curve: screen.getByTestId("fit-curve").getAttribute("points"),
      bars: screen.getAllByTestId("error-bar").map((bar) => bar.innerHTML),
    });

    expect(
      Number(screen.getAllByTestId("scatter-x-tick")[0].getAttribute("font-size")),
    ).toBe(11);
    expect(
      Number(screen.getByTestId("scatter-x-label").getAttribute("font-size")),
    ).toBe(12);
    expect(Number(screen.getByTestId("chart-title").getAttribute("font-size"))).toBe(
      15,
    );
    const medium = snapshot();

    rerender(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        fit={weighted}
        title="滴定曲线"
        fontScale="large"
      />,
    );
    expect(
      Number(screen.getAllByTestId("scatter-x-tick")[0].getAttribute("font-size")),
    ).toBe(14);
    expect(
      Number(screen.getAllByTestId("scatter-y-tick")[0].getAttribute("font-size")),
    ).toBe(14);
    expect(
      Number(screen.getByTestId("scatter-y-label").getAttribute("font-size")),
    ).toBe(15);
    expect(Number(screen.getByTestId("chart-title").getAttribute("font-size"))).toBe(
      18,
    );
    expect(snapshot()).toEqual(medium);

    rerender(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        fit={weighted}
        title="滴定曲线"
        fontScale="small"
      />,
    );
    expect(
      Number(screen.getAllByTestId("scatter-x-tick")[0].getAttribute("font-size")),
    ).toBe(9);
    expect(
      Number(screen.getByTestId("scatter-x-label").getAttribute("font-size")),
    ).toBe(10);
    expect(Number(screen.getByTestId("chart-title").getAttribute("font-size"))).toBe(
      13,
    );
    expect(snapshot()).toEqual(medium);
  });
});

const multiMain = [
  { x: 0, y: 0 },
  { x: 10, y: 10 },
];
const multiSeries = [
  {
    id: "extra-1",
    name: "温度",
    pairs: [
      { x: 2, y: 20 },
      { x: 8, y: 30 },
    ],
  },
  {
    id: "extra-2",
    name: "压力",
    pairs: [{ x: 4, y: -10 }],
  },
  {
    id: "extra-3",
    name: "湿度",
    pairs: [{ x: 20, y: 40 }],
  },
];

function expectMultiGeometry(): string {
  return JSON.stringify({
    domains: [
      "data-domain-x-min",
      "data-domain-x-max",
      "data-domain-y-min",
      "data-domain-y-max",
    ].map((name) => screen.getByTestId("scatter-plot").getAttribute(name)),
    series: screen.getAllByTestId("scatter-series").map((group) => ({
      id: group.getAttribute("data-series-id"),
      name: group.getAttribute("data-series-name"),
      color: group.getAttribute("data-series-color"),
      shape: group.getAttribute("data-series-shape"),
      points: Array.from(
        group.querySelectorAll('[data-testid="scatter-point"]'),
      ).map((point) => ({
        tag: point.tagName,
        series: point.getAttribute("data-series-id"),
        x: point.getAttribute("data-x"),
        y: point.getAttribute("data-y"),
        cx: point.getAttribute("cx"),
        cy: point.getAttribute("cy"),
        rx: point.getAttribute("x"),
        ry: point.getAttribute("y"),
        vertices: point.getAttribute("points"),
        shape: point.getAttribute("data-shape"),
        fill: point.getAttribute("fill"),
      })),
    })),
    curve: screen.queryByTestId("fit-curve")?.getAttribute("points") ?? null,
    bars: screen
      .queryAllByTestId("error-bar")
      .map((bar) => bar.innerHTML),
  });
}

describe("ScatterPlot multi-series", () => {
  it("keeps the single main series as circle points and a complete legend", () => {
    render(
      <ScatterPlot pairs={multiMain} xColumn="time_s" yColumn="absorbance" />,
    );

    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-series-count",
      "1",
    );
    const groups = screen.getAllByTestId("scatter-series");
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveAttribute("data-series-id", "main");
    const points = screen.getAllByTestId("scatter-point");
    expect(points).toHaveLength(2);
    for (const point of points) {
      expect(point.tagName).toBe("circle");
      expect(point).toHaveAttribute("data-series-id", "main");
      expect(point).toHaveAttribute("fill", "#0e7490");
    }
    const legendItems = screen.getAllByTestId("series-legend-item");
    expect(legendItems).toHaveLength(1);
    expect(legendItems[0]).toHaveTextContent("absorbance");
    expect(legendItems[0]).toHaveTextContent("2 个数据点");
    expect(
      legendItems[0].querySelector('[data-testid="series-legend-marker"]'),
    ).toHaveAttribute("data-shape", "circle");
  });

  it("renders 2, 3 and 4 series with deterministic colors, shapes and legend counts", () => {
    const { rerender } = render(
      <ScatterPlot
        pairs={multiMain}
        extraSeries={multiSeries.slice(0, 1)}
        xColumn="time_s"
        yColumn="absorbance"
        yUnit="mV"
      />,
    );

    const counts = [2, 3, 4];
    const shapes = ["circle", "square", "triangle", "diamond"];
    const colors = ["#0e7490", "#6d5bd0", "#be123c", "#4d7c0f"];

    counts.forEach((count, index) => {
      if (index > 0) {
        rerender(
          <ScatterPlot
            pairs={multiMain}
            extraSeries={multiSeries.slice(0, count - 1)}
            xColumn="time_s"
            yColumn="absorbance"
            yUnit="mV"
          />,
        );
      }
      const plot = screen.getByTestId("scatter-plot");
      expect(plot).toHaveAttribute("data-series-count", String(count));
      const groups = screen.getAllByTestId("scatter-series");
      expect(groups).toHaveLength(count);
      const expectedIds = ["main", ...multiSeries.slice(0, count - 1).map((s) => s.id)];
      expect(groups.map((group) => group.getAttribute("data-series-id"))).toEqual(
        expectedIds,
      );
      groups.forEach((group, seriesIndex) => {
        expect(group).toHaveAttribute("data-series-color", colors[seriesIndex]);
        expect(group).toHaveAttribute("data-series-shape", shapes[seriesIndex]);
        const points = group.querySelectorAll('[data-testid="scatter-point"]');
        expect(points).toHaveLength(
          seriesIndex === 0 ? multiMain.length : multiSeries[seriesIndex - 1].pairs.length,
        );
        points.forEach((point) => {
          expect(point).toHaveAttribute("data-series-id", expectedIds[seriesIndex]);
          expect(point).toHaveAttribute("data-shape", shapes[seriesIndex]);
          expect(point).toHaveAttribute("fill", colors[seriesIndex]);
        });
      });

      const legendItems = screen.getAllByTestId("series-legend-item");
      expect(legendItems.map((item) => item.getAttribute("data-series-id"))).toEqual(
        expectedIds,
      );
      expect(
        legendItems.map((item) => item.getAttribute("data-point-count")),
      ).toEqual(
        expectedIds.map((id) =>
          id === "main"
            ? String(multiMain.length)
            : String(
                multiSeries.find((series) => series.id === id)?.pairs.length ?? 0,
              ),
        ),
      );
      legendItems.forEach((item, seriesIndex) => {
        const marker = item.querySelector(
          '[data-testid="series-legend-marker"]',
        );
        expect(marker).toHaveAttribute("data-shape", shapes[seriesIndex]);
        expect(marker).toHaveAttribute("data-color", colors[seriesIndex]);
        expect(item).toHaveTextContent(
          `${seriesIndex === 0 ? multiMain.length : multiSeries[seriesIndex - 1].pairs.length} 个数据点`,
        );
      });
    });
    expect(screen.getByTestId("scatter-summary")).toHaveTextContent(
      "4 个系列 · 6 个数据点",
    );
    expect(screen.getByTestId("scatter-plot")).toHaveAccessibleName(
      /4 个系列，6 个数据点，系列：absorbance、温度、压力、湿度/,
    );
    expect(screen.getByTestId("scatter-y-label")).toHaveTextContent("Y (mV)");
    expect(screen.getByTestId("scatter-x-label")).toHaveTextContent("time_s");
  });

  it("uses the union of all series for fixed shared X and Y domains", () => {
    const { rerender } = render(
      <ScatterPlot
        pairs={multiMain}
        extraSeries={multiSeries.slice(0, 1)}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-domain-x-min",
      "-0.5",
    );
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-domain-x-max",
      "10.5",
    );
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-domain-y-min",
      "-1.5",
    );
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-domain-y-max",
      "31.5",
    );

    rerender(
      <ScatterPlot
        pairs={multiMain}
        extraSeries={multiSeries.slice(0, 3)}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );
    const plot = screen.getByTestId("scatter-plot");
    expect(plot).toHaveAttribute("data-domain-x-min", "-1");
    expect(plot).toHaveAttribute("data-domain-x-max", "21");
    expect(plot).toHaveAttribute("data-domain-y-min", "-12.5");
    expect(plot).toHaveAttribute("data-domain-y-max", "42.5");

    const main = screen
      .getAllByTestId("scatter-series")
      .find((group) => group.getAttribute("data-series-id") === "main");
    const firstPoint = main?.querySelector('[data-testid="scatter-point"]');
    expect(Number(firstPoint?.getAttribute("cx"))).toBeCloseTo(100.36, 2);
    expect(Number(firstPoint?.getAttribute("cy"))).toBeCloseTo(234.18, 2);
  });

  it("keeps the main fit curve and error bars while including their Y extent in the shared domain", () => {
    const fit = weightedFit(multiMain, [1, 0]);
    render(
      <ScatterPlot
        pairs={multiMain}
        extraSeries={multiSeries.slice(0, 1)}
        xColumn="time_s"
        yColumn="absorbance"
        fit={fit}
      />,
    );

    const curve = screen.getByTestId("fit-curve");
    expect(curve).toHaveAttribute("data-point-count", "101");
    expect(curve).toHaveAttribute("data-degree", "1");
    expect(screen.getAllByTestId("error-bar")).toHaveLength(2);
    const plot = screen.getByTestId("scatter-plot");
    const yMin = Number(plot.getAttribute("data-domain-y-min"));
    const yMax = Number(plot.getAttribute("data-domain-y-max"));
    for (const sample of curveCoordinates(curve)) {
      expect(sample[1]).toBeGreaterThanOrEqual(0);
      expect(sample[1]).toBeLessThanOrEqual(360);
    }
    for (const bar of screen.getAllByTestId("error-bar")) {
      expect(Number(bar.getAttribute("data-y-low"))).toBeGreaterThanOrEqual(yMin);
      expect(Number(bar.getAttribute("data-y-high"))).toBeLessThanOrEqual(yMax);
    }
    expect(yMin).toBeLessThanOrEqual(-0.012);
    expect(yMax).toBeGreaterThanOrEqual(31.5);
    expect(screen.getAllByTestId("scatter-series")).toHaveLength(2);
  });

  it("does not change the main fit curve when added series stay inside the X domain", () => {
    const fit = weightedFit(multiMain, [1, 0]);
    const { rerender } = render(
      <ScatterPlot
        pairs={multiMain}
        xColumn="time_s"
        yColumn="absorbance"
        fit={fit}
      />,
    );
    const before = screen.getByTestId("fit-curve").getAttribute("points");
    rerender(
      <ScatterPlot
        pairs={multiMain}
        extraSeries={[
          { id: "extra-1", name: "内部", pairs: [{ x: 3, y: 5 }] },
        ]}
        xColumn="time_s"
        yColumn="absorbance"
        fit={fit}
      />,
    );
    expect(screen.getByTestId("fit-curve").getAttribute("points")).toBe(before);
  });

  it("keeps domains and all series geometry identical across tick densities and font scales", () => {
    const fit = weightedFit(multiMain, [1, 0]);
    const { rerender } = render(
      <ScatterPlot
        pairs={multiMain}
        extraSeries={multiSeries.slice(0, 3)}
        xColumn="time_s"
        yColumn="absorbance"
        fit={fit}
        title="多系列"
        showGrid
        tickDensity="sparse"
        fontScale="small"
      />,
    );
    const snapshot = expectMultiGeometry();
    const tickCounts = {
      x: screen.getAllByTestId("scatter-x-tick").length,
      y: screen.getAllByTestId("scatter-y-tick").length,
    };
    expect(tickCounts.x).toBeGreaterThanOrEqual(3);
    expect(tickCounts.x).toBeLessThanOrEqual(4);
    expect(tickCounts.y).toBeGreaterThanOrEqual(3);
    expect(tickCounts.y).toBeLessThanOrEqual(4);
    expect(screen.getAllByTestId("grid-line")).toHaveLength(
      tickCounts.x + tickCounts.y,
    );
    expect(screen.getByTestId("chart-title")).toHaveTextContent("多系列");

    for (const tickDensity of ["standard", "dense", "sparse"] as TickDensity[]) {
      for (const fontScale of ["medium", "large", "small"] as const) {
        rerender(
          <ScatterPlot
            pairs={multiMain}
            extraSeries={multiSeries.slice(0, 3)}
            xColumn="time_s"
            yColumn="absorbance"
            fit={fit}
            title="多系列"
            showGrid
            tickDensity={tickDensity}
            fontScale={fontScale}
          />,
        );
        expect(expectMultiGeometry()).toBe(snapshot);
        expect(screen.getByTestId("chart-title")).toHaveTextContent("多系列");
      }
    }
  });

  it("renders an empty added series in its group and legend without crashing", () => {
    render(
      <ScatterPlot
        pairs={multiMain}
        extraSeries={[{ id: "extra-empty", name: "空系列", pairs: [] }]}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );
    const groups = screen.getAllByTestId("scatter-series");
    expect(groups).toHaveLength(2);
    expect(groups[1]).toHaveAttribute("data-point-count", "0");
    const items = screen.getAllByTestId("series-legend-item");
    expect(items[1]).toHaveTextContent("空系列");
    expect(items[1]).toHaveTextContent("0 个数据点");
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-point-count",
      "2",
    );
    expect(screen.queryByTestId("scatter-empty")).not.toBeInTheDocument();
  });

  it("shows the existing empty state when every series has no finite points", () => {
    render(
      <ScatterPlot
        pairs={[]}
        extraSeries={[
          { id: "extra-1", name: "空一", pairs: [] },
          { id: "extra-2", name: "空二", pairs: [{ x: NaN, y: 1 }] },
        ]}
        xColumn="time_s"
        yColumn="absorbance"
      />,
    );
    expect(screen.getByTestId("scatter-empty")).toHaveTextContent(
      "暂无可绘制的数据点",
    );
    expect(screen.queryAllByTestId("scatter-series")).toHaveLength(0);
    expect(screen.getByTestId("scatter-summary")).toHaveTextContent(
      "3 个系列 · 0 个数据点",
    );
    expect(screen.getAllByTestId("series-legend-item")).toHaveLength(3);
    expect(screen.getAllByTestId("series-legend-item")[2]).toHaveTextContent(
      "0 个数据点",
    );
  });
});

describe("ScatterPlot export controls", () => {
  beforeEach(() => {
    downloadChartMock.mockReset();
  });

  it("enables both export buttons when data is present", () => {
    render(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        title="吸收曲线"
      />,
    );

    expect(screen.getByTestId("export-svg")).toBeEnabled();
    expect(screen.getByTestId("export-png")).toBeEnabled();
    expect(screen.queryByTestId("export-empty-hint")).not.toBeInTheDocument();
    expect(screen.getByTestId("export-status")).toBeEmptyDOMElement();
  });

  it("disables export and shows a Chinese hint when there are no points", () => {
    render(<ScatterPlot pairs={[]} xColumn="time_s" yColumn="absorbance" />);

    expect(screen.getByTestId("export-svg")).toBeDisabled();
    expect(screen.getByTestId("export-png")).toBeDisabled();
    expect(screen.getByTestId("export-empty-hint")).toHaveTextContent(
      "暂无可导出的数据",
    );
    expect(downloadChartMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("scatter-empty")).toBeInTheDocument();
  });

  it("exports the live SVG with the current columns and title in both formats", async () => {
    downloadChartMock.mockResolvedValue("labflow-吸收曲线.svg");
    render(
      <ScatterPlot
        pairs={pairs}
        xColumn="time_s"
        yColumn="absorbance"
        title="吸收曲线"
        showGrid
        tickDensity="dense"
        fontScale="large"
      />,
    );

    const plot = screen.getByTestId("scatter-plot");
    fireEvent.click(screen.getByTestId("export-svg"));

    await waitFor(() => {
      expect(downloadChartMock).toHaveBeenCalledTimes(1);
    });
    expect(downloadChartMock).toHaveBeenLastCalledWith({
      svg: plot,
      format: "svg",
      title: "吸收曲线",
      xColumn: "time_s",
      yColumn: "absorbance",
    });
    await waitFor(() => {
      expect(screen.getByTestId("export-status")).toHaveTextContent(
        "已导出 labflow-吸收曲线.svg",
      );
    });

    downloadChartMock.mockResolvedValue("labflow-吸收曲线.png");
    fireEvent.click(screen.getByTestId("export-png"));
    await waitFor(() => {
      expect(downloadChartMock).toHaveBeenCalledTimes(2);
    });
    expect(downloadChartMock).toHaveBeenLastCalledWith({
      svg: plot,
      format: "png",
      title: "吸收曲线",
      xColumn: "time_s",
      yColumn: "absorbance",
    });
    await waitFor(() => {
      expect(screen.getByTestId("export-status")).toHaveTextContent(
        "已导出 labflow-吸收曲线.png",
      );
    });

    expect(screen.getByTestId("chart-title")).toHaveTextContent("吸收曲线");
    expect(screen.getAllByTestId("grid-line").length).toBeGreaterThan(0);
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-point-count",
      String(pairs.length),
    );
  });

  it("shows a Chinese role=alert error without clearing the chart", async () => {
    downloadChartMock.mockRejectedValue(new Error("PNG 导出失败：浏览器拒绝"));
    render(
      <ScatterPlot pairs={pairs} xColumn="time_s" yColumn="absorbance" />,
    );

    fireEvent.click(screen.getByTestId("export-png"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "PNG 导出失败：浏览器拒绝",
      );
    });
    expect(screen.getByTestId("scatter-plot")).toBeInTheDocument();
    expect(screen.getAllByTestId("scatter-point")).toHaveLength(pairs.length);
    expect(screen.getByTestId("export-png")).toBeEnabled();
    expect(screen.getByTestId("export-svg")).toBeEnabled();

    downloadChartMock.mockResolvedValue("labflow-retry.png");
    fireEvent.click(screen.getByTestId("export-png"));
    await waitFor(() => {
      expect(screen.getByTestId("export-status")).toHaveTextContent(
        "已导出 labflow-retry.png",
      );
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables both buttons, shows the progress text, and ignores concurrent clicks", async () => {
    let resolveExport: (fileName: string) => void = () => {};
    downloadChartMock.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveExport = resolve;
      }),
    );
    render(
      <ScatterPlot pairs={pairs} xColumn="time_s" yColumn="absorbance" />,
    );

    fireEvent.click(screen.getByTestId("export-svg"));

    expect(downloadChartMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("export-svg")).toBeDisabled();
    expect(screen.getByTestId("export-png")).toBeDisabled();
    expect(screen.getByTestId("export-svg")).toHaveTextContent("正在导出…");
    expect(screen.getByTestId("export-status")).toHaveTextContent("正在导出…");

    fireEvent.click(screen.getByTestId("export-png"));
    fireEvent.click(screen.getByTestId("export-svg"));
    expect(downloadChartMock).toHaveBeenCalledTimes(1);

    resolveExport("labflow-done.svg");
    await waitFor(() => {
      expect(screen.getByTestId("export-status")).toHaveTextContent(
        "已导出 labflow-done.svg",
      );
    });
    expect(screen.getByTestId("export-svg")).toBeEnabled();
    expect(screen.getByTestId("export-png")).toBeEnabled();
    expect(screen.getByTestId("export-svg")).toHaveTextContent("导出 SVG");
  });
});
