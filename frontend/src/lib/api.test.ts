import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFit,
  createSeries,
  CsvUploadError,
  fetchHealth,
  uploadDataset,
} from "./api";

const NETWORK_ERROR_MESSAGE = "无法连接分析服务，请确认后端已启动后重试。";
const UNPARSEABLE_RESPONSE_MESSAGE = "服务器返回了无法解析的响应，请稍后重试。";

const file = new File(["time_s,absorbance\n0,0.012\n"], "experiment.csv", {
  type: "text/csv",
});

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

function unparseableResponse(status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new SyntaxError("Unexpected token");
    },
  } as unknown as Response;
}

function stubFetch(implementation: (input: RequestInfo | URL, init?: RequestInit) => unknown) {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchHealth", () => {
  it("returns the health payload when the service is available", async () => {
    const payload = { status: "ok", service: "labflow-api", version: "0.1.0" };
    stubFetch(() => jsonResponse(payload));

    await expect(fetchHealth()).resolves.toEqual(payload);
  });

  it("reports a Chinese unavailable message for non-2xx responses", async () => {
    stubFetch(() => jsonResponse({ detail: "down" }, 503));

    await expect(fetchHealth()).rejects.toThrow(
      "分析服务不可用（HTTP 503），请确认后端已启动后重试。",
    );
  });

  it("reports a Chinese network error when fetch rejects", async () => {
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    await expect(fetchHealth()).rejects.toThrow(NETWORK_ERROR_MESSAGE);
  });

  it("reports a Chinese parse error when a 200 body is not JSON", async () => {
    stubFetch(() => unparseableResponse(200));

    await expect(fetchHealth()).rejects.toThrow(UNPARSEABLE_RESPONSE_MESSAGE);
  });

  it("rethrows AbortError without wrapping it", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    stubFetch(() => Promise.reject(abortError));

    await expect(fetchHealth()).rejects.toBe(abortError);
  });
});

describe("uploadDataset", () => {
  it("reports a Chinese network error when fetch rejects", async () => {
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    await expect(uploadDataset(file, "csv")).rejects.toThrow(NETWORK_ERROR_MESSAGE);
  });

  it("passes through a string detail from a 422 response", async () => {
    stubFetch(() => jsonResponse({ detail: "缺少 time_s 列" }, 422));

    await expect(uploadDataset(file, "csv")).rejects.toThrow("缺少 time_s 列");
  });

  it("joins array details with the Chinese semicolon", async () => {
    stubFetch(() =>
      jsonResponse({ detail: [{ msg: "缺少 time_s 列" }, "格式错误"] }, 422),
    );

    await expect(uploadDataset(file, "csv")).rejects.toThrow("缺少 time_s 列；格式错误");
  });

  it("falls back to a Chinese HTTP message when the error body is not JSON", async () => {
    stubFetch(() => unparseableResponse(500));

    await expect(uploadDataset(file, "csv")).rejects.toThrow(
      "CSV 上传失败（HTTP 500），请检查文件后重试。",
    );
  });

  it("reports a Chinese parse error when a 200 body is not JSON", async () => {
    stubFetch(() => unparseableResponse(200));

    await expect(uploadDataset(file, "csv")).rejects.toThrow(UNPARSEABLE_RESPONSE_MESSAGE);
  });

  it("rethrows AbortError as the original error object", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    stubFetch(() => Promise.reject(abortError));

    const result = uploadDataset(file, "csv");
    await expect(result).rejects.toBe(abortError);
    await expect(result).rejects.not.toBeInstanceOf(CsvUploadError);
  });
});

describe("createSeries", () => {
  const selection = { xColumn: "time_s", yColumn: "absorbance" };

  it("reports a Chinese network error when fetch rejects", async () => {
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    await expect(createSeries(file, "csv", selection)).rejects.toThrow(
      NETWORK_ERROR_MESSAGE,
    );
  });

  it("uses the pairing fallback when a non-2xx body is not JSON", async () => {
    stubFetch(() => unparseableResponse(502));

    await expect(createSeries(file, "csv", selection)).rejects.toThrow(
      "生成配对数据失败（HTTP 502），请检查列选择后重试。",
    );
  });
});

describe("createFit", () => {
  const selection = { xColumn: "time_s", yColumn: "absorbance", degree: 1 as const };

  it("reports a Chinese network error when fetch rejects", async () => {
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    await expect(createFit(file, "csv", selection)).rejects.toThrow(
      NETWORK_ERROR_MESSAGE,
    );
  });

  it("uses the fit fallback when a non-2xx body is not JSON", async () => {
    stubFetch(() => unparseableResponse(500));

    await expect(createFit(file, "csv", selection)).rejects.toThrow(
      "拟合失败（HTTP 500），请检查数据后重试。",
    );
  });
});
