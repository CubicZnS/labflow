import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FitResponse } from "../lib/api";
import { ScatterPlot } from "./ScatterPlot";

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
