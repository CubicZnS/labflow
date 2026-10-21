export const PROJECT_SCHEMA_VERSION = 1 as const;
export const PROJECT_FILE_EXTENSION = ".labflow.json";
export const MAX_PROJECT_FILE_BYTES = 262144;

const HEX_SHA256 = /^[0-9a-f]{64}$/;
const MAX_EXTRA_SERIES = 3;
const MAX_SERIES_NAME_LENGTH = 40;
const MAX_UNIT_LENGTH = 32;
const MAX_TITLE_LENGTH = 120;
const MAX_FILE_BODY_LENGTH = 80;
const FILE_PREFIX = "labflow-";
const FILE_BODY_FALLBACK = "project";

const TOP_LEVEL_FIELDS = new Set([
  "schemaVersion",
  "sourceFileName",
  "dataset",
  "series",
  "extraSeries",
  "fit",
  "chart",
]);

export type ProjectDatasetFormat = "csv" | "xlsx";
export type ProjectFitDegree = 1 | 2 | 3;
export type ProjectTickDensity = "sparse" | "standard" | "dense";
export type ProjectFontScale = "small" | "medium" | "large";

export type ProjectDataset = {
  format: ProjectDatasetFormat;
  sizeBytes: number;
  sha256: string;
  rowCount: number;
  numericColumns: string[];
};

export type ProjectSeries = {
  xColumn: string;
  yColumn: string;
  xUnit: string;
  yUnit: string;
};

export type ProjectExtraSeries = {
  yColumn: string;
  name: string;
};

export type ProjectFit = {
  degree: ProjectFitDegree;
  yErrorColumn: string | null;
  yErrorUnit: string;
};

export type ProjectChart = {
  title: string;
  showGrid: boolean;
  tickDensity: ProjectTickDensity;
  fontScale: ProjectFontScale;
};

export type ProjectSnapshotV1 = {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  sourceFileName: string;
  dataset: ProjectDataset;
  series: ProjectSeries;
  extraSeries: ProjectExtraSeries[];
  fit: ProjectFit | null;
  chart: ProjectChart;
};

export type ProjectSnapshotContext = {
  sourceFileName: string;
  format: ProjectDatasetFormat;
  data: ArrayBuffer | Uint8Array;
  rowCount: number;
  numericColumns: string[];
  series: ProjectSeries;
  extraSeries: ProjectExtraSeries[];
  fit: ProjectFit | null;
  chart: ProjectChart;
};

export type ProjectDatasetIdentity = {
  format: ProjectDatasetFormat;
  sizeBytes: number;
  sha256: string;
  rowCount: number;
  numericColumns: string[];
};

export class ProjectSnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectSnapshotError";
  }
}

function fail(message: string): never {
  throw new ProjectSnapshotError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function own(record: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(record, key)
    ? record[key]
    : undefined;
}

function asBytes(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(
  bytes: ArrayBuffer | Uint8Array,
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new ProjectSnapshotError("当前环境不支持 SHA-256 计算。");
  }
  const view = asBytes(bytes);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  const digest = await subtle.digest("SHA-256", copy);
  return toHex(digest);
}

export async function buildProjectSnapshot(
  context: ProjectSnapshotContext,
): Promise<ProjectSnapshotV1> {
  const bytes = asBytes(context.data);
  const sha256 = await sha256Hex(bytes);
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    sourceFileName: context.sourceFileName,
    dataset: {
      format: context.format,
      sizeBytes: bytes.byteLength,
      sha256,
      rowCount: context.rowCount,
      numericColumns: [...context.numericColumns],
    },
    series: {
      xColumn: context.series.xColumn,
      yColumn: context.series.yColumn,
      xUnit: context.series.xUnit,
      yUnit: context.series.yUnit,
    },
    extraSeries: context.extraSeries.map((series) => ({
      yColumn: series.yColumn,
      name: series.name.trim().slice(0, MAX_SERIES_NAME_LENGTH) || series.yColumn,
    })),
    fit: context.fit
      ? {
          degree: context.fit.degree,
          yErrorColumn: context.fit.yErrorColumn,
          yErrorUnit: context.fit.yErrorUnit,
        }
      : null,
    chart: {
      title: context.chart.title,
      showGrid: context.chart.showGrid,
      tickDensity: context.chart.tickDensity,
      fontScale: context.chart.fontScale,
    },
  };
}

function orderedSnapshot(snapshot: ProjectSnapshotV1): ProjectSnapshotV1 {
  return {
    schemaVersion: snapshot.schemaVersion,
    sourceFileName: snapshot.sourceFileName,
    dataset: {
      format: snapshot.dataset.format,
      sizeBytes: snapshot.dataset.sizeBytes,
      sha256: snapshot.dataset.sha256,
      rowCount: snapshot.dataset.rowCount,
      numericColumns: [...snapshot.dataset.numericColumns],
    },
    series: {
      xColumn: snapshot.series.xColumn,
      yColumn: snapshot.series.yColumn,
      xUnit: snapshot.series.xUnit,
      yUnit: snapshot.series.yUnit,
    },
    extraSeries: snapshot.extraSeries.map((series) => ({
      yColumn: series.yColumn,
      name: series.name,
    })),
    fit: snapshot.fit
      ? {
          degree: snapshot.fit.degree,
          yErrorColumn: snapshot.fit.yErrorColumn,
          yErrorUnit: snapshot.fit.yErrorUnit,
        }
      : null,
    chart: {
      title: snapshot.chart.title,
      showGrid: snapshot.chart.showGrid,
      tickDensity: snapshot.chart.tickDensity,
      fontScale: snapshot.chart.fontScale,
    },
  };
}

export function serializeProjectSnapshot(snapshot: ProjectSnapshotV1): string {
  return JSON.stringify(orderedSnapshot(snapshot), null, 2) + "\n";
}

function readString(
  value: unknown,
  label: string,
  options: { maxLength?: number; allowEmpty?: boolean } = {},
): string {
  if (typeof value !== "string") {
    fail(`${label} 必须是字符串。`);
  }
  const trimmed = value.trim();
  if (!options.allowEmpty && trimmed.length === 0) {
    fail(`${label} 不能为空。`);
  }
  if (options.maxLength !== undefined && value.length > options.maxLength) {
    fail(`${label} 不能超过 ${options.maxLength} 个字符。`);
  }
  return value;
}

function readNumber(
  value: unknown,
  label: string,
  options: { integer?: boolean; min?: number } = {},
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${label} 必须是有效数字。`);
  }
  if (options.integer && !Number.isInteger(value)) {
    fail(`${label} 必须是整数。`);
  }
  if (options.min !== undefined && value < options.min) {
    fail(`${label} 不能小于 ${options.min}。`);
  }
  return value;
}

function readBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    fail(`${label} 必须是布尔值。`);
  }
  return value;
}

function readFormat(value: unknown): ProjectDatasetFormat {
  if (value !== "csv" && value !== "xlsx") {
    fail("dataset.format 必须是 csv 或 xlsx。");
  }
  return value;
}

function readDegree(value: unknown): ProjectFitDegree {
  if (value !== 1 && value !== 2 && value !== 3) {
    fail("fit.degree 必须是 1、2 或 3。");
  }
  return value;
}

function readTickDensity(value: unknown): ProjectTickDensity {
  if (value !== "sparse" && value !== "standard" && value !== "dense") {
    fail("chart.tickDensity 必须是 sparse、standard 或 dense。");
  }
  return value;
}

function readFontScale(value: unknown): ProjectFontScale {
  if (value !== "small" && value !== "medium" && value !== "large") {
    fail("chart.fontScale 必须是 small、medium 或 large。");
  }
  return value;
}

function readNumericColumns(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    fail("dataset.numericColumns 必须是非空字符串数组。");
  }
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || item.trim().length === 0) {
      fail("dataset.numericColumns 中的列名必须是非空字符串。");
    }
    if (seen.has(item)) {
      fail(`dataset.numericColumns 存在重复列「${item}」。`);
    }
    seen.add(item);
    columns.push(item);
  }
  return columns;
}

function readSeries(
  value: unknown,
  numericColumns: string[],
): ProjectSeries {
  if (!isRecord(value)) {
    fail("series 必须是对象。");
  }
  const xColumn = readString(own(value, "xColumn"), "series.xColumn");
  const yColumn = readString(own(value, "yColumn"), "series.yColumn");
  if (xColumn === yColumn) {
    fail("series.xColumn 与 series.yColumn 不能相同。");
  }
  if (!numericColumns.includes(xColumn)) {
    fail(`series.xColumn「${xColumn}」不在 dataset.numericColumns 中。`);
  }
  if (!numericColumns.includes(yColumn)) {
    fail(`series.yColumn「${yColumn}」不在 dataset.numericColumns 中。`);
  }
  return {
    xColumn,
    yColumn,
    xUnit: readString(own(value, "xUnit"), "series.xUnit", {
      maxLength: MAX_UNIT_LENGTH,
      allowEmpty: true,
    }),
    yUnit: readString(own(value, "yUnit"), "series.yUnit", {
      maxLength: MAX_UNIT_LENGTH,
      allowEmpty: true,
    }),
  };
}

function readExtraSeries(
  value: unknown,
  numericColumns: string[],
  xColumn: string,
  yColumn: string,
): ProjectExtraSeries[] {
  if (!Array.isArray(value)) {
    fail("extraSeries 必须是数组。");
  }
  if (value.length > MAX_EXTRA_SERIES) {
    fail(`extraSeries 最多允许 ${MAX_EXTRA_SERIES} 个追加系列。`);
  }
  const used = new Set<string>([xColumn, yColumn]);
  return value.map((item, index) => {
    if (!isRecord(item)) {
      fail(`extraSeries[${index}] 必须是对象。`);
    }
    const extraY = readString(
      own(item, "yColumn"),
      `extraSeries[${index}].yColumn`,
    );
    if (!numericColumns.includes(extraY)) {
      fail(`extraSeries[${index}].yColumn「${extraY}」不在数值列中。`);
    }
    if (used.has(extraY)) {
      fail(`extraSeries[${index}].yColumn「${extraY}」与主系列或其它追加系列重复。`);
    }
    used.add(extraY);
    const rawName = readString(own(item, "name"), `extraSeries[${index}].name`, {
      allowEmpty: true,
    });
    const trimmedName = rawName.trim();
    if (trimmedName.length > MAX_SERIES_NAME_LENGTH) {
      fail(
        `extraSeries[${index}].name 不能超过 ${MAX_SERIES_NAME_LENGTH} 个字符。`,
      );
    }
    return {
      yColumn: extraY,
      name: trimmedName || extraY,
    };
  });
}

function readFit(
  value: unknown,
  numericColumns: string[],
  xColumn: string,
  yColumn: string,
): ProjectFit | null {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    fail("fit 必须是对象或 null。");
  }
  const degree = readDegree(own(value, "degree"));
  const rawErrorColumn = own(value, "yErrorColumn");
  let yErrorColumn: string | null;
  if (rawErrorColumn === null) {
    yErrorColumn = null;
  } else if (typeof rawErrorColumn === "string") {
    const trimmed = rawErrorColumn.trim();
    if (trimmed.length === 0) {
      fail("fit.yErrorColumn 必须是非空列名或 null。");
    }
    if (!numericColumns.includes(rawErrorColumn)) {
      fail(`fit.yErrorColumn「${rawErrorColumn}」不在数值列中。`);
    }
    if (rawErrorColumn === xColumn || rawErrorColumn === yColumn) {
      fail("fit.yErrorColumn 不能与 X/Y 列相同。");
    }
    yErrorColumn = rawErrorColumn;
  } else {
    fail("fit.yErrorColumn 必须是字符串或 null。");
  }
  return {
    degree,
    yErrorColumn,
    yErrorUnit: readString(own(value, "yErrorUnit"), "fit.yErrorUnit", {
      maxLength: MAX_UNIT_LENGTH,
      allowEmpty: true,
    }),
  };
}

function readChart(value: unknown): ProjectChart {
  if (!isRecord(value)) {
    fail("chart 必须是对象。");
  }
  return {
    title: readString(own(value, "title"), "chart.title", {
      maxLength: MAX_TITLE_LENGTH,
      allowEmpty: true,
    }),
    showGrid: readBoolean(own(value, "showGrid"), "chart.showGrid"),
    tickDensity: readTickDensity(own(value, "tickDensity")),
    fontScale: readFontScale(own(value, "fontScale")),
  };
}

export function parseProjectSnapshot(text: string): ProjectSnapshotV1 {
  if (typeof text !== "string" || text.trim().length === 0) {
    fail("项目文件内容为空。");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail("项目文件不是合法的 JSON。");
  }
  if (!isRecord(parsed)) {
    fail("项目文件必须是 JSON 对象。");
  }
  for (const key of Object.keys(parsed)) {
    if (!TOP_LEVEL_FIELDS.has(key)) {
      fail(`项目文件包含未知字段「${key}」。`);
    }
  }
  if (own(parsed, "schemaVersion") !== PROJECT_SCHEMA_VERSION) {
    fail("不支持的项目文件版本。");
  }

  const sourceFileName = readString(
    own(parsed, "sourceFileName"),
    "sourceFileName",
  ).trim();
  if (sourceFileName.length === 0) {
    fail("sourceFileName 不能为空。");
  }

  const rawDataset = own(parsed, "dataset");
  if (!isRecord(rawDataset)) {
    fail("dataset 必须是对象。");
  }
  const format = readFormat(own(rawDataset, "format"));
  const sizeBytes = readNumber(own(rawDataset, "sizeBytes"), "dataset.sizeBytes", {
    integer: true,
    min: 0,
  });
  const sha256 = own(rawDataset, "sha256");
  if (typeof sha256 !== "string" || !HEX_SHA256.test(sha256)) {
    fail("dataset.sha256 必须是 64 位小写十六进制字符串。");
  }
  const rowCount = readNumber(own(rawDataset, "rowCount"), "dataset.rowCount", {
    integer: true,
    min: 0,
  });
  const numericColumns = readNumericColumns(
    own(rawDataset, "numericColumns"),
  );

  const series = readSeries(own(parsed, "series"), numericColumns);
  const extraSeries = readExtraSeries(
    own(parsed, "extraSeries"),
    numericColumns,
    series.xColumn,
    series.yColumn,
  );
  const fit = readFit(
    own(parsed, "fit"),
    numericColumns,
    series.xColumn,
    series.yColumn,
  );
  const chart = readChart(own(parsed, "chart"));

  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    sourceFileName,
    dataset: { format, sizeBytes, sha256, rowCount, numericColumns },
    series,
    extraSeries,
    fit,
    chart,
  };
}

function cleanFileBody(source: string): string {
  return source
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\-\s]+|[.\-\s]+$/g, "")
    .slice(0, MAX_FILE_BODY_LENGTH)
    .replace(/^[.\-\s]+|[.\-\s]+$/g, "");
}

export function buildProjectFileName(sourceFileName: string): string {
  const lower = sourceFileName.toLowerCase();
  const withoutExtension = lower.endsWith(".csv") || lower.endsWith(".xlsx")
    ? sourceFileName.slice(0, sourceFileName.lastIndexOf("."))
    : sourceFileName;
  const body = cleanFileBody(withoutExtension) || FILE_BODY_FALLBACK;
  return `${FILE_PREFIX}${body}${PROJECT_FILE_EXTENSION}`;
}

function sameColumns(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((column, index) => column === right[index]);
}

export function datasetMatchesSnapshot(
  snapshot: ProjectSnapshotV1,
  current: ProjectDatasetIdentity,
): boolean {
  return (
    snapshot.dataset.sha256 === current.sha256 &&
    snapshot.dataset.format === current.format &&
    snapshot.dataset.sizeBytes === current.sizeBytes &&
    snapshot.dataset.rowCount === current.rowCount &&
    sameColumns(snapshot.dataset.numericColumns, current.numericColumns)
  );
}

function readBlobAsText(file: Blob): Promise<string> {
  const readable = file as Blob & { text?: () => Promise<string> };
  if (typeof readable.text === "function") {
    return readable.text();
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("当前环境不支持读取文件。"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("读取文件失败。"));
    reader.readAsText(file);
  });
}

export function readFileBytes(file: Blob): Promise<ArrayBuffer> {
  const readable = file as Blob & { arrayBuffer?: () => Promise<ArrayBuffer> };
  if (typeof readable.arrayBuffer === "function") {
    return readable.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("当前环境不支持读取文件。"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("读取文件失败。"));
    reader.readAsArrayBuffer(file);
  });
}

export async function readProjectFile(file: File): Promise<ProjectSnapshotV1> {
  if (file.size > MAX_PROJECT_FILE_BYTES) {
    fail(
      `项目文件超过 ${MAX_PROJECT_FILE_BYTES} 字节（256 KB）上限，请选择更小的项目文件。`,
    );
  }
  let text: string;
  try {
    text = await readBlobAsText(file);
  } catch {
    fail("读取项目文件失败，请重试。");
  }
  return parseProjectSnapshot(text);
}

export type ProjectDownloadDeps = {
  createObjectURL?: (blob: Blob) => string;
  revokeObjectURL?: (url: string) => void;
  document?: Document;
};

export function downloadProjectSnapshot(
  snapshot: ProjectSnapshotV1,
  deps: ProjectDownloadDeps = {},
): string {
  const fileName = buildProjectFileName(snapshot.sourceFileName);
  const text = serializeProjectSnapshot(snapshot);
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const createObjectURL = deps.createObjectURL ?? ((value: Blob) => URL.createObjectURL(value));
  const revokeObjectURL = deps.revokeObjectURL ?? ((url: string) => URL.revokeObjectURL(url));
  const doc = deps.document ?? document;
  const url = createObjectURL(blob);
  try {
    const anchor = doc.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    doc.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    revokeObjectURL(url);
  }
  return fileName;
}
