import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { CsvImportResponse } from "./lib/api";

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

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

function installFetchMock(upload?: () => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/health") {
      return jsonResponse(healthPayload);
    }
    if (url === "/api/datasets/csv" && upload) {
      return upload();
    }
    throw new Error("Unexpected request: " + url);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function chooseFile(name = "experiment.csv") {
  const file = new File(["time_s,absorbance\n0,0.012\n"], name, { type: "text/csv" });
  fireEvent.change(screen.getByLabelText("选择 CSV 文件"), { target: { files: [file] } });
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
});
