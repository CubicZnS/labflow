export type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch("/api/health", { signal });
  if (!response.ok) {
    throw new Error("API health request failed with status " + response.status);
  }
  return (await response.json()) as HealthResponse;
}

export type PreviewCell = string | number | boolean | null;

export type CsvPreviewRow = Record<string, PreviewCell>;

export type ColumnStats = {
  n: number;
  missing: number;
  mean: number;
  std: number;
  sem: number;
};

export type CsvImportResponse = {
  row_count: number;
  columns: string[];
  numeric_columns: string[];
  column_stats: Record<string, ColumnStats>;
  preview: CsvPreviewRow[];
  warnings: string[];
};

export class CsvUploadError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CsvUploadError";
    this.status = status;
  }
}

function extractErrorDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") {
    const message = detail.trim();
    return message.length > 0 ? message : null;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && typeof (item as { msg?: unknown }).msg === "string") {
          return (item as { msg: string }).msg;
        }
        return null;
      })
      .filter((message): message is string => Boolean(message));
    return messages.length > 0 ? messages.join("；") : null;
  }
  return null;
}

export async function uploadCsv(file: File, signal?: AbortSignal): Promise<CsvImportResponse> {
  const form = new FormData();
  form.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/datasets/csv", {
      method: "POST",
      body: form,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new CsvUploadError("无法连接分析服务，请确认后端已启动后重试。");
  }

  if (!response.ok) {
    let detail: string | null = null;
    try {
      detail = extractErrorDetail(await response.json());
    } catch {
      detail = null;
    }
    throw new CsvUploadError(
      detail ?? `CSV 上传失败（HTTP ${response.status}），请检查文件后重试。`,
      response.status,
    );
  }

  try {
    return (await response.json()) as CsvImportResponse;
  } catch {
    throw new CsvUploadError("服务器返回了无法解析的响应，请稍后重试。", response.status);
  }
}