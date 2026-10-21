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
        fit={createFit()}
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
});
