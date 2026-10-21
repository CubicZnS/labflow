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

export type DatasetFormat = "csv" | "xlsx";

const DATASET_ENDPOINTS: Record<DatasetFormat, string> = {
  csv: "/api/datasets/csv",
  xlsx: "/api/datasets/xlsx",
};

export function datasetFormatForFile(fileName: string): DatasetFormat | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) {
    return "csv";
  }
  if (lower.endsWith(".xlsx")) {
    return "xlsx";
  }
  return null;
}

export async function uploadDataset(
  file: File,
  format: DatasetFormat,
  signal?: AbortSignal,
): Promise<CsvImportResponse> {
  const form = new FormData();
  form.append("file", file);

  let response: Response;
  try {
    response = await fetch(DATASET_ENDPOINTS[format], {
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
      detail ?? `${format.toUpperCase()} 上传失败（HTTP ${response.status}），请检查文件后重试。`,
      response.status,
    );
  }

  try {
    return (await response.json()) as CsvImportResponse;
  } catch {
    throw new CsvUploadError("服务器返回了无法解析的响应，请稍后重试。", response.status);
  }
}

export function uploadCsv(file: File, signal?: AbortSignal): Promise<CsvImportResponse> {
  return uploadDataset(file, "csv", signal);
}

export function uploadXlsx(file: File, signal?: AbortSignal): Promise<CsvImportResponse> {
  return uploadDataset(file, "xlsx", signal);
}

export type SeriesPair = {
  x: number;
  y: number;
};

export type SeriesResponse = {
  x_column: string;
  y_column: string;
  x_unit: string | null;
  y_unit: string | null;
  row_count: number;
  pair_count: number;
  skipped_count: number;
  pairs: SeriesPair[];
  x_stats: ColumnStats | null;
  y_stats: ColumnStats | null;
  warnings: string[];
};

export type SeriesSelection = {
  xColumn: string;
  yColumn: string;
  xUnit?: string;
  yUnit?: string;
};

export async function createSeries(
  file: File,
  format: DatasetFormat,
  selection: SeriesSelection,
  signal?: AbortSignal,
): Promise<SeriesResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("format", format);
  form.append("x_column", selection.xColumn);
  form.append("y_column", selection.yColumn);
  const xUnit = selection.xUnit?.trim() ?? "";
  const yUnit = selection.yUnit?.trim() ?? "";
  if (xUnit) {
    form.append("x_unit", xUnit);
  }
  if (yUnit) {
    form.append("y_unit", yUnit);
  }

  let response: Response;
  try {
    response = await fetch("/api/datasets/series", {
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
      detail ?? `生成配对数据失败（HTTP ${response.status}），请检查列选择后重试。`,
      response.status,
    );
  }

  try {
    return (await response.json()) as SeriesResponse;
  } catch {
    throw new CsvUploadError("服务器返回了无法解析的响应，请稍后重试。", response.status);
  }
}