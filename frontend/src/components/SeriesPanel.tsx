import { useId, useRef, useState, type ChangeEvent } from "react";
import {
  createFit,
  createSeries,
  type CsvImportResponse,
  type DatasetFormat,
  type FitDegree,
  type FitResponse,
  type SeriesResponse,
} from "../lib/api";
import {
  buildProjectSnapshot,
  datasetMatchesSnapshot,
  downloadProjectSnapshot,
  readFileBytes,
  readProjectFile,
  sha256Hex,
  type PngScale,
  type ProjectSnapshotV2,
} from "../lib/projectSnapshot";
import { FitPanel, type FitState } from "./FitPanel";
import {
  ScatterPlot,
  type FontScale,
  type TickDensity,
} from "./ScatterPlot";

type SeriesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: SeriesResponse }
  | { status: "error"; message: string };

type ExtraSeries = {
  id: string;
  name: string;
  result: SeriesResponse;
};

const UNIT_MAX_LENGTH = 32;
const TITLE_MAX_LENGTH = 80;
const PROJECT_NAME_MAX_LENGTH = 80;
const PROJECT_NOTE_MAX_LENGTH = 500;
const SERIES_NAME_MAX_LENGTH = 40;
const MAX_SERIES = 4;
const PREVIEW_LIMIT = 10;

function unitHeader(label: string, unit: string | null): string {
  return unit ? `${label} (${unit})` : label;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

function UnitSummary({ result }: { result: SeriesResponse }) {
  return (
    <p className="mt-1 text-sm text-slate-600" data-testid="series-units">
      X 单位：{result.x_unit ?? "未标注"} · Y 单位：{result.y_unit ?? "未标注"}
    </p>
  );
}

function PairPreview({ result }: { result: SeriesResponse }) {
  const rows = result.pairs.slice(0, PREVIEW_LIMIT);
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
      <table
        className="min-w-full divide-y divide-slate-200 text-left text-sm"
        data-testid="series-preview-table"
      >
        <caption className="sr-only">X/Y 配对数据预览</caption>
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
              {unitHeader("X", result.x_unit)}
            </th>
            <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
              {unitHeader("Y", result.y_unit)}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((pair, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap px-4 py-2 text-slate-700">{pair.x}</td>
              <td className="whitespace-nowrap px-4 py-2 text-slate-700">{pair.y}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SeriesPanel({
  file,
  format,
  result,
}: {
  file: File;
  format: DatasetFormat;
  result: CsvImportResponse;
}) {
  const xSelectId = useId();
  const ySelectId = useId();
  const xUnitId = useId();
  const yUnitId = useId();
  const chartTitleId = useId();
  const tickDensityId = useId();
  const fontScaleId = useId();
  const showGridId = useId();
  const extraYSelectId = useId();
  const extraNameId = useId();
  const projectNameId = useId();
  const projectNoteId = useId();
  const pngScaleId = useId();

  const numericColumns = result.numeric_columns;
  const enoughColumns = numericColumns.length >= 2;

  const [xColumn, setXColumn] = useState(numericColumns[0] ?? "");
  const [yColumn, setYColumn] = useState(
    numericColumns[1] ?? numericColumns[0] ?? "",
  );
  const [xUnit, setXUnit] = useState("");
  const [yUnit, setYUnit] = useState("");
  const [seriesState, setSeriesState] = useState<SeriesState>({ status: "idle" });
  const [chartTitle, setChartTitle] = useState("");
  const [showGrid, setShowGrid] = useState(false);
  const [tickDensity, setTickDensity] = useState<TickDensity>("standard");
  const [fontScale, setFontScale] = useState<FontScale>("medium");
  const [extraSeries, setExtraSeries] = useState<ExtraSeries[]>([]);
  const [extraYColumn, setExtraYColumn] = useState("");
  const [extraName, setExtraName] = useState("");
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraError, setExtraError] = useState<string | null>(null);
  const [fitDegree, setFitDegree] = useState<FitDegree>(1);
  const [fitErrorColumn, setFitErrorColumn] = useState("");
  const [fitErrorUnit, setFitErrorUnit] = useState("");
  const [fitState, setFitState] = useState<FitState>({ status: "idle" });
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectOpening, setProjectOpening] = useState(false);
  const [projectRerunning, setProjectRerunning] = useState(false);
  const [projectStatus, setProjectStatus] = useState("");
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectNote, setProjectNote] = useState("");
  const [pngScale, setPngScale] = useState<PngScale>(2);
  const seriesRunRef = useRef(0);
  const extraCounterRef = useRef(0);
  const extraLoadingRef = useRef(false);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const projectOpenRef = useRef(false);

  const isLoading = seriesState.status === "loading";
  const projectBusy = projectSaving || projectOpening || projectRerunning;
  const sameSelection = xColumn !== "" && xColumn === yColumn;
  const canSubmit = enoughColumns && !sameSelection && !isLoading && !projectBusy;

  const mainResult =
    seriesState.status === "success" ? seriesState.result : null;
  const fitResult = fitState.status === "success" ? fitState.result : null;
  const canSaveProject = mainResult !== null && !projectBusy;
  const canOpenProject =
    !projectBusy && !isLoading && !extraLoading && fitState.status !== "loading";
  const usedColumns = new Set<string>([
    ...(mainResult ? [mainResult.x_column, mainResult.y_column] : []),
    ...extraSeries.map((series) => series.result.y_column),
  ]);
  const availableColumns = numericColumns.filter(
    (column) => !usedColumns.has(column),
  );
  const selectedExtraY = availableColumns.includes(extraYColumn)
    ? extraYColumn
    : (availableColumns[0] ?? "");
  const displayedExtraName = extraName === "" ? selectedExtraY : extraName;
  const atSeriesLimit = 1 + extraSeries.length >= MAX_SERIES;
  const canAddExtra =
    mainResult !== null &&
    !extraLoading &&
    !atSeriesLimit &&
    availableColumns.length > 0 &&
    !projectBusy;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    seriesRunRef.current += 1;
    const runId = seriesRunRef.current;
    setSeriesState({ status: "loading" });
    setFitState({ status: "idle" });
    setFitDegree(1);
    setFitErrorColumn("");
    setFitErrorUnit("");
    setExtraSeries([]);
    setExtraYColumn("");
    setExtraName("");
    setExtraError(null);
    setProjectStatus("");
    setProjectError(null);
    try {
      const series = await createSeries(file, format, {
        xColumn,
        yColumn,
        xUnit,
        yUnit,
      });
      if (seriesRunRef.current !== runId) {
        return;
      }
      setSeriesState({ status: "success", result: series });
      setFitState({ status: "idle" });
    } catch (error) {
      if (seriesRunRef.current !== runId) {
        return;
      }
      setSeriesState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "生成配对数据失败，请稍后重试。",
      });
    }
  }

  async function handleAddExtra() {
    if (
      !mainResult ||
      extraLoadingRef.current ||
      atSeriesLimit ||
      availableColumns.length === 0 ||
      projectBusy
    ) {
      return;
    }
    const yColumnToAdd = selectedExtraY;
    if (!yColumnToAdd || usedColumns.has(yColumnToAdd)) {
      setExtraError("该 Y 列已被使用，请选择其他数值列。");
      return;
    }
    const name = (extraName.trim() || yColumnToAdd).slice(
      0,
      SERIES_NAME_MAX_LENGTH,
    );
    const runId = seriesRunRef.current;
    extraLoadingRef.current = true;
    setExtraLoading(true);
    setExtraError(null);
    try {
      const series = await createSeries(file, format, {
        xColumn: mainResult.x_column,
        yColumn: yColumnToAdd,
        xUnit: mainResult.x_unit ?? "",
        yUnit: mainResult.y_unit ?? "",
      });
      if (seriesRunRef.current !== runId) {
        return;
      }
      extraCounterRef.current += 1;
      setExtraSeries((current) => [
        ...current,
        {
          id: `extra-${extraCounterRef.current}`,
          name: name || yColumnToAdd,
          result: series,
        },
      ]);
      setExtraName("");
      setExtraYColumn("");
    } catch (error) {
      if (seriesRunRef.current !== runId) {
        return;
      }
      setExtraError(
        `添加系列失败：${
          error instanceof Error ? error.message : "请稍后重试。"
        }`,
      );
    } finally {
      extraLoadingRef.current = false;
      setExtraLoading(false);
    }
  }

  function handleRemoveExtra(id: string) {
    setExtraSeries((current) => current.filter((series) => series.id !== id));
    setExtraError(null);
  }

  async function requestFit(
    series: SeriesResponse,
    settings: { degree: FitDegree; errorColumn: string; errorUnit: string },
    runId: number,
  ): Promise<FitResponse> {
    setFitState({ status: "loading" });
    try {
      const result = await createFit(file, format, {
        xColumn: series.x_column,
        yColumn: series.y_column,
        xUnit: series.x_unit ?? undefined,
        yUnit: series.y_unit ?? undefined,
        degree: settings.degree,
        yErrorColumn: settings.errorColumn || undefined,
        yErrorUnit: settings.errorColumn ? settings.errorUnit : undefined,
      });
      if (seriesRunRef.current === runId) {
        setFitState({ status: "success", result });
      }
      return result;
    } catch (error) {
      if (seriesRunRef.current === runId) {
        setFitState({
          status: "error",
          message: errorMessage(error, "拟合失败，请稍后重试。"),
        });
      }
      throw error;
    }
  }

  async function handleRunFitClick() {
    if (!mainResult || projectBusy || fitState.status === "loading") {
      return;
    }
    const runId = seriesRunRef.current;
    try {
      await requestFit(
        mainResult,
        {
          degree: fitDegree,
          errorColumn: fitErrorColumn,
          errorUnit: fitErrorUnit,
        },
        runId,
      );
    } catch {
      // FitPanel 已显示中文错误。
    }
  }

  async function handleSaveProject() {
    if (!mainResult || !canSaveProject) {
      return;
    }
    setProjectSaving(true);
    setProjectStatus("正在保存项目…");
    setProjectError(null);
    try {
      const data = await readFileBytes(file);
      const snapshot = await buildProjectSnapshot({
        sourceFileName: file.name,
        format,
        data,
        rowCount: result.row_count,
        numericColumns: result.numeric_columns,
        series: {
          xColumn: mainResult.x_column,
          yColumn: mainResult.y_column,
          xUnit: mainResult.x_unit ?? "",
          yUnit: mainResult.y_unit ?? "",
        },
        extraSeries: extraSeries.map((series) => ({
          yColumn: series.result.y_column,
          name: series.name,
        })),
        fit:
          fitState.status === "success"
            ? {
                degree: fitDegree,
                yErrorColumn: fitErrorColumn || null,
                yErrorUnit: fitErrorColumn ? fitErrorUnit : "",
              }
            : null,
        chart: {
          title: chartTitle,
          showGrid,
          tickDensity,
          fontScale,
        },
        metadata: {
          name: projectName,
          note: projectNote,
        },
        export: {
          pngScale,
        },
      });
      const fileName = downloadProjectSnapshot(snapshot);
      setProjectStatus(`已保存 ${fileName}`);
    } catch (error) {
      setProjectStatus("");
      setProjectError(
        `保存项目失败：${errorMessage(error, "请稍后重试。")}`,
      );
    } finally {
      setProjectSaving(false);
    }
  }

  async function rerunProject(
    snapshot: ProjectSnapshotV2,
    runId: number,
  ): Promise<void> {
    setXColumn(snapshot.series.xColumn);
    setYColumn(snapshot.series.yColumn);
    setXUnit(snapshot.series.xUnit);
    setYUnit(snapshot.series.yUnit);
    setChartTitle(snapshot.chart.title);
    setShowGrid(snapshot.chart.showGrid);
    setTickDensity(snapshot.chart.tickDensity);
    setFontScale(snapshot.chart.fontScale);
    setProjectName(snapshot.metadata.name);
    setProjectNote(snapshot.metadata.note);
    setPngScale(snapshot.export.pngScale);
    setFitDegree(snapshot.fit?.degree ?? 1);
    setFitErrorColumn(snapshot.fit?.yErrorColumn ?? "");
    setFitErrorUnit(snapshot.fit?.yErrorUnit ?? "");
    setFitState({ status: "idle" });
    setExtraSeries([]);
    setExtraYColumn("");
    setExtraName("");
    setExtraError(null);
    setProjectError(null);
    setProjectStatus("正在重跑：主系列配对…");
    setSeriesState({ status: "loading" });

    let mainSeries: SeriesResponse;
    try {
      mainSeries = await createSeries(file, format, {
        xColumn: snapshot.series.xColumn,
        yColumn: snapshot.series.yColumn,
        xUnit: snapshot.series.xUnit,
        yUnit: snapshot.series.yUnit,
      });
    } catch (error) {
      if (seriesRunRef.current !== runId) {
        return;
      }
      const message = errorMessage(error, "请稍后重试。");
      setSeriesState({
        status: "error",
        message: `主系列配对失败：${message}`,
      });
      setProjectStatus("");
      setProjectError(`打开项目失败：主系列配对失败：${message}`);
      return;
    }
    if (seriesRunRef.current !== runId) {
      return;
    }
    setSeriesState({ status: "success", result: mainSeries });

    const added: ExtraSeries[] = [];
    for (const extra of snapshot.extraSeries) {
      setProjectStatus(`正在重跑：追加系列「${extra.name}」…`);
      try {
        const series = await createSeries(file, format, {
          xColumn: mainSeries.x_column,
          yColumn: extra.yColumn,
          xUnit: mainSeries.x_unit ?? snapshot.series.xUnit,
          yUnit: mainSeries.y_unit ?? snapshot.series.yUnit,
        });
        if (seriesRunRef.current !== runId) {
          return;
        }
        extraCounterRef.current += 1;
        added.push({
          id: `extra-${extraCounterRef.current}`,
          name: extra.name,
          result: series,
        });
        setExtraSeries([...added]);
      } catch (error) {
        if (seriesRunRef.current !== runId) {
          return;
        }
        const message = errorMessage(error, "请稍后重试。");
        setExtraError(`追加系列「${extra.name}」配对失败：${message}`);
        setProjectStatus("");
        setProjectError(
          `打开项目失败：追加系列「${extra.name}」配对失败：${message}`,
        );
        return;
      }
    }

    if (snapshot.fit) {
      setProjectStatus("正在重跑：拟合…");
      try {
        await requestFit(
          mainSeries,
          {
            degree: snapshot.fit.degree,
            errorColumn: snapshot.fit.yErrorColumn ?? "",
            errorUnit: snapshot.fit.yErrorUnit,
          },
          runId,
        );
      } catch (error) {
        if (seriesRunRef.current !== runId) {
          return;
        }
        setProjectStatus("");
        setProjectError(
          `打开项目失败：拟合失败：${errorMessage(error, "请稍后重试。")}`,
        );
        return;
      }
    }

    if (seriesRunRef.current !== runId) {
      return;
    }
    setProjectStatus(`已打开项目：${snapshot.sourceFileName}`);
  }

  async function handleOpenProject(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selected = input.files?.[0] ?? null;
    input.value = "";
    if (!selected || projectBusy || projectOpenRef.current) {
      return;
    }
    projectOpenRef.current = true;
    setProjectOpening(true);
    setProjectRerunning(false);
    setProjectStatus("正在读取项目…");
    setProjectError(null);
    try {
      let snapshot: ProjectSnapshotV2;
      try {
        snapshot = await readProjectFile(selected);
      } catch (error) {
        setProjectStatus("");
        setProjectError(
          `无法打开项目：${errorMessage(error, "项目文件无效。")}`,
        );
        return;
      }

      let currentSha: string;
      try {
        currentSha = await sha256Hex(await readFileBytes(file));
      } catch (error) {
        setProjectStatus("");
        setProjectError(
          `无法读取当前数据集指纹：${errorMessage(error, "请稍后重试。")}`,
        );
        return;
      }

      const matches = datasetMatchesSnapshot(snapshot, {
        format,
        sizeBytes: file.size,
        sha256: currentSha,
        rowCount: result.row_count,
        numericColumns: result.numeric_columns,
      });
      if (!matches) {
        setProjectStatus("");
        setProjectError(
          "项目文件与当前数据集不匹配（SHA-256、格式、大小、行数或数值列不一致）。请重新导入保存项目时的原始数据文件后再打开本项目。",
        );
        return;
      }

      setProjectOpening(false);
      setProjectRerunning(true);
      seriesRunRef.current += 1;
      await rerunProject(snapshot, seriesRunRef.current);
    } finally {
      projectOpenRef.current = false;
      setProjectOpening(false);
      setProjectRerunning(false);
    }
  }

  return (
    <div
      className="mt-5 rounded-xl border border-slate-200 p-4"
      data-testid="series-section"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-ink">X/Y 配对与单位</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            选择两个数值列并可选标注单位，生成后续拟合与绘图使用的配对数据。
          </p>
        </div>
      </div>

      {!enoughColumns ? (
        <p
          className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-sm leading-6 text-slate-600"
          data-testid="series-insufficient"
        >
          至少需要两个数值列才能生成 X/Y 配对数据。请重新上传包含两个及以上数值列的数据集。
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={xSelectId} className="block text-xs text-slate-500">
            X 列
          </label>
          <select
            id={xSelectId}
            value={xColumn}
            disabled={!enoughColumns || isLoading}
            onChange={(event) => setXColumn(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            data-testid="series-x-select"
          >
            {numericColumns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>

          <label htmlFor={xUnitId} className="mt-3 block text-xs text-slate-500">
            X 单位（可选）
          </label>
          <input
            id={xUnitId}
            type="text"
            value={xUnit}
            maxLength={UNIT_MAX_LENGTH}
            disabled={!enoughColumns || isLoading}
            onChange={(event) => setXUnit(event.target.value)}
            placeholder="例如 s、mV"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            data-testid="series-x-unit"
          />
        </div>

        <div>
          <label htmlFor={ySelectId} className="block text-xs text-slate-500">
            Y 列
          </label>
          <select
            id={ySelectId}
            value={yColumn}
            disabled={!enoughColumns || isLoading}
            onChange={(event) => setYColumn(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            data-testid="series-y-select"
          >
            {numericColumns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>

          <label htmlFor={yUnitId} className="mt-3 block text-xs text-slate-500">
            Y 单位（可选）
          </label>
          <input
            id={yUnitId}
            type="text"
            value={yUnit}
            maxLength={UNIT_MAX_LENGTH}
            disabled={!enoughColumns || isLoading}
            onChange={(event) => setYUnit(event.target.value)}
            placeholder="例如 s、mV"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            data-testid="series-y-unit"
          />
        </div>
      </div>

      {enoughColumns && sameSelection ? (
        <p className="mt-3 text-xs text-amber-700" data-testid="series-same-column">
          X 与 Y 需要选择不同的列。
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-4 w-full rounded-xl bg-cyan px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        {isLoading ? "正在生成配对数据…" : "生成配对数据"}
      </button>

      {seriesState.status === "error" ? (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
        >
          <p className="text-sm font-semibold text-rose-700">生成配对数据失败</p>
          <p className="mt-1 text-sm leading-6 text-rose-700" data-testid="series-error">
            {seriesState.message}
          </p>
        </div>
      ) : null}

      {seriesState.status === "success" ||
      projectOpening ||
      projectRerunning ||
      projectError !== null ? (
        <div
          className="mt-4 rounded-xl border border-slate-200 bg-white p-4"
          data-testid="project-section"
          aria-busy={projectBusy}
        >
          <h5 className="text-sm font-semibold text-ink">项目</h5>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            将当前列选择、单位、追加系列、拟合设置与图表样式保存为本地
            .labflow.json 项目文件。项目文件只包含数据指纹、项目元数据与导出设置，
            不包含原始数据行、配对点、拟合系数、警告详情或任何凭据；重新导入同一数据集后可打开项目并一键重跑。
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={projectNameId}
                className="block text-xs text-slate-500"
              >
                项目名称（最多 {PROJECT_NAME_MAX_LENGTH} 个字符）
              </label>
              <input
                id={projectNameId}
                type="text"
                value={projectName}
                maxLength={PROJECT_NAME_MAX_LENGTH}
                disabled={projectBusy}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="可选，仅保存到项目文件"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                data-testid="project-name-input"
              />
            </div>
            <div>
              <label
                htmlFor={pngScaleId}
                className="block text-xs text-slate-500"
              >
                PNG 导出倍率
              </label>
              <select
                id={pngScaleId}
                value={pngScale}
                disabled={projectBusy}
                onChange={(event) =>
                  setPngScale(Number(event.target.value) as PngScale)
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                data-testid="png-scale-select"
              >
                <option value="1">1×</option>
                <option value="2">2×</option>
                <option value="3">3×</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor={projectNoteId}
                className="block text-xs text-slate-500"
              >
                项目备注（最多 {PROJECT_NOTE_MAX_LENGTH} 个字符）
              </label>
              <textarea
                id={projectNoteId}
                value={projectNote}
                maxLength={PROJECT_NOTE_MAX_LENGTH}
                disabled={projectBusy}
                onChange={(event) => setProjectNote(event.target.value)}
                rows={3}
                placeholder="可选，仅保存到项目文件"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                data-testid="project-note-input"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleSaveProject()}
              disabled={!canSaveProject}
              className="rounded-xl bg-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              data-testid="save-project"
            >
              {projectSaving ? "正在保存…" : "保存项目"}
            </button>
            <button
              type="button"
              onClick={() => projectFileInputRef.current?.click()}
              disabled={!canOpenProject}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="open-project-button"
            >
              打开项目
            </button>
            <input
              ref={projectFileInputRef}
              type="file"
              accept=".json,.labflow.json,application/json"
              disabled={!canOpenProject}
              onChange={(event) => void handleOpenProject(event)}
              className="sr-only"
              data-testid="open-project"
            />
          </div>
          <p
            className="mt-2 text-xs text-slate-500"
            role="status"
            aria-live="polite"
            data-testid="project-status"
          >
            {projectStatus || "保存后可随时重新打开并重跑当前分析配置。"}
          </p>
          {projectError ? (
            <p
              role="alert"
              className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              data-testid="project-error"
            >
              {projectError}
            </p>
          ) : null}
        </div>
      ) : null}

      {seriesState.status === "success" ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">有效配对数</dt>
              <dd
                className="mt-1 text-lg font-semibold text-ink"
                data-testid="series-pair-count"
              >
                {seriesState.result.pair_count}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">跳过行数</dt>
              <dd
                className="mt-1 text-lg font-semibold text-ink"
                data-testid="series-skipped-count"
              >
                {seriesState.result.skipped_count}
              </dd>
            </div>
          </dl>
          <UnitSummary result={seriesState.result} />
          <div
            className="mt-4 rounded-xl border border-slate-200 bg-white p-4"
            data-testid="chart-style-controls"
          >
            <h5 className="text-sm font-semibold text-ink">图表样式</h5>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              标题、网格、刻度密度与字号只影响图表显示，不改变数据或重新请求配对结果。
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor={chartTitleId}
                  className="block text-xs text-slate-500"
                >
                  图表标题
                </label>
                <input
                  id={chartTitleId}
                  type="text"
                  value={chartTitle}
                  maxLength={TITLE_MAX_LENGTH}
                  onChange={(event) => setChartTitle(event.target.value)}
                  placeholder="可选，例如 吸光度随时间变化"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
                  data-testid="chart-title-input"
                />
              </div>

              <div>
                <label
                  htmlFor={tickDensityId}
                  className="block text-xs text-slate-500"
                >
                  刻度密度
                </label>
                <select
                  id={tickDensityId}
                  value={tickDensity}
                  onChange={(event) =>
                    setTickDensity(event.target.value as TickDensity)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
                  data-testid="chart-tick-density"
                >
                  <option value="sparse">稀疏（每轴 3–4 个刻度）</option>
                  <option value="standard">标准（每轴 4–6 个刻度）</option>
                  <option value="dense">密集（每轴 6–9 个刻度）</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={fontScaleId}
                  className="block text-xs text-slate-500"
                >
                  字号
                </label>
                <select
                  id={fontScaleId}
                  value={fontScale}
                  onChange={(event) =>
                    setFontScale(event.target.value as FontScale)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
                  data-testid="chart-font-size"
                >
                  <option value="small">小</option>
                  <option value="medium">中</option>
                  <option value="large">大</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor={showGridId}
                  className="inline-flex items-center gap-2 text-sm text-ink"
                >
                  <input
                    id={showGridId}
                    type="checkbox"
                    checked={showGrid}
                    onChange={(event) => setShowGrid(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan focus:ring-cyan/30"
                    data-testid="chart-show-grid"
                  />
                  显示网格
                </label>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  默认关闭；开启后以虚线在刻度位置绘制参考线，与坐标轴用线型区分。
                </p>
              </div>
            </div>
          </div>

          <div
            className="mt-4 rounded-xl border border-slate-200 bg-white p-4"
            data-testid="multi-series-controls"
          >
            <h5 className="text-sm font-semibold text-ink">多系列叠加</h5>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              所有叠加系列共用当前 X/Y 单位与 X 列。最多支持 4 个系列（主系列 + 3
              个追加系列）；主系列与已追加系列使用过的 Y 列不会出现在下拉框中。
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={extraYSelectId}
                  className="block text-xs text-slate-500"
                >
                  Y 列
                </label>
                <select
                  id={extraYSelectId}
                  value={selectedExtraY}
                  disabled={
                    extraLoading || atSeriesLimit || availableColumns.length === 0
                  }
                  onChange={(event) => {
                    setExtraYColumn(event.target.value);
                    setExtraName("");
                    setExtraError(null);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  data-testid="extra-series-y-select"
                >
                  {availableColumns.length === 0 ? (
                    <option value="">无可用数值列</option>
                  ) : (
                    availableColumns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor={extraNameId}
                  className="block text-xs text-slate-500"
                >
                  系列名称（最多 {SERIES_NAME_MAX_LENGTH} 字符）
                </label>
                <input
                  id={extraNameId}
                  type="text"
                  value={displayedExtraName}
                  maxLength={SERIES_NAME_MAX_LENGTH}
                  disabled={
                    extraLoading || atSeriesLimit || availableColumns.length === 0
                  }
                  onChange={(event) => setExtraName(event.target.value)}
                  placeholder="默认使用所选 Y 列名"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  data-testid="extra-series-name"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddExtra}
              disabled={!canAddExtra}
              className="mt-3 w-full rounded-xl bg-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              data-testid="add-extra-series"
            >
              {extraLoading ? "正在添加…" : "添加系列"}
            </button>

            {atSeriesLimit ? (
              <p
                className="mt-2 text-xs text-amber-700"
                data-testid="series-limit-hint"
              >
                已达到 4 个系列上限，请先移除已有追加系列后再添加。
              </p>
            ) : null}
            {!atSeriesLimit && availableColumns.length === 0 ? (
              <p
                className="mt-2 text-xs text-amber-700"
                data-testid="series-no-columns"
              >
                所有数值列均已用于当前系列，暂无可用于叠加的 Y 列。
              </p>
            ) : null}

            {extraError ? (
              <p
                role="alert"
                className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                data-testid="extra-series-error"
              >
                {extraError}
              </p>
            ) : null}

            {extraSeries.length > 0 ? (
              <ul className="mt-3 space-y-2" data-testid="extra-series-list">
                {extraSeries.map((series) => (
                  <li
                    key={series.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    data-testid="extra-series-item"
                    data-series-id={series.id}
                  >
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{series.name}</span>
                      <span className="text-xs text-slate-500">
                        {series.result.y_column} · {series.result.pair_count} 个数据点
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtra(series.id)}
                      disabled={extraLoading || projectBusy}
                      aria-label={`移除系列 ${series.name}`}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      data-testid="remove-extra-series"
                    >
                      移除
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <ScatterPlot
            pairs={seriesState.result.pairs}
            extraSeries={extraSeries.map((series) => ({
              id: series.id,
              name: series.name,
              pairs: series.result.pairs,
            }))}
            xColumn={seriesState.result.x_column}
            yColumn={seriesState.result.y_column}
            xUnit={seriesState.result.x_unit}
            yUnit={seriesState.result.y_unit}
            fit={fitResult}
            title={chartTitle}
            showGrid={showGrid}
            tickDensity={tickDensity}
            fontScale={fontScale}
            pngScale={pngScale}
          />
          <PairPreview result={seriesState.result} />
          <FitPanel
            series={seriesState.result}
            numericColumns={numericColumns}
            degree={fitDegree}
            onDegreeChange={setFitDegree}
            errorColumn={fitErrorColumn}
            onErrorColumnChange={setFitErrorColumn}
            errorUnit={fitErrorUnit}
            onErrorUnitChange={setFitErrorUnit}
            fitState={fitState}
            onRun={() => void handleRunFitClick()}
            runDisabled={projectBusy}
          />
        </div>
      ) : null}
    </div>
  );
}
