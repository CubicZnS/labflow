import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { CsvImportResponse, SeriesResponse } from "./lib/api";

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
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/health") {
      return jsonResponse(healthPayload);
    }
    if (url === "/api/datasets/series" && series) {
      return series();
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
});
