export type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

const NETWORK_ERROR_MESSAGE = "无法连接分析服务，请确认后端已启动后重试。";
const UNPARSEABLE_RESPONSE_MESSAGE = "服务器返回了无法解析的响应，请稍后重试。";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  let response: Response;
  try {
    response = await fetch("/api/health", { signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  if (!response.ok) {
    throw new Error(`分析服务不可用（HTTP ${response.status}），请确认后端已启动后重试。`);
  }
  try {
    return (await response.json()) as HealthResponse;
  } catch {
    throw new Error(UNPARSEABLE_RESPONSE_MESSAGE);
  }
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

async function postFormJson<T>(
  endpoint: string,
  form: FormData,
  fallbackMessage: (status: number) => string,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      body: form,
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new CsvUploadError(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    let detail: string | null = null;
    try {
      detail = extractErrorDetail(await response.json());
    } catch {
      detail = null;
    }
    throw new CsvUploadError(detail ?? fallbackMessage(response.status), response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new CsvUploadError(UNPARSEABLE_RESPONSE_MESSAGE, response.status);
  }
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

  return postFormJson<CsvImportResponse>(
    DATASET_ENDPOINTS[format],
    form,
    (status) =>
      `${format.toUpperCase()} 上传失败（HTTP ${status}），请检查文件后重试。`,
    signal,
  );
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

export type FitDegree = 1 | 2 | 3;

export type ConfidenceInterval = {
  low: number;
  high: number;
};

export type FitUncertainty = {
  residual_dof: number;
  standard_errors: number[] | null;
  confidence_intervals: ConfidenceInterval[] | null;
  condition_number: number | null;
  ill_conditioned: boolean;
};

export type FitResponse = {
  x_column: string;
  y_column: string;
  x_unit: string | null;
  y_unit: string | null;
  row_count: number;
  pair_count: number;
  skipped_count: number;
  degree: number;
  coefficients: number[];
  equation: string;
  r_squared: number;
  pairs: SeriesPair[];
  fitted: number[];
  residuals: number[];
  rmse: number;
  max_abs_residual: number;
  warnings: string[];
  uncertainty: FitUncertainty;
  weighted: boolean;
  y_error_column: string | null;
  y_error_unit: string | null;
  y_errors: number[] | null;
  chi_squared: number | null;
  reduced_chi_squared: number | null;
};

export type FitSelection = {
  xColumn: string;
  yColumn: string;
  xUnit?: string;
  yUnit?: string;
  degree: FitDegree;
  yErrorColumn?: string;
  yErrorUnit?: string;
};

export async function createFit(
  file: File,
  format: DatasetFormat,
  selection: FitSelection,
  signal?: AbortSignal,
): Promise<FitResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("format", format);
  form.append("x_column", selection.xColumn);
  form.append("y_column", selection.yColumn);
  form.append("degree", String(selection.degree));
  const xUnit = selection.xUnit?.trim() ?? "";
  const yUnit = selection.yUnit?.trim() ?? "";
  if (xUnit) {
    form.append("x_unit", xUnit);
  }
  if (yUnit) {
    form.append("y_unit", yUnit);
  }
  const yErrorColumn = selection.yErrorColumn?.trim() ?? "";
  if (yErrorColumn) {
    form.append("y_error_column", yErrorColumn);
    const yErrorUnit = selection.yErrorUnit?.trim() ?? "";
    if (yErrorUnit) {
      form.append("y_error_unit", yErrorUnit);
    }
  }

  return postFormJson<FitResponse>(
    "/api/datasets/fit",
    form,
    (status) => `拟合失败（HTTP ${status}），请检查数据后重试。`,
    signal,
  );
}

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

  return postFormJson<SeriesResponse>(
    "/api/datasets/series",
    form,
    (status) => `生成配对数据失败（HTTP ${status}），请检查列选择后重试。`,
    signal,
  );
}