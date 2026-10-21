import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { CsvImportResponse } from "./lib/api";

const healthPayload = { status: "ok", service: "labflow-api", version: "0.1.0" };

const csvPayload: CsvImportResponse = {
  row_count: 3,
  columns: ["time_s", "absorbance", "notes"],
  numeric_columns: ["time_s", "absorbance"],
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
