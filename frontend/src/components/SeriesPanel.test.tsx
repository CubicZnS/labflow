import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFit,
  createSeries,
  type CsvImportResponse,
  type FitResponse,
  type SeriesResponse,
} from "../lib/api";
import {
  buildProjectSnapshot,
  downloadProjectSnapshot,
  serializeProjectSnapshot,
  sha256Hex,
  type ProjectSnapshotV1,
} from "../lib/projectSnapshot";
import { SeriesPanel } from "./SeriesPanel";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, createSeries: vi.fn(), createFit: vi.fn() };
});

vi.mock("../lib/projectSnapshot", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/projectSnapshot")>();
  return { ...actual, downloadProjectSnapshot: vi.fn() };
});

const createSeriesMock = vi.mocked(createSeries);
const createFitMock = vi.mocked(createFit);
const downloadProjectSnapshotMock = vi.mocked(downloadProjectSnapshot);

const encoder = new TextEncoder();
const fileBytes = encoder.encode(
  "time_s,absorbance,temperature,pressure,err\n0,0.012,280,100,0.001\n5,0.12,290,101,0.002\n10,0.241,300,102,0.003\n",
);
const datasetFile = new File([fileBytes], "experiment.csv", { type: "text/csv" });

const importResult: CsvImportResponse = {
  row_count: 3,
  columns: ["time_s", "absorbance", "temperature", "pressure", "err", "notes"],
  numeric_columns: ["time_s", "absorbance", "temperature", "pressure", "err"],
  column_stats: {},
  preview: [],
  warnings: ["内部警告不应写入项目文件"],
};

const mainSeries: SeriesResponse = {
  x_column: "time_s",
  y_column: "absorbance",
  x_unit: "s",
  y_unit: "mV",
  row_count: 3,
  pair_count: 3,
  skipped_count: 0,
  pairs: [
    { x: 0, y: 0.012 },
    { x: 5, y: 0.12 },
    { x: 10, y: 0.241 },
  ],
  x_stats: null,
  y_stats: null,
  warnings: ["内部警告不应写入项目文件"],
};

const temperatureSeries: SeriesResponse = {
  ...mainSeries,
  y_column: "temperature",
  pair_count: 3,
  pairs: [
    { x: 0, y: 280 },
    { x: 5, y: 290 },
    { x: 10, y: 300 },
  ],
};

const pressureSeries: SeriesResponse = {
  ...mainSeries,
  y_column: "pressure",
  pair_count: 2,
  pairs: [
    { x: 0, y: 100 },
    { x: 10, y: 102 },
  ],
};

const fitPayload: FitResponse = {
  x_column: "time_s",
  y_column: "absorbance",
  x_unit: "s",
  y_unit: "mV",
  row_count: 3,
  pair_count: 3,
  skipped_count: 0,
  degree: 2,
  coefficients: [0.002, 0.02, 0.012],
  equation: "y = 0.002x^2 + 0.02x + 0.012",
  r_squared: 0.999,
  pairs: mainSeries.pairs,
  fitted: [0.012, 0.12, 0.241],
  residuals: [0, 0, 0],
  rmse: 0,
  max_abs_residual: 0,
  warnings: ["内部警告不应写入项目文件"],
  uncertainty: {
    residual_dof: 0,
    standard_errors: null,
    confidence_intervals: null,
    condition_number: 2.5,
    ill_conditioned: false,
  },
  weighted: true,
  y_error_column: "err",
  y_error_unit: "mV",
  y_errors: [0.001, 0.002, 0.003],
  chi_squared: 1.2,
  reduced_chi_squared: 1.1,
};

function renderPanel() {
  return render(
    <SeriesPanel file={datasetFile} format="csv" result={importResult} />,
  );
}

async function generateMain() {
  fireEvent.click(screen.getByRole("button", { name: "生成配对数据" }));
  await screen.findByTestId("project-section");
  await screen.findByTestId("fit-section");
}

function projectFile(snapshot: ProjectSnapshotV1): File {
  return new File([serializeProjectSnapshot(snapshot)], "saved.labflow.json", {
    type: "application/json",
  });
}

function openProject(snapshot: ProjectSnapshotV1) {
  fireEvent.change(screen.getByTestId("open-project"), {
    target: { files: [projectFile(snapshot)] },
  });
}

async function buildSnapshot(
  overrides: Partial<Parameters<typeof buildProjectSnapshot>[0]> = {},
): Promise<ProjectSnapshotV1> {
  return buildProjectSnapshot({
    sourceFileName: "experiment.csv",
    format: "csv",
    data: fileBytes,
    rowCount: 3,
    numericColumns: importResult.numeric_columns,
    series: {
      xColumn: "time_s",
      yColumn: "absorbance",
      xUnit: "s",
      yUnit: "mV",
    },
    extraSeries: [],
    fit: null,
    chart: {
      title: "",
      showGrid: false,
      tickDensity: "standard",
      fontScale: "medium",
    },
    ...overrides,
  });
}

beforeEach(async () => {
  const nodeCrypto = await vi.importActual<{ webcrypto: Crypto }>(
    "node:crypto",
  );
  vi.stubGlobal("crypto", nodeCrypto.webcrypto);
  createSeriesMock.mockReset();
  createFitMock.mockReset();
  downloadProjectSnapshotMock.mockReset();
  downloadProjectSnapshotMock.mockReturnValue(
    "labflow-experiment.labflow.json",
  );
});

describe("SeriesPanel project snapshot", () => {
  it("saves the current configuration without any raw data or fit output", async () => {
    let savedSnapshot: ProjectSnapshotV1 | null = null;
    downloadProjectSnapshotMock.mockImplementation((snapshot) => {
      savedSnapshot = snapshot;
      return "labflow-experiment.labflow.json";
    });
    createSeriesMock
      .mockResolvedValueOnce(mainSeries)
      .mockResolvedValueOnce(temperatureSeries);
    createFitMock.mockResolvedValueOnce(fitPayload);
    renderPanel();

    expect(screen.queryByTestId("project-section")).not.toBeInTheDocument();
    await generateMain();

    fireEvent.change(screen.getByTestId("series-x-unit"), {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByTestId("series-y-unit"), {
      target: { value: "mV" },
    });
    fireEvent.change(screen.getByTestId("chart-title-input"), {
      target: { value: "吸收曲线" },
    });
    fireEvent.click(screen.getByTestId("chart-show-grid"));
    fireEvent.change(screen.getByTestId("chart-tick-density"), {
      target: { value: "dense" },
    });
    fireEvent.change(screen.getByTestId("chart-font-size"), {
      target: { value: "large" },
    });

    fireEvent.change(screen.getByTestId("extra-series-name"), {
      target: { value: "温度" },
    });
    fireEvent.click(screen.getByTestId("add-extra-series"));
    await waitFor(() =>
      expect(screen.getByTestId("extra-series-item")).toHaveTextContent("温度"),
    );

    fireEvent.change(screen.getByTestId("fit-degree-select"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByTestId("fit-error-select"), {
      target: { value: "err" },
    });
    fireEvent.change(screen.getByTestId("fit-error-unit-input"), {
      target: { value: "mV" },
    });
    fireEvent.click(screen.getByRole("button", { name: "运行拟合" }));
    await screen.findByTestId("fit-result");

    fireEvent.click(screen.getByTestId("save-project"));

    await waitFor(() =>
      expect(screen.getByTestId("project-status")).toHaveTextContent(
        "已保存 labflow-experiment.labflow.json",
      ),
    );
    expect(downloadProjectSnapshotMock).toHaveBeenCalledTimes(1);
    expect(savedSnapshot).not.toBeNull();
    const snapshot = savedSnapshot as unknown as ProjectSnapshotV1;
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.sourceFileName).toBe("experiment.csv");
    expect(snapshot.dataset.sizeBytes).toBe(fileBytes.byteLength);
    expect(snapshot.dataset.sha256).toBe(await sha256Hex(fileBytes));
    expect(snapshot.dataset.rowCount).toBe(3);
    expect(snapshot.dataset.numericColumns).toEqual(
      importResult.numeric_columns,
    );
    expect(snapshot.series).toEqual({
      xColumn: "time_s",
      yColumn: "absorbance",
      xUnit: "s",
      yUnit: "mV",
    });
    expect(snapshot.extraSeries).toEqual([
      { yColumn: "temperature", name: "温度" },
    ]);
    expect(snapshot.fit).toEqual({
      degree: 2,
      yErrorColumn: "err",
      yErrorUnit: "mV",
    });
    expect(snapshot.chart).toEqual({
      title: "吸收曲线",
      showGrid: true,
      tickDensity: "dense",
      fontScale: "large",
    });

    const text = serializeProjectSnapshot(snapshot);
    expect(text).not.toContain("0.012");
    expect(text).not.toContain("pairs");
    expect(text).not.toContain("coefficients");
    expect(text).not.toContain("residuals");
    expect(text).not.toContain("内部警告");
    expect(text).not.toContain("notes");
  });

  it("shows a Chinese alert and keeps the analysis when saving fails", async () => {
    downloadProjectSnapshotMock.mockImplementation(() => {
      throw new Error("磁盘已满");
    });
    createSeriesMock.mockResolvedValueOnce(mainSeries);
    renderPanel();
    await generateMain();

    fireEvent.click(screen.getByTestId("save-project"));

    expect(await screen.findByTestId("project-error")).toHaveTextContent(
      "保存项目失败：磁盘已满",
    );
    expect(screen.getByTestId("project-error")).toHaveAttribute("role", "alert");
    expect(screen.getByTestId("series-pair-count")).toHaveTextContent("3");
    expect(screen.getByTestId("fit-section")).toBeInTheDocument();
    expect(screen.getByTestId("save-project")).toBeEnabled();
  });

  it("does not change any analysis state when the project file is invalid", async () => {
    createSeriesMock.mockResolvedValueOnce(mainSeries);
    renderPanel();
    await generateMain();
    fireEvent.change(screen.getByTestId("chart-title-input"), {
      target: { value: "保留标题" },
    });

    fireEvent.change(screen.getByTestId("open-project"), {
      target: {
        files: [new File(["not-json"], "broken.labflow.json")],
      },
    });

    expect(await screen.findByTestId("project-error")).toHaveTextContent(
      "无法打开项目：项目文件不是合法的 JSON。",
    );
    expect(screen.getByTestId("series-pair-count")).toHaveTextContent("3");
    expect(screen.getByTestId("chart-title-input")).toHaveValue("保留标题");
    expect(createSeriesMock).toHaveBeenCalledTimes(1);
    expect(createFitMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("extra-series-item")).not.toBeInTheDocument();
  });

  it("rejects a project saved from a different dataset without making requests", async () => {
    createSeriesMock.mockResolvedValueOnce(mainSeries);
    renderPanel();
    await generateMain();
    const otherSnapshot = await buildProjectSnapshot({
      sourceFileName: "experiment.csv",
      format: "csv",
      data: encoder.encode("different dataset"),
      rowCount: 3,
      numericColumns: importResult.numeric_columns,
      series: {
        xColumn: "time_s",
        yColumn: "absorbance",
        xUnit: "s",
        yUnit: "mV",
      },
      extraSeries: [],
      fit: null,
      chart: {
        title: "",
        showGrid: false,
        tickDensity: "standard",
        fontScale: "medium",
      },
    });

    openProject(otherSnapshot);

    expect(await screen.findByTestId("project-error")).toHaveTextContent(
      "项目文件与当前数据集不匹配",
    );
    expect(screen.getByTestId("project-error")).toHaveTextContent(
      "请重新导入保存项目时的原始数据文件",
    );
    expect(createSeriesMock).toHaveBeenCalledTimes(1);
    expect(createFitMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("series-pair-count")).toHaveTextContent("3");
  });

  it("restores every setting and reruns main, extras, and fit exactly once in order", async () => {
    createSeriesMock
      .mockResolvedValueOnce(mainSeries)
      .mockResolvedValueOnce(mainSeries)
      .mockResolvedValueOnce(temperatureSeries)
      .mockResolvedValueOnce(pressureSeries);
    createFitMock.mockResolvedValueOnce(fitPayload);
    const snapshot = await buildSnapshot({
      extraSeries: [
        { yColumn: "temperature", name: "温度序列" },
        { yColumn: "pressure", name: "压力" },
      ],
      fit: { degree: 2, yErrorColumn: "err", yErrorUnit: "mV" },
      chart: {
        title: "项目标题",
        showGrid: true,
        tickDensity: "dense",
        fontScale: "large",
      },
    });
    renderPanel();
    await generateMain();

    openProject(snapshot);

    expect(await screen.findByText("已打开项目：experiment.csv")).toBeInTheDocument();
    expect(createSeriesMock).toHaveBeenCalledTimes(4);
    expect(createFitMock).toHaveBeenCalledTimes(1);

    const seriesSelections = createSeriesMock.mock.calls.map(
      ([, , selection]) => selection,
    );
    expect(seriesSelections[1]).toMatchObject({
      xColumn: "time_s",
      yColumn: "absorbance",
      xUnit: "s",
      yUnit: "mV",
    });
    expect(seriesSelections[2]).toMatchObject({
      xColumn: "time_s",
      yColumn: "temperature",
      xUnit: "s",
      yUnit: "mV",
    });
    expect(seriesSelections[3]).toMatchObject({
      xColumn: "time_s",
      yColumn: "pressure",
      xUnit: "s",
      yUnit: "mV",
    });
    expect(createFitMock.mock.calls[0][2]).toMatchObject({
      xColumn: "time_s",
      yColumn: "absorbance",
      degree: 2,
      yErrorColumn: "err",
      yErrorUnit: "mV",
    });

    expect(screen.getByTestId("series-x-select")).toHaveValue("time_s");
    expect(screen.getByTestId("series-y-select")).toHaveValue("absorbance");
    expect(screen.getByTestId("series-x-unit")).toHaveValue("s");
    expect(screen.getByTestId("series-y-unit")).toHaveValue("mV");
    expect(screen.getByTestId("chart-title-input")).toHaveValue("项目标题");
    expect(screen.getByTestId("chart-show-grid")).toBeChecked();
    expect(screen.getByTestId("chart-tick-density")).toHaveValue("dense");
    expect(screen.getByTestId("chart-font-size")).toHaveValue("large");
    expect(screen.getByTestId("fit-degree-select")).toHaveValue("2");
    expect(screen.getByTestId("fit-error-select")).toHaveValue("err");
    expect(screen.getByTestId("fit-error-unit-input")).toHaveValue("mV");
    expect(screen.getByTestId("fit-result")).toBeInTheDocument();
    expect(screen.getByTestId("fit-curve")).toBeInTheDocument();
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-series-count",
      "3",
    );
    expect(screen.getAllByTestId("extra-series-item")).toHaveLength(2);
    expect(screen.getAllByTestId("extra-series-item")[0]).toHaveTextContent(
      "温度序列",
    );
    expect(screen.getAllByTestId("extra-series-item")[1]).toHaveTextContent(
      "压力",
    );
  });

  it("stops on a failing extra series, keeps completed steps, and allows retry", async () => {
    createSeriesMock
      .mockResolvedValueOnce(mainSeries)
      .mockResolvedValueOnce(mainSeries)
      .mockResolvedValueOnce(temperatureSeries)
      .mockRejectedValueOnce(new Error("筛选后不足两个有效配对"));
    const snapshot = await buildSnapshot({
      extraSeries: [
        { yColumn: "temperature", name: "温度序列" },
        { yColumn: "pressure", name: "压力" },
      ],
      fit: { degree: 2, yErrorColumn: "err", yErrorUnit: "mV" },
    });
    renderPanel();
    await generateMain();

    openProject(snapshot);

    expect(await screen.findByTestId("project-error")).toHaveTextContent(
      "打开项目失败：追加系列「压力」配对失败",
    );
    expect(screen.getByTestId("project-error")).toHaveTextContent(
      "筛选后不足两个有效配对",
    );
    expect(screen.getByTestId("project-error")).toHaveAttribute("role", "alert");
    expect(createFitMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("fit-section")).toBeInTheDocument();
    expect(screen.getByTestId("scatter-plot")).toHaveAttribute(
      "data-series-count",
      "2",
    );
    expect(screen.getAllByTestId("extra-series-item")).toHaveLength(1);
    expect(screen.getByTestId("extra-series-item")).toHaveTextContent(
      "温度序列",
    );
    expect(screen.getByTestId("open-project")).toBeEnabled();
    expect(screen.getByTestId("save-project")).toBeEnabled();
  });

  it("locks conflicting controls during a project rerun and ignores extra open attempts", async () => {
    let resolveRerunExtra: ((response: SeriesResponse) => void) | undefined;
    createSeriesMock
      .mockResolvedValueOnce(mainSeries)
      .mockResolvedValueOnce(mainSeries)
      .mockImplementationOnce(
        () =>
          new Promise<SeriesResponse>((resolve) => {
            resolveRerunExtra = resolve;
          }),
      );
    const snapshot = await buildSnapshot({
      extraSeries: [{ yColumn: "temperature", name: "温度序列" }],
    });
    renderPanel();
    await generateMain();

    openProject(snapshot);

    expect(
      await screen.findByText("正在重跑：追加系列「温度序列」…"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("save-project")).toBeDisabled();
    expect(screen.getByTestId("open-project")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /配对数据/ }),
    ).toBeDisabled();
    expect(screen.getByTestId("add-extra-series")).toBeDisabled();
    expect(screen.getByRole("button", { name: "运行拟合" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /配对数据/ }));
    fireEvent.click(screen.getByTestId("add-extra-series"));
    fireEvent.change(screen.getByTestId("open-project"), {
      target: { files: [projectFile(snapshot)] },
    });
    expect(createSeriesMock).toHaveBeenCalledTimes(3);

    resolveRerunExtra?.(temperatureSeries);

    expect(
      await screen.findByText("已打开项目：experiment.csv"),
    ).toBeInTheDocument();
    expect(createSeriesMock).toHaveBeenCalledTimes(3);
    expect(createFitMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("save-project")).toBeEnabled();
  });
});
