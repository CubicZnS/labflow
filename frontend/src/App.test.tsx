import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { CsvImportResponse, FitResponse, SeriesResponse } from "./lib/api";

const healthPayload = { status: "ok", service: "labflow-api", version: "0.1.0" };

const csvPayload: CsvImportResponse = {
  row_count: 3,
  columns: ["time_s", "absorbance", "notes"],
  numeric_columns: ["time_s", "absorbance"],
  column_stats: {
    time_s: { n: 3, missing: 0, mean: 5, std: 5, sem: 2.886751345948129 },
    absorbance: {
      n: 2,
      missing: 1,
      mean: 0.1265,
      std: 0.1619271450638394,
      sem: 0.1144876738714033,
    },
  },
  preview: [
    { time_s: 0, absorbance: 0.012, notes: "基线" },
    { time_s: 5, absorbance: null, notes: null },
    { time_s: 10, absorbance: 0.241, notes: "复测" },
  ],
  warnings: ["Column 'absorbance' has 1 missing value(s)"],
};

const seriesPayload: SeriesResponse = {
  x_column: "time_s",
  y_column: "absorbance",
  x_unit: "s",
  y_unit: "mV",
  row_count: 3,
  pair_count: 2,
  skipped_count: 1,
  pairs: [
    { x: 0, y: 0.012 },
    { x: 10, y: 0.241 },
  ],
  x_stats: { n: 2, missing: 0, mean: 5, std: 7.0710678118654755, sem: 5 },
  y_stats: { n: 2, missing: 0, mean: 0.1265, std: 0.1619, sem: 0.1145 },
  warnings: [
    "Column 'absorbance' has 1 missing value(s)",
    "Pairing skipped 1 row(s) with missing, non-numeric, or non-finite values",
  ],
};

const fitPayload: FitResponse = {
  x_column: "time_s",
  y_column: "absorbance",
  x_unit: "s",
  y_unit: "mV",
  row_count: 3,
  pair_count: 2,
  skipped_count: 1,
  degree: 1,
  coefficients: [0.0229, 0.012],
  equation: "y = 0.0229x + 0.012",
  r_squared: 1,
  pairs: [
    { x: 0, y: 0.012 },
    { x: 10, y: 0.241 },
  ],
  fitted: [0.012, 0.241],
  residuals: [0, 0],
  rmse: 0,
  max_abs_residual: 0,
  warnings: [
    "Column 'absorbance' has 1 missing value(s)",
    "Pairing skipped 1 row(s) with missing, non-numeric, or non-finite values",
  ],
  uncertainty: {
    residual_dof: 0,
    standard_errors: null,
    confidence_intervals: null,
    condition_number: 5.196152,
    ill_conditioned: false,
  },
  weighted: false,
  y_error_column: null,
  y_error_unit: null,
  y_errors: null,
  chi_squared: null,
  reduced_chi_squared: null,
};

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

function installFetchMock(
  upload?: (url: string) => Response | Promise<Response>,
  series?: () => Response | Promise<Response>,
  fit?: () => Response | Promise<Response>,
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/health") {
      return jsonResponse(healthPayload);
    }
    if (url === "/api/datasets/series" && series) {
      return series();
    }
    if (url === "/api/datasets/fit" && fit) {
      return fit();
    }
    if ((url === "/api/datasets/csv" || url === "/api/datasets/xlsx") && upload) {
      return upload(url);
    }
    throw new Error("Unexpected request: " + url);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function fileTypeFor(name: string): string {
  if (name.toLowerCase().endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (name.toLowerCase().endsWith(".csv")) {
    return "text/csv";
  }
  return "text/plain";
}

function chooseFile(name = "experiment.csv") {
  const file = new File(["time_s,absorbance\n0,0.012\n"], name, {
    type: fileTypeFor(name),
  });
  fireEvent.change(screen.getByLabelText("选择 CSV 或 XLSX 文件"), {
    target: { files: [file] },
  });
  return file;
}

function startUpload() {
  fireEvent.click(screen.getByRole("button", { name: "上传并解析" }));
}

describe("App", () => {
  beforeEach(() => {
    installFetchMock();
  });

  async function generateSeries() {
    chooseFile();
    startUpload();
    await screen.findByTestId("series-section");
    fireEvent.click(screen.getByRole("button", { name: "生成配对数据" }));
    await screen.findByTestId("fit-section");
  }

  it("renders the product shell", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /从原始实验数据/ })).toBeInTheDocument();
    expect(screen.getByText("LabFlow")).toBeInTheDocument();
    expect(await screen.findByText(/API 已连接/)).toBeInTheDocument();
  });

  it("shows the API connection state", async () => {
    render(<App />);
    expect(await screen.findByText(/API 已连接/)).toBeInTheDocument();
  });

  it("uploads a CSV and renders the parsed preview", async () => {
    const fetchMock = installFetchMock(() => jsonResponse(csvPayload));
    render(<App />);

    const file = chooseFile();
    expect(screen.getByTestId("selected-file")).toHaveTextContent("experiment.csv");

    startUpload();

    expect(await screen.findByTestId("preview-table")).toBeInTheDocument();
    expect(screen.getByTestId("row-count")).toHaveTextContent("3");
    expect(screen.getByTestId("numeric-columns")).toHaveTextContent("time_s、absorbance");
    expect(screen.getByTestId("warnings")).toHaveTextContent(
      "Column 'absorbance' has 1 missing value(s)",
    );
    expect(screen.getByRole("columnheader", { name: "absorbance" })).toBeInTheDocument();
    const missingCells = screen.getAllByLabelText("缺失值");
    expect(missingCells).toHaveLength(2);
    expect(missingCells[0]).toHaveTextContent("—");

    const uploadCall = fetchMock.mock.calls.find(
      ([input]) => String(input) === "/api/datasets/csv",
    );
    expect(uploadCall).toBeDefined();
    expect(uploadCall?.[1]?.method).toBe("POST");
    expect(uploadCall?.[1]?.body).toBeInstanceOf(FormData);
    expect((uploadCall?.[1]?.body as FormData).get("file")).toBe(file);
  });

  it("routes an xlsx file to the xlsx endpoint and renders the same result shape", async () => {
    const fetchMock = installFetchMock((url) =>
      jsonResponse(url === "/api/datasets/xlsx" ? csvPayload : { detail: "wrong endpoint" }),
    );
    render(<App />);

    const file = chooseFile("experiment.xlsx");
    startUpload();

    expect(await screen.findByText("XLSX 已解析")).toBeInTheDocument();
    expect(screen.getByTestId("row-count")).toHaveTextContent("3");
    expect(screen.getByTestId("numeric-columns")).toHaveTextContent("time_s、absorbance");
    expect(screen.getByTestId("stats-n")).toHaveTextContent("3");
    expect(screen.getByTestId("preview-table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "absorbance" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("缺失值")).toHaveLength(2);

    const datasetCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).startsWith("/api/datasets/"),
    );
    expect(datasetCalls).toHaveLength(1);
    expect(String(datasetCalls[0][0])).toBe("/api/datasets/xlsx");
    expect(datasetCalls[0][1]?.method).toBe("POST");
    expect((datasetCalls[0][1]?.body as FormData).get("file")).toBe(file);
  });

  it("rejects an unsupported extension before making a request", async () => {
    const fetchMock = installFetchMock(() => jsonResponse(csvPayload));
    render(<App />);

    chooseFile("experiment.txt");
    startUpload();

    expect(await screen.findByTestId("upload-error")).toHaveTextContent(
      "不支持的文件格式，请选择 .csv 或 .xlsx 文件。",
    );
    expect(
      fetchMock.mock.calls.filter(([input]) => String(input).startsWith("/api/datasets/")),
    ).toHaveLength(0);
  });

  it("renders statistics for the default numeric column and updates on selection", async () => {
    installFetchMock(() => jsonResponse(csvPayload));
    render(<App />);

    chooseFile();
    startUpload();

    expect(await screen.findByTestId("stats-n")).toHaveTextContent("3");
    expect(screen.getByTestId("stats-mean")).toHaveTextContent("5");
    expect(screen.getByTestId("stats-std")).toHaveTextContent("5");
    expect(screen.getByTestId("stats-sem")).toHaveTextContent("2.887");
    expect(screen.getByTestId("stats-missing")).toHaveTextContent("未排除缺失值或非有限值");

    const select = screen.getByTestId("stats-column-select");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["time_s", "absorbance"]);

    fireEvent.change(select, { target: { value: "absorbance" } });

    expect(screen.getByTestId("stats-n")).toHaveTextContent("2");
    expect(screen.getByTestId("stats-mean")).toHaveTextContent("0.1265");
    expect(screen.getByTestId("stats-std")).toHaveTextContent("0.1619");
    expect(screen.getByTestId("stats-sem")).toHaveTextContent("0.1145");
    expect(screen.getByTestId("stats-missing")).toHaveTextContent("已排除 1 个缺失值或非有限值");
  });

  it("shows an empty statistics state when there are no numeric columns", async () => {
    installFetchMock(() =>
      jsonResponse({ ...csvPayload, numeric_columns: [], column_stats: {} }),
    );
    render(<App />);

    chooseFile();
    startUpload();

    expect(await screen.findByTestId("stats-empty")).toHaveTextContent(
      "未识别到数值列，无法计算描述统计",
    );
    expect(screen.queryByTestId("stats-column-select")).not.toBeInTheDocument();
  });

  it("explains when a numeric column has too few finite values", async () => {
    installFetchMock(() =>
      jsonResponse({
        ...csvPayload,
        numeric_columns: ["sparse", "time_s"],
        column_stats: { time_s: csvPayload.column_stats.time_s },
      }),
    );
    render(<App />);

    chooseFile();
    startUpload();

    expect(await screen.findByTestId("stats-unavailable")).toHaveTextContent(
      "有效数值不足 2 个",
    );
    expect(screen.getByTestId("stats-omitted")).toHaveTextContent("sparse");

    fireEvent.change(screen.getByTestId("stats-column-select"), {
      target: { value: "time_s" },
    });

    expect(screen.getByTestId("stats-n")).toHaveTextContent("3");
    expect(screen.getByTestId("stats-omitted")).toHaveTextContent("sparse");
  });

  it("shows an explicit no-warning state when parsing succeeds cleanly", async () => {
    installFetchMock(() => jsonResponse({ ...csvPayload, warnings: [] }));
    render(<App />);

    chooseFile();
    startUpload();

    expect(await screen.findByTestId("no-warnings")).toHaveTextContent("无警告");
    expect(screen.queryByTestId("warnings")).not.toBeInTheDocument();
  });

  it("renders the API error detail when an upload fails", async () => {
    installFetchMock(() =>
      jsonResponse(
        { detail: "Malformed CSV: row 2 has 2 field(s) but the header has 3" },
        422,
      ),
    );
    render(<App />);

    chooseFile("broken.csv");
    startUpload();

    expect(await screen.findByRole("alert")).toHaveTextContent("上传失败");
    expect(screen.getByTestId("upload-error")).toHaveTextContent(
      "Malformed CSV: row 2 has 2 field(s) but the header has 3",
    );
    expect(screen.queryByTestId("preview-table")).not.toBeInTheDocument();
  });

  it("falls back to a generic message when the error response is not JSON", async () => {
    installFetchMock(() => {
      return {
        ok: false,
        status: 502,
        json: async () => {
          throw new Error("not json");
        },
      } as unknown as Response;
    });
    render(<App />);

    chooseFile("broken.csv");
    startUpload();

    expect(await screen.findByTestId("upload-error")).toHaveTextContent(
      "CSV 上传失败（HTTP 502），请检查文件后重试。",
    );
  });

  it("renders the X/Y pairing section with defaults after a successful import", async () => {
    installFetchMock(() => jsonResponse(csvPayload));
    render(<App />);

    chooseFile();
    startUpload();

    expect(await screen.findByTestId("series-section")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "X/Y 配对与单位" }),
    ).toBeInTheDocument();

    const xSelect = screen.getByTestId("series-x-select") as HTMLSelectElement;
    const ySelect = screen.getByTestId("series-y-select") as HTMLSelectElement;
    expect(xSelect.value).toBe("time_s");
    expect(ySelect.value).toBe("absorbance");
    expect(
      within(xSelect)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["time_s", "absorbance"]);
    expect(screen.getByTestId("series-x-unit")).toHaveValue("");
    expect(screen.getByTestId("series-y-unit")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "生成配对数据" }),
    ).toBeEnabled();
    expect(screen.queryByTestId("series-insufficient")).not.toBeInTheDocument();
  });

  it("posts the selected columns, units, and file and renders the paired result", async () => {
    const fetchMock = installFetchMock(
      () => jsonResponse(csvPayload),
      () =>
        jsonResponse({
          ...seriesPayload,
          pairs: Array.from({ length: 12 }, (_, index) => ({
            x: index,
            y: index * 2,
          })),
        }),
    );
    render(<App />);

    chooseFile();
    startUpload();
    await screen.findByTestId("series-section");

    fireEvent.change(screen.getByTestId("series-x-unit"), {
      target: { value: " s " },
    });
    fireEvent.change(screen.getByTestId("series-y-unit"), {
      target: { value: "mV" },
    });
    fireEvent.click(screen.getByRole("button", { name: "生成配对数据" }));

    expect(await screen.findByTestId("series-pair-count")).toHaveTextContent("2");
    expect(screen.getByTestId("series-skipped-count")).toHaveTextContent("1");
    expect(screen.getByTestId("series-units")).toHaveTextContent("X 单位：s");
    expect(screen.getByTestId("series-units")).toHaveTextContent("Y 单位：mV");
    expect(
      screen.getByRole("columnheader", { name: "X (s)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Y (mV)" }),
    ).toBeInTheDocument();

    const table = screen.getByTestId("series-preview-table");
    expect(within(table).getAllByRole("row")).toHaveLength(11);

    const seriesCall = fetchMock.mock.calls.find(
      ([input]) => String(input) === "/api/datasets/series",
    );
    expect(seriesCall).toBeDefined();
    expect(seriesCall?.[1]?.method).toBe("POST");
    const body = seriesCall?.[1]?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("format")).toBe("csv");
    expect(body.get("x_column")).toBe("time_s");
    expect(body.get("y_column")).toBe("absorbance");
    expect(body.get("x_unit")).toBe("s");
    expect(body.get("y_unit")).toBe("mV");
    expect(body.get("file")).toBeInstanceOf(File);
  });

  it("shows the server detail when pairing fails", async () => {
    installFetchMock(
      () => jsonResponse(csvPayload),
      () =>
        jsonResponse({ detail: "At least two valid X/Y pairs are required" }, 422),
    );
    render(<App />);

    chooseFile();
    startUpload();
    await screen.findByTestId("series-section");

    fireEvent.click(screen.getByRole("button", { name: "生成配对数据" }));

    expect(await screen.findByTestId("series-error")).toHaveTextContent(
      "At least two valid X/Y pairs are required",
    );
    expect(screen.queryByTestId("series-preview-table")).not.toBeInTheDocument();
  });

  it("guides the user when fewer than two numeric columns are available", async () => {
    const fetchMock = installFetchMock(
      () =>
        jsonResponse({
          ...csvPayload,
          numeric_columns: ["time_s"],
          column_stats: { time_s: csvPayload.column_stats.time_s },
        }),
      () => jsonResponse(seriesPayload),
    );
    render(<App />);

    chooseFile();
    startUpload();

    expect(await screen.findByTestId("series-insufficient")).toHaveTextContent(
      "至少需要两个数值列",
    );
    const button = screen.getByRole("button", { name: "生成配对数据" });
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(
      fetchMock.mock.calls.filter(
        ([input]) => String(input) === "/api/datasets/series",
      ),
    ).toHaveLength(0);
  });

  it("shows the fit section with degree 1 after a successful series", async () => {
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
    );
    render(<App />);

    await generateSeries();

    const select = screen.getByTestId("fit-degree-select") as HTMLSelectElement;
    expect(select.value).toBe("1");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["线性（1 次）", "二次（2 次）", "三次（3 次）"]);
    expect(screen.getByRole("button", { name: "运行拟合" })).toBeEnabled();
    expect(screen.queryByTestId("fit-result")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fit-curve")).not.toBeInTheDocument();
  });

  it("overlays the fit curve on the scatter plot after a successful fit", async () => {
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () => jsonResponse(fitPayload),
    );
    render(<App />);

    await generateSeries();
    expect(screen.queryByTestId("fit-curve")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));
    await screen.findByTestId("fit-result");

    expect(screen.getByTestId("fit-curve")).toHaveAttribute(
      "data-point-count",
      "101",
    );
    expect(screen.getByTestId("fit-curve")).toHaveAttribute("data-degree", "1");
    expect(screen.getByTestId("scatter-fit-legend")).toHaveTextContent(
      "实线为拟合曲线",
    );
    expect(screen.queryAllByTestId("error-bar")).toHaveLength(0);
  });

  it("overlays Y error bars for a weighted fit", async () => {
    const weightedFitPayload: FitResponse = {
      ...fitPayload,
      weighted: true,
      y_error_column: "absorbance_err",
      y_error_unit: "mV",
      y_errors: [0.01, 0.02],
    };
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () => jsonResponse(weightedFitPayload),
    );
    render(<App />);

    await generateSeries();
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));
    await screen.findByTestId("fit-result");

    expect(screen.getByTestId("fit-curve")).toBeInTheDocument();
    const bars = screen.getAllByTestId("error-bar");
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute("data-y-low", String(0.012 - 0.01));
    expect(bars[0]).toHaveAttribute("data-y-high", String(0.012 + 0.01));
    expect(screen.getByTestId("scatter-error-legend")).toHaveTextContent(
      "竖线为 Y 误差棒（±σ）",
    );
  });

  it("clears the previous curve while a new fit is pending", async () => {
    let fitCalls = 0;
    let resolveSecondFit: ((response: Response) => void) | undefined;
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () => {
        fitCalls += 1;
        if (fitCalls === 1) {
          return jsonResponse(fitPayload);
        }
        return new Promise<Response>((resolve) => {
          resolveSecondFit = resolve;
        });
      },
    );
    render(<App />);

    await generateSeries();
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));
    await screen.findByTestId("fit-result");
    expect(screen.getByTestId("fit-curve")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));
    expect(screen.getByRole("button", { name: "正在拟合…" })).toBeDisabled();
    expect(screen.queryByTestId("fit-curve")).not.toBeInTheDocument();

    resolveSecondFit?.(jsonResponse(fitPayload));
    expect(await screen.findByTestId("fit-curve")).toBeInTheDocument();
  });

  it("posts the fit FormData and renders equation, R², residuals, and preview", async () => {
    const longPairs = Array.from({ length: 12 }, (_, index) => ({
      x: index,
      y: index * 2,
    }));
    const longFit: FitResponse = {
      ...fitPayload,
      pair_count: 12,
      pairs: longPairs,
      fitted: longPairs.map((pair) => pair.y),
      residuals: longPairs.map(() => 0),
    };
    const fetchMock = installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () => jsonResponse(longFit),
    );
    render(<App />);

    await generateSeries();
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));

    expect(await screen.findByTestId("fit-equation")).toHaveTextContent(
      "y = 0.0229x + 0.012",
    );
    expect(screen.getByTestId("fit-r2")).toHaveTextContent("1.0000");
    expect(screen.getByTestId("fit-rmse")).toHaveTextContent("0");
    expect(screen.getByTestId("fit-max-residual")).toHaveTextContent("0");
    expect(screen.getByTestId("fit-coefficients")).toHaveTextContent(
      "0.0229、0.012",
    );

    const table = screen.getByTestId("fit-preview-table");
    expect(within(table).getAllByRole("row")).toHaveLength(11);
    expect(screen.getByTestId("fit-preview-caption")).toHaveTextContent(
      "仅显示前 10 行",
    );
    expect(
      within(table).getByRole("columnheader", { name: "X (s)" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Y (mV)" }),
    ).toBeInTheDocument();

    const fitCall = fetchMock.mock.calls.find(
      ([input]) => String(input) === "/api/datasets/fit",
    );
    expect(fitCall).toBeDefined();
    expect(fitCall?.[1]?.method).toBe("POST");
    const body = fitCall?.[1]?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBeInstanceOf(File);
    expect(body.get("format")).toBe("csv");
    expect(body.get("x_column")).toBe("time_s");
    expect(body.get("y_column")).toBe("absorbance");
    expect(body.get("x_unit")).toBe("s");
    expect(body.get("y_unit")).toBe("mV");
    expect(body.get("degree")).toBe("1");
  });

  it.each([2, 3])("sends the selected degree %i to the fit endpoint", async (degree) => {
    const fetchMock = installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () => jsonResponse({ ...fitPayload, degree }),
    );
    render(<App />);

    await generateSeries();
    fireEvent.change(screen.getByTestId("fit-degree-select"), {
      target: { value: String(degree) },
    });
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));

    await screen.findByTestId("fit-result");

    const fitCalls = fetchMock.mock.calls.filter(
      ([input]) => String(input) === "/api/datasets/fit",
    );
    expect(fitCalls).toHaveLength(1);
    const body = fitCalls[0][1]?.body as FormData;
    expect(body.get("degree")).toBe(String(degree));
  });

  it("shows the server detail when the fit fails and hides any result", async () => {
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () =>
        jsonResponse(
          { detail: "degree 3 requires more than 3 valid X/Y pairs; got 3" },
          422,
        ),
    );
    render(<App />);

    await generateSeries();
    fireEvent.change(screen.getByTestId("fit-degree-select"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));

    expect(await screen.findByTestId("fit-error")).toHaveTextContent(
      "degree 3 requires more than 3 valid X/Y pairs; got 3",
    );
    expect(screen.queryByTestId("fit-result")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fit-preview-table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fit-curve")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("error-bar")).toHaveLength(0);
  });

  it("disables the run button while a fit request is pending", async () => {
    let resolveFit: ((response: Response) => void) | undefined;
    const pendingFit = new Promise<Response>((resolve) => {
      resolveFit = resolve;
    });
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () => pendingFit,
    );
    render(<App />);

    await generateSeries();
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));

    const button = screen.getByRole("button", { name: "正在拟合…" });
    expect(button).toBeDisabled();

    resolveFit?.(jsonResponse(fitPayload));
    expect(await screen.findByTestId("fit-result")).toBeInTheDocument();
  });

  it("clears the previous fit result when a new series is generated", async () => {
    const weightedFitPayload: FitResponse = {
      ...fitPayload,
      weighted: true,
      y_error_column: "absorbance_err",
      y_error_unit: "mV",
      y_errors: [0.01, 0.02],
    };
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () => jsonResponse(weightedFitPayload),
    );
    render(<App />);

    await generateSeries();
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));
    await screen.findByTestId("fit-result");
    expect(screen.getByTestId("fit-curve")).toBeInTheDocument();
    expect(screen.getAllByTestId("error-bar")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "生成配对数据" }));
    await screen.findByTestId("series-pair-count");

    expect(screen.getByTestId("fit-section")).toBeInTheDocument();
    expect(screen.queryByTestId("fit-result")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fit-curve")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("error-bar")).toHaveLength(0);
  });

  it("ignores a stale fit response from a previous series", async () => {
    const staleFitPayload: FitResponse = {
      ...fitPayload,
      weighted: true,
      y_error_column: "absorbance_err",
      y_error_unit: "mV",
      y_errors: [0.01, 0.02],
    };
    const secondSeries: SeriesResponse = {
      ...seriesPayload,
      pair_count: 2,
      skipped_count: 1,
      pairs: [
        { x: 100, y: 0.5 },
        { x: 200, y: 0.9 },
      ],
    };
    let seriesCalls = 0;
    let fitCalls = 0;
    let resolveStaleFit: ((response: Response) => void) | undefined;
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => {
        seriesCalls += 1;
        return jsonResponse(seriesCalls === 1 ? seriesPayload : secondSeries);
      },
      () => {
        fitCalls += 1;
        if (fitCalls === 1) {
          return new Promise<Response>((resolve) => {
            resolveStaleFit = resolve;
          });
        }
        return jsonResponse(fitPayload);
      },
    );
    render(<App />);

    await generateSeries();
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));
    expect(screen.getByRole("button", { name: "正在拟合…" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "生成配对数据" }));
    await waitFor(() =>
      expect(screen.getAllByTestId("scatter-point")[0]).toHaveAttribute(
        "data-x",
        "100",
      ),
    );
    expect(screen.queryByTestId("fit-curve")).not.toBeInTheDocument();

    await act(async () => {
      resolveStaleFit?.(jsonResponse(staleFitPayload));
    });

    expect(screen.queryByTestId("fit-result")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fit-curve")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("error-bar")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));
    expect(await screen.findByTestId("fit-result")).toBeInTheDocument();
    expect(screen.getByTestId("fit-curve")).toBeInTheDocument();
    expect(screen.getByTestId("fit-curve")).toHaveAttribute("data-degree", "1");
    expect(screen.queryAllByTestId("error-bar")).toHaveLength(0);
  });

  it("renders coefficient standard errors, confidence intervals, and residual dof", async () => {
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () =>
        jsonResponse({
          ...fitPayload,
          uncertainty: {
            residual_dof: 8,
            standard_errors: [0.00123456, 0.0234567],
            confidence_intervals: [
              { low: 0.0208123, high: 0.0249876 },
              { low: -0.0432109, high: 0.0671234 },
            ],
            condition_number: 2.5,
            ill_conditioned: false,
          },
        }),
    );
    render(<App />);

    await generateSeries();
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));

    const table = await screen.findByTestId("fit-uncertainty-table");
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(
      within(table).getByRole("columnheader", { name: "标准误" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("fit-uncertainty-se-0")).not.toHaveTextContent("—");
    expect(screen.getByTestId("fit-uncertainty-ci-low-1")).not.toHaveTextContent(
      "—",
    );
    expect(screen.getByTestId("fit-uncertainty-ci-high-1")).not.toHaveTextContent(
      "—",
    );
    expect(screen.getByTestId("fit-residual-dof")).toHaveTextContent("8");
    expect(screen.getByTestId("fit-condition-number")).toHaveTextContent("2.5");
    expect(
      screen.queryByTestId("fit-conditioning-warning"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("fit-uncertainty-note")).not.toBeInTheDocument();
  });

  it("warns when the fit design matrix is ill-conditioned", async () => {
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () =>
        jsonResponse({
          ...fitPayload,
          uncertainty: {
            residual_dof: 2,
            standard_errors: [1.5, 0.5],
            confidence_intervals: [
              { low: 0.5, high: 3.5 },
              { low: -0.5, high: 1.5 },
            ],
            condition_number: 1e13,
            ill_conditioned: true,
          },
        }),
    );
    render(<App />);

    await generateSeries();
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));

    expect(await screen.findByTestId("fit-conditioning-warning")).toHaveTextContent(
      "设计矩阵病态，系数估计可能不稳定。",
    );
    expect(screen.getByTestId("fit-uncertainty-table")).toBeInTheDocument();
    expect(screen.queryByTestId("fit-uncertainty-note")).not.toBeInTheDocument();
  });

  it("shows the uncertainty note and em dashes for an exactly determined fit", async () => {
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () => jsonResponse(fitPayload),
    );
    render(<App />);

    await generateSeries();
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));

    expect(await screen.findByTestId("fit-uncertainty-note")).toHaveTextContent(
      "有效数据点恰好等于参数个数，无法估计系数不确定度。",
    );
    expect(screen.getByTestId("fit-uncertainty-se-0")).toHaveTextContent("—");
    expect(screen.getByTestId("fit-uncertainty-ci-low-0")).toHaveTextContent("—");
    expect(screen.getByTestId("fit-uncertainty-ci-high-0")).toHaveTextContent("—");
    expect(screen.getByTestId("fit-residual-dof")).toHaveTextContent("0");
    expect(screen.queryByTestId("fit-conditioning-warning")).not.toBeInTheDocument();
  });

  it("lists only non-axis numeric columns as Y error options and defaults to equal weighting", async () => {
    const csvWithError: CsvImportResponse = {
      ...csvPayload,
      numeric_columns: ["time_s", "absorbance", "err"],
    };
    installFetchMock(
      () => jsonResponse(csvWithError),
      () => jsonResponse(seriesPayload),
    );
    render(<App />);

    await generateSeries();

    const select = screen.getByTestId("fit-error-select") as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["不使用（等权拟合）", "err"]);
    expect(screen.queryByTestId("fit-error-unit-input")).not.toBeInTheDocument();
  });

  it("sends the selected Y error column and unit with the fit request", async () => {
    const csvWithError: CsvImportResponse = {
      ...csvPayload,
      numeric_columns: ["time_s", "absorbance", "err"],
    };
    const weightedFit: FitResponse = {
      ...fitPayload,
      weighted: true,
      y_error_column: "err",
      y_error_unit: "mV",
      y_errors: [0.1, 0.2],
      chi_squared: 1.5,
      reduced_chi_squared: 0.75,
    };
    const fetchMock = installFetchMock(
      () => jsonResponse(csvWithError),
      () => jsonResponse(seriesPayload),
      () => jsonResponse(weightedFit),
    );
    render(<App />);

    await generateSeries();
    fireEvent.change(screen.getByTestId("fit-error-select"), {
      target: { value: "err" },
    });
    fireEvent.change(screen.getByTestId("fit-error-unit-input"), {
      target: { value: "mV" },
    });
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));

    await screen.findByTestId("fit-result");
    const fitCall = fetchMock.mock.calls.find(
      ([input]) => String(input) === "/api/datasets/fit",
    );
    const body = fitCall?.[1]?.body as FormData;
    expect(body.get("y_error_column")).toBe("err");
    expect(body.get("y_error_unit")).toBe("mV");
  });

  it("renders weighted diagnostics and the preview Y error column", async () => {
    const csvWithError: CsvImportResponse = {
      ...csvPayload,
      numeric_columns: ["time_s", "absorbance", "err"],
    };
    const weightedFit: FitResponse = {
      ...fitPayload,
      weighted: true,
      y_error_column: "err",
      y_error_unit: "mV",
      y_errors: [0.1, 0.2],
      chi_squared: 1.5,
      reduced_chi_squared: 0.75,
    };
    installFetchMock(
      () => jsonResponse(csvWithError),
      () => jsonResponse(seriesPayload),
      () => jsonResponse(weightedFit),
    );
    render(<App />);

    await generateSeries();
    fireEvent.change(screen.getByTestId("fit-error-select"), {
      target: { value: "err" },
    });
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));

    expect(await screen.findByTestId("fit-weighted-badge")).toHaveTextContent(
      "加权拟合（使用 Y 误差列）",
    );
    expect(screen.getByTestId("fit-error-column")).toHaveTextContent("err");
    expect(screen.getByTestId("fit-error-unit")).toHaveTextContent("mV");
    expect(screen.getByTestId("fit-chi-squared")).toHaveTextContent("1.5");
    expect(screen.getByTestId("fit-reduced-chi2")).toHaveTextContent("0.75");

    const table = screen.getByTestId("fit-preview-table");
    expect(
      within(table).getByRole("columnheader", { name: "Y 误差" }),
    ).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).getByText("0.1")).toBeInTheDocument();
    expect(within(table).getByText("0.2")).toBeInTheDocument();
  });

  it("does not fabricate weighted values for an equal-weight fit", async () => {
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
      () => jsonResponse(fitPayload),
    );
    render(<App />);

    await generateSeries();
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));

    expect(await screen.findByTestId("fit-weighted-badge")).toHaveTextContent(
      "等权拟合（未使用 Y 误差列）",
    );
    expect(screen.getByTestId("fit-error-column")).toHaveTextContent("未使用");
    expect(screen.getByTestId("fit-error-unit")).toHaveTextContent("未标注");
    expect(screen.getByTestId("fit-chi-squared")).toHaveTextContent("—");
    expect(screen.getByTestId("fit-reduced-chi2")).toHaveTextContent("—");
    expect(
      within(screen.getByTestId("fit-preview-table")).queryByRole("columnheader", {
        name: "Y 误差",
      }),
    ).not.toBeInTheDocument();
  });

  it("resets the selected Y error column when a new series is generated", async () => {
    const csvWithError: CsvImportResponse = {
      ...csvPayload,
      numeric_columns: ["time_s", "absorbance", "err"],
    };
    installFetchMock(
      () => jsonResponse(csvWithError),
      () => jsonResponse(seriesPayload),
      () => jsonResponse(fitPayload),
    );
    render(<App />);

    await generateSeries();
    fireEvent.change(screen.getByTestId("fit-error-select"), {
      target: { value: "err" },
    });
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));
    await screen.findByTestId("fit-result");

    fireEvent.click(screen.getByRole("button", { name: "生成配对数据" }));
    await screen.findByTestId("series-pair-count");

    const select = screen.getByTestId("fit-error-select") as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(screen.queryByTestId("fit-result")).not.toBeInTheDocument();
  });

  it("renders the scatter plot with the selected columns and units after a successful series", async () => {
    installFetchMock(
      () => jsonResponse(csvPayload),
      () => jsonResponse(seriesPayload),
    );
    render(<App />);

    await generateSeries();

    const plot = screen.getByTestId("scatter-plot");
    expect(plot).toHaveAttribute("data-point-count", String(seriesPayload.pair_count));
    expect(screen.getAllByTestId("scatter-point")).toHaveLength(
      seriesPayload.pair_count,
    );
    expect(screen.getByTestId("scatter-x-label")).toHaveTextContent("time_s (s)");
    expect(screen.getByTestId("scatter-y-label")).toHaveTextContent(
      "absorbance (mV)",
    );
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute("role", "img");
    expect(screen.getByTestId("scatter-plot")).toHaveAccessibleName(
      /散点图.*2 个数据点/,
    );
  });

  it("updates the plotted points when a new series is generated instead of keeping stale data", async () => {
    const csvWithThreeColumns: CsvImportResponse = {
      ...csvPayload,
      numeric_columns: ["time_s", "absorbance", "temperature"],
      column_stats: {
        ...csvPayload.column_stats,
        temperature: { n: 3, missing: 0, mean: 290, std: 10, sem: 5.7735 },
      },
    };
    const secondSeries: SeriesResponse = {
      ...seriesPayload,
      x_column: "temperature",
      x_unit: "K",
      pair_count: 3,
      skipped_count: 0,
      pairs: [
        { x: 280, y: 0.1 },
        { x: 290, y: 0.2 },
        { x: 300, y: 0.3 },
      ],
    };
    let seriesCalls = 0;
    installFetchMock(
      () => jsonResponse(csvWithThreeColumns),
      () => {
        seriesCalls += 1;
        return jsonResponse(seriesCalls === 1 ? seriesPayload : secondSeries);
      },
    );
    render(<App />);

    await generateSeries();
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-point-count",
      "2",
    );
    expect(
      screen
        .getAllByTestId("scatter-point")
        .map((point) => point.getAttribute("data-x")),
    ).toEqual(["0", "10"]);

    fireEvent.change(screen.getByTestId("series-x-select"), {
      target: { value: "temperature" },
    });
    fireEvent.click(screen.getByRole("button", { name: "生成配对数据" }));

    await waitFor(() =>
      expect(screen.getByTestId("series-pair-count")).toHaveTextContent("3"),
    );
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-point-count",
      "3",
    );
    expect(screen.getByTestId("scatter-x-label")).toHaveTextContent(
      "temperature (K)",
    );
    expect(
      screen
        .getAllByTestId("scatter-point")
        .map((point) => point.getAttribute("data-x")),
    ).toEqual(["280", "290", "300"]);
  });

  it("does not render the scatter plot before a series is generated", async () => {
    installFetchMock(() => jsonResponse(csvPayload));
    render(<App />);

    expect(screen.queryByTestId("scatter-plot")).not.toBeInTheDocument();

    chooseFile();
    startUpload();
    await screen.findByTestId("series-section");

    expect(screen.queryByTestId("scatter-plot")).not.toBeInTheDocument();
  });
});
