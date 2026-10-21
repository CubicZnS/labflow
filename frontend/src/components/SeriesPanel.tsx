import { useId, useState } from "react";
import {
  createSeries,
  type CsvImportResponse,
  type DatasetFormat,
  type FitResponse,
  type SeriesResponse,
} from "../lib/api";
import { FitPanel } from "./FitPanel";
import { ScatterPlot } from "./ScatterPlot";

type SeriesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: SeriesResponse }
  | { status: "error"; message: string };

const UNIT_MAX_LENGTH = 32;
const PREVIEW_LIMIT = 10;

function unitHeader(label: string, unit: string | null): string {
  return unit ? `${label} (${unit})` : label;
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

  const numericColumns = result.numeric_columns;
  const enoughColumns = numericColumns.length >= 2;

  const [xColumn, setXColumn] = useState(numericColumns[0] ?? "");
  const [yColumn, setYColumn] = useState(
    numericColumns[1] ?? numericColumns[0] ?? "",
  );
  const [xUnit, setXUnit] = useState("");
  const [yUnit, setYUnit] = useState("");
  const [seriesState, setSeriesState] = useState<SeriesState>({ status: "idle" });
  const [seriesRun, setSeriesRun] = useState(0);
  const [fitResult, setFitResult] = useState<FitResponse | null>(null);

  const isLoading = seriesState.status === "loading";
  const sameSelection = xColumn !== "" && xColumn === yColumn;
  const canSubmit = enoughColumns && !sameSelection && !isLoading;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    setSeriesState({ status: "loading" });
    setFitResult(null);
    try {
      const series = await createSeries(file, format, {
        xColumn,
        yColumn,
        xUnit,
        yUnit,
      });
      setSeriesState({ status: "success", result: series });
      setSeriesRun((run) => run + 1);
    } catch (error) {
      setSeriesState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "生成配对数据失败，请稍后重试。",
      });
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
          <ScatterPlot
            pairs={seriesState.result.pairs}
            xColumn={seriesState.result.x_column}
            yColumn={seriesState.result.y_column}
            xUnit={seriesState.result.x_unit}
            yUnit={seriesState.result.y_unit}
            fit={fitResult}
          />
          <PairPreview result={seriesState.result} />
          <FitPanel
            key={seriesRun}
            file={file}
            format={format}
            series={seriesState.result}
            numericColumns={numericColumns}
            onFitChange={setFitResult}
          />
        </div>
      ) : null}
    </div>
  );
}
