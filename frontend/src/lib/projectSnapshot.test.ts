import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_PROJECT_FILE_BYTES,
  PROJECT_FILE_EXTENSION,
  PROJECT_SCHEMA_VERSION,
  ProjectSnapshotError,
  buildProjectFileName,
  buildProjectSnapshot,
  datasetMatchesSnapshot,
  downloadProjectSnapshot,
  parseProjectSnapshot,
  readProjectFile,
  serializeProjectSnapshot,
  sha256Hex,
  type ProjectSnapshotContext,
  type ProjectSnapshotV1,
} from "./projectSnapshot";

const encoder = new TextEncoder();
const datasetBytes = encoder.encode(
  "time_s,absorbance,err\n0,0.012,0.001\n5,0.12,0.002\n",
);

const EMPTY_SHA256 =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const ABC_SHA256 =
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

function baseContext(
  overrides: Partial<ProjectSnapshotContext> = {},
): ProjectSnapshotContext {
  return {
    sourceFileName: "experiment.csv",
    format: "csv",
    data: datasetBytes,
    rowCount: 2,
    numericColumns: ["time_s", "absorbance", "err"],
    series: {
      xColumn: "time_s",
      yColumn: "absorbance",
      xUnit: "s",
      yUnit: "mV",
    },
    extraSeries: [{ yColumn: "err", name: "误差" }],
    fit: { degree: 1, yErrorColumn: "err", yErrorUnit: "mV" },
    chart: {
      title: "吸收曲线",
      showGrid: true,
      tickDensity: "dense",
      fontScale: "large",
    },
    ...overrides,
  };
}

async function validSnapshot(): Promise<ProjectSnapshotV1> {
  return buildProjectSnapshot(baseContext());
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function expectInvalid(text: string, message: string | RegExp) {
  expect(() => parseProjectSnapshot(text)).toThrow(ProjectSnapshotError);
  expect(() => parseProjectSnapshot(text)).toThrow(message);
}

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("读取测试 Blob 失败"));
    reader.readAsText(blob);
  });
}

beforeEach(async () => {
  const nodeCrypto = await vi.importActual<{ webcrypto: Crypto }>(
    "node:crypto",
  );
  vi.stubGlobal("crypto", nodeCrypto.webcrypto);
});

describe("project constants", () => {
  it("exports the v1 schema constants", () => {
    expect(PROJECT_SCHEMA_VERSION).toBe(1);
    expect(PROJECT_FILE_EXTENSION).toBe(".labflow.json");
    expect(MAX_PROJECT_FILE_BYTES).toBe(262144);
  });
});

describe("sha256Hex", () => {
  it("matches the known SHA-256 vectors", async () => {
    expect(await sha256Hex(new Uint8Array())).toBe(EMPTY_SHA256);
    expect(await sha256Hex(encoder.encode("abc"))).toBe(ABC_SHA256);
  });

  it("returns 64 lowercase hex characters and respects typed-array views", async () => {
    const view = new Uint8Array([0, 97, 98, 99]).subarray(1);
    const hash = await sha256Hex(view);
    expect(hash).toBe(ABC_SHA256);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hash.toLowerCase());
  });

  it("reports a Chinese error when Web Crypto is unavailable", async () => {
    vi.stubGlobal("crypto", {});
    await expect(sha256Hex(new Uint8Array())).rejects.toThrow(
      "当前环境不支持 SHA-256 计算。",
    );
  });
});

describe("buildProjectSnapshot", () => {
  it("builds a complete snapshot with stable field order and byte size", async () => {
    const snapshot = await buildProjectSnapshot(baseContext());
    expect(snapshot).toEqual({
      schemaVersion: 1,
      sourceFileName: "experiment.csv",
      dataset: {
        format: "csv",
        sizeBytes: datasetBytes.byteLength,
        sha256: await sha256Hex(datasetBytes),
        rowCount: 2,
        numericColumns: ["time_s", "absorbance", "err"],
      },
      series: {
        xColumn: "time_s",
        yColumn: "absorbance",
        xUnit: "s",
        yUnit: "mV",
      },
      extraSeries: [{ yColumn: "err", name: "误差" }],
      fit: { degree: 1, yErrorColumn: "err", yErrorUnit: "mV" },
      chart: {
        title: "吸收曲线",
        showGrid: true,
        tickDensity: "dense",
        fontScale: "large",
      },
    });
    expect(Object.keys(snapshot)).toEqual([
      "schemaVersion",
      "sourceFileName",
      "dataset",
      "series",
      "extraSeries",
      "fit",
      "chart",
    ]);
  });

  it("writes fit as null when no fit was run", async () => {
    const snapshot = await buildProjectSnapshot(baseContext({ fit: null }));
    expect(snapshot.fit).toBeNull();
  });

  it("normalizes blank extra names to the column name and trims stored names", async () => {
    const snapshot = await buildProjectSnapshot(
      baseContext({
        extraSeries: [
          { yColumn: "err", name: "   " },
        ],
      }),
    );
    expect(snapshot.extraSeries).toEqual([{ yColumn: "err", name: "err" }]);
  });
});

describe("serializeProjectSnapshot", () => {
  it("serializes deterministically with two-space indentation and a trailing newline", async () => {
    const snapshot = await validSnapshot();
    const first = serializeProjectSnapshot(snapshot);
    const second = serializeProjectSnapshot(clone(snapshot));

    expect(first).toBe(second);
    expect(first.endsWith("\n")).toBe(true);
    expect(first).toContain('\n  "dataset": {');
    expect(first).toContain('\n    "numericColumns": [');
    expect(first).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("keeps the documented nested key order", async () => {
    const snapshot = await validSnapshot();
    const parsed = JSON.parse(serializeProjectSnapshot(snapshot)) as Record<
      string,
      unknown
    >;
    expect(Object.keys(parsed)).toEqual([
      "schemaVersion",
      "sourceFileName",
      "dataset",
      "series",
      "extraSeries",
      "fit",
      "chart",
    ]);
    expect(Object.keys(parsed.dataset as Record<string, unknown>)).toEqual([
      "format",
      "sizeBytes",
      "sha256",
      "rowCount",
      "numericColumns",
    ]);
    expect(Object.keys(parsed.series as Record<string, unknown>)).toEqual([
      "xColumn",
      "yColumn",
      "xUnit",
      "yUnit",
    ]);
    expect(Object.keys(parsed.chart as Record<string, unknown>)).toEqual([
      "title",
      "showGrid",
      "tickDensity",
      "fontScale",
    ]);
  });

  it("never contains raw rows, pairs, coefficients, warnings, or credentials", async () => {
    const text = serializeProjectSnapshot(await validSnapshot());
    expect(text).not.toContain("0,0.012");
    expect(text).not.toContain("pairs");
    expect(text).not.toContain("coefficients");
    expect(text).not.toContain("residuals");
    expect(text).not.toContain("warnings");
    expect(text).not.toContain("apiKey");
    expect(text).not.toContain("token");
  });
});

describe("parseProjectSnapshot", () => {
  it("round-trips a serialized snapshot", async () => {
    const snapshot = await validSnapshot();
    expect(parseProjectSnapshot(serializeProjectSnapshot(snapshot))).toEqual(
      snapshot,
    );
  });

  it("falls back blank extra series names to the column name", async () => {
    const snapshot = clone(await validSnapshot());
    snapshot.extraSeries[0].name = "   ";
    const parsed = parseProjectSnapshot(JSON.stringify(snapshot));
    expect(parsed.extraSeries[0].name).toBe("err");
  });

  it("rejects empty content and malformed JSON with Chinese messages", () => {
    expectInvalid("   ", "项目文件内容为空。");
    expectInvalid("{not json", "项目文件不是合法的 JSON。");
    expectInvalid("[]", "项目文件必须是 JSON 对象。");
  });

  it("rejects unsupported schema versions", async () => {
    const snapshot = clone(await validSnapshot());
    snapshot.schemaVersion = 2 as 1;
    expectInvalid(JSON.stringify(snapshot), "不支持的项目文件版本。");

    const stringVersion = clone(await validSnapshot()) as unknown as Record<
      string,
      unknown
    >;
    stringVersion.schemaVersion = "1";
    expectInvalid(JSON.stringify(stringVersion), "不支持的项目文件版本。");
  });

  it("rejects invalid dataset fields", async () => {
    const base = await validSnapshot();

    let value = clone(base);
    value.dataset.format = "json" as "csv";
    expectInvalid(JSON.stringify(value), "dataset.format");

    value = clone(base);
    value.dataset.sha256 = base.dataset.sha256.toUpperCase();
    expectInvalid(JSON.stringify(value), "64 位小写十六进制");

    value = clone(base);
    value.dataset.sizeBytes = -1;
    expectInvalid(JSON.stringify(value), "不能小于 0");

    value = clone(base);
    value.dataset.sizeBytes = 1.5;
    expectInvalid(JSON.stringify(value), "必须是整数");

    value = clone(base);
    value.dataset.rowCount = -2;
    expectInvalid(JSON.stringify(value), "不能小于 0");

    value = clone(base);
    value.dataset.numericColumns = [];
    expectInvalid(JSON.stringify(value), "非空字符串数组");

    value = clone(base);
    value.dataset.numericColumns = ["time_s", "absorbance", ""];
    expectInvalid(JSON.stringify(value), "非空字符串");

    value = clone(base);
    value.dataset.numericColumns = ["time_s", "absorbance", "absorbance"];
    expectInvalid(JSON.stringify(value), "重复列");
  });

  it("rejects invalid main series selections", async () => {
    const base = await validSnapshot();

    let value = clone(base);
    value.series.yColumn = value.series.xColumn;
    expectInvalid(JSON.stringify(value), "不能相同");

    value = clone(base);
    value.series.xColumn = "missing";
    expectInvalid(JSON.stringify(value), "不在 dataset.numericColumns");

    value = clone(base);
    value.series.xUnit = "u".repeat(33);
    expectInvalid(JSON.stringify(value), "不能超过 32");
  });

  it("validates extra series count, duplicates, and name length", async () => {
    const base = await validSnapshot();

    let value = clone(base);
    value.extraSeries = [
      { yColumn: "err", name: "一" },
      { yColumn: "err", name: "二" },
    ];
    expectInvalid(JSON.stringify(value), "重复");

    value = clone(base);
    value.extraSeries = [{ yColumn: "absorbance", name: "冲突" }];
    expectInvalid(JSON.stringify(value), "重复");

    value = clone(base);
    value.extraSeries = [{ yColumn: "err", name: "x".repeat(41) }];
    expectInvalid(JSON.stringify(value), "不能超过 40");

    value = clone(base);
    value.extraSeries = [
      { yColumn: "err", name: "一" },
      { yColumn: "x", name: "二" },
      { yColumn: "y", name: "三" },
      { yColumn: "z", name: "四" },
    ];
    expectInvalid(JSON.stringify(value), "最多允许 3 个");
  });

  it("validates fit settings", async () => {
    const base = await validSnapshot();

    let value = clone(base);
    value.fit!.degree = 4 as 1;
    expectInvalid(JSON.stringify(value), "fit.degree 必须是 1、2 或 3");

    value = clone(base);
    value.fit!.yErrorColumn = "time_s";
    expectInvalid(JSON.stringify(value), "不能与 X/Y 列相同");

    value = clone(base);
    value.fit!.yErrorColumn = "missing";
    expectInvalid(JSON.stringify(value), "不在数值列中");

    value = clone(base);
    value.fit!.yErrorUnit = "u".repeat(33);
    expectInvalid(JSON.stringify(value), "不能超过 32");
  });

  it("validates chart settings", async () => {
    const base = await validSnapshot();

    let value = clone(base);
    value.chart.title = "标".repeat(121);
    expectInvalid(JSON.stringify(value), "不能超过 120");

    value = clone(base);
    value.chart.showGrid = "yes" as unknown as boolean;
    expectInvalid(JSON.stringify(value), "必须是布尔值");

    value = clone(base);
    value.chart.tickDensity = "huge" as "dense";
    expectInvalid(JSON.stringify(value), "tickDensity");

    value = clone(base);
    value.chart.fontScale = "huge" as "large";
    expectInvalid(JSON.stringify(value), "fontScale");
  });

  it("rejects unknown top-level fields without polluting prototypes", async () => {
    const payload =
      '{"schemaVersion":1,"__proto__":{"polluted":true},"sourceFileName":"a.csv"}';
    expectInvalid(payload, "未知字段");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();

    const nested = clone(await validSnapshot()) as unknown as Record<
      string,
      unknown
    >;
    (nested.dataset as Record<string, unknown>).__proto__ = { polluted: true };
    const parsed = parseProjectSnapshot(JSON.stringify(nested));
    expect(parsed.dataset.numericColumns).toEqual([
      "time_s",
      "absorbance",
      "err",
    ]);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("datasetMatchesSnapshot", () => {
  it("matches only when hash, format, size, row count, and columns all agree", async () => {
    const snapshot = await validSnapshot();
    const current = {
      format: snapshot.dataset.format,
      sizeBytes: snapshot.dataset.sizeBytes,
      sha256: snapshot.dataset.sha256,
      rowCount: snapshot.dataset.rowCount,
      numericColumns: [...snapshot.dataset.numericColumns],
    };
    expect(datasetMatchesSnapshot(snapshot, current)).toBe(true);

    expect(
      datasetMatchesSnapshot(snapshot, {
        ...current,
        sha256: "0".repeat(64),
      }),
    ).toBe(false);
    expect(
      datasetMatchesSnapshot(snapshot, {
        ...current,
        sizeBytes: current.sizeBytes + 1,
      }),
    ).toBe(false);
    expect(
      datasetMatchesSnapshot(snapshot, {
        ...current,
        format: "xlsx",
      }),
    ).toBe(false);
    expect(
      datasetMatchesSnapshot(snapshot, {
        ...current,
        rowCount: current.rowCount + 1,
      }),
    ).toBe(false);
    expect(
      datasetMatchesSnapshot(snapshot, {
        ...current,
        numericColumns: [...current.numericColumns].reverse(),
      }),
    ).toBe(false);
  });
});

describe("buildProjectFileName", () => {
  it("strips csv/xlsx suffixes and uses the fixed prefix and extension", () => {
    expect(buildProjectFileName("experiment.csv")).toBe(
      "labflow-experiment.labflow.json",
    );
    expect(buildProjectFileName("EXPERIMENT.XLSX")).toBe(
      "labflow-EXPERIMENT.labflow.json",
    );
    expect(buildProjectFileName("run01")).toBe(
      "labflow-run01.labflow.json",
    );
  });

  it("cleans illegal characters, control characters, and whitespace", () => {
    expect(buildProjectFileName('a/b\\c:d*e?f"g<h>i|j.csv')).toBe(
      "labflow-a-b-c-d-e-f-g-h-i-j.labflow.json",
    );
    expect(buildProjectFileName("a\nb\tc.csv")).toBe(
      "labflow-a-b-c.labflow.json",
    );
    expect(buildProjectFileName("实验 数据.csv")).toBe(
      "labflow-实验-数据.labflow.json",
    );
  });

  it("falls back for empty bodies and caps the body at 80 characters", () => {
    expect(buildProjectFileName(".csv")).toBe(
      "labflow-project.labflow.json",
    );
    expect(buildProjectFileName(":::.xlsx")).toBe(
      "labflow-project.labflow.json",
    );

    const long = buildProjectFileName(`${"测".repeat(200)}.csv`);
    const body = long.slice("labflow-".length, -".labflow.json".length);
    expect(body).toHaveLength(80);
    expect(long).toBe(buildProjectFileName(`${"测".repeat(200)}.csv`));
  });
});

describe("readProjectFile", () => {
  it("parses a valid project file", async () => {
    const snapshot = await validSnapshot();
    const file = new File(
      [serializeProjectSnapshot(snapshot)],
      "experiment.labflow.json",
      { type: "application/json" },
    );
    await expect(readProjectFile(file)).resolves.toEqual(snapshot);
  });

  it("rejects oversized files with a Chinese message", async () => {
    const file = new File(
      [new Uint8Array(MAX_PROJECT_FILE_BYTES + 1)],
      "huge.labflow.json",
    );
    await expect(readProjectFile(file)).rejects.toThrow(
      "项目文件超过 262144 字节（256 KB）上限",
    );
  });

  it("rejects malformed JSON with a Chinese message", async () => {
    const file = new File(["not-json"], "broken.labflow.json", {
      type: "application/json",
    });
    await expect(readProjectFile(file)).rejects.toThrow(
      "项目文件不是合法的 JSON。",
    );
  });
});

describe("downloadProjectSnapshot", () => {
  it("downloads the deterministic snapshot text with the derived filename", async () => {
    const snapshot = await validSnapshot();
    let captured: Blob | null = null;
    const anchors: Array<{
      href: string;
      download: string;
      rel: string;
      click: ReturnType<typeof vi.fn>;
      remove: ReturnType<typeof vi.fn>;
    }> = [];
    const appendChild = vi.fn();
    const doc = {
      createElement: () => {
        const anchor = {
          href: "",
          download: "",
          rel: "",
          click: vi.fn(),
          remove: vi.fn(),
        };
        anchors.push(anchor);
        return anchor;
      },
      body: { appendChild },
    } as unknown as Document;
    const createObjectURL = vi.fn((blob: Blob) => {
      captured = blob;
      return "blob:project";
    });
    const revokeObjectURL = vi.fn();

    const fileName = downloadProjectSnapshot(snapshot, {
      createObjectURL,
      revokeObjectURL,
      document: doc,
    });

    expect(fileName).toBe("labflow-experiment.labflow.json");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:project");
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(anchors).toHaveLength(1);
    expect(anchors[0].download).toBe(fileName);
    expect(anchors[0].href).toBe("blob:project");
    expect(anchors[0].click).toHaveBeenCalledTimes(1);
    expect(anchors[0].remove).toHaveBeenCalledTimes(1);

    expect(captured).not.toBeNull();
    const text = await readBlobText(captured as unknown as Blob);
    expect(text).toBe(serializeProjectSnapshot(snapshot));
  });
});
