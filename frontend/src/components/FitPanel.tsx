import { useId, useState } from "react";
import {
  createFit,
  type DatasetFormat,
  type FitDegree,
  type FitResponse,
  type SeriesResponse,
} from "../lib/api";

type FitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: FitResponse }
  | { status: "error"; message: string };

const PREVIEW_LIMIT = 10;

const DEGREE_OPTIONS: { value: FitDegree; label: string }[] = [
  { value: 1, label: "线性（1 次）" },
  { value: 2, label: "二次（2 次）" },
  { value: 3, label: "三次（3 次）" },
];

const numberFormatter = new Intl.NumberFormat("zh-CN", {
  maximumSignificantDigits: 6,
});

function formatValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  if (value === 0) {
    return "0";
  }
  return numberFormatter.format(value);
}

function unitHeader(label: string, unit: string | null): string {
  return unit ? `${label} (${unit})` : label;
}

function FitResult({ result }: { result: FitResponse }) {
  const previewRows = result.pairs.slice(0, PREVIEW_LIMIT);
  const limited = result.pair_count > PREVIEW_LIMIT;

  return (
    <div
      className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
      data-testid="fit-result"
    >
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-500">拟合方程</dt>
          <dd
            className="mt-1 text-base font-semibold text-ink"
            data-testid="fit-equation"
          >
            {result.equation}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">R²</dt>
          <dd className="mt-1 text-base font-semibold text-ink" data-testid="fit-r2">
            {result.r_squared.toFixed(4)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">RMSE</dt>
          <dd className="mt-1 text-base font-semibold text-ink" data-testid="fit-rmse">
            {formatValue(result.rmse)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">最大绝对残差</dt>
          <dd
            className="mt-1 text-base font-semibold text-ink"
            data-testid="fit-max-residual"
          >
            {formatValue(result.max_abs_residual)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-sm text-slate-600">
        系数（最高次在前）：
        <span className="font-medium text-ink" data-testid="fit-coefficients">
          {result.coefficients.map(formatValue).join("、")}
        </span>
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table
          className="min-w-full divide-y divide-slate-200 text-left text-sm"
          data-testid="fit-preview-table"
        >
          <caption
            className="px-4 py-2 text-left text-xs text-slate-500"
            data-testid="fit-preview-caption"
          >
            {limited
              ? `共 ${result.pair_count} 行，仅显示前 ${PREVIEW_LIMIT} 行。`
              : `共 ${result.pair_count} 行，已显示全部。`}
          </caption>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                {unitHeader("X", result.x_unit)}
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                {unitHeader("Y", result.y_unit)}
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                拟合值
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                残差
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {previewRows.map((pair, index) => (
              <tr key={index}>
                <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                  {formatValue(pair.x)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                  {formatValue(pair.y)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                  {formatValue(result.fitted[index] ?? Number.NaN)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                  {formatValue(result.residuals[index] ?? Number.NaN)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FitPanel({
  file,
  format,
  series,
}: {
  file: File;
  format: DatasetFormat;
  series: SeriesResponse;
}) {
  const degreeId = useId();
  const [degree, setDegree] = useState<FitDegree>(1);
  const [fitState, setFitState] = useState<FitState>({ status: "idle" });

  const isLoading = fitState.status === "loading";

  async function handleRun() {
    if (isLoading) {
      return;
    }
    setFitState({ status: "loading" });
    try {
      const result = await createFit(file, format, {
        xColumn: series.x_column,
        yColumn: series.y_column,
        xUnit: series.x_unit ?? undefined,
        yUnit: series.y_unit ?? undefined,
        degree,
      });
      setFitState({ status: "success", result });
    } catch (error) {
      setFitState({
        status: "error",
        message:
          error instanceof Error ? error.message : "拟合失败，请稍后重试。",
      });
    }
  }

  return (
    <div
      className="mt-5 rounded-xl border border-slate-200 p-4"
      data-testid="fit-section"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-ink">多项式拟合</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            基于上方配对结果，使用当前 X/Y 列与单位进行确定性最小二乘拟合。
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-52">
          <label htmlFor={degreeId} className="block text-xs text-slate-500">
            拟合次数
          </label>
          <select
            id={degreeId}
            value={degree}
            disabled={isLoading}
            onChange={(event) =>
              setDegree(Number(event.target.value) as FitDegree)
            }
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            data-testid="fit-degree-select"
          >
            {DEGREE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={isLoading}
          className="w-full rounded-xl bg-cyan px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:w-auto"
        >
          {isLoading ? "正在拟合…" : "运行拟合"}
        </button>
      </div>

      {fitState.status === "error" ? (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
        >
          <p className="text-sm font-semibold text-rose-700">拟合失败</p>
          <p
            className="mt-1 text-sm leading-6 text-rose-700"
            data-testid="fit-error"
          >
            {fitState.message}
          </p>
        </div>
      ) : null}

      {fitState.status === "success" ? (
        <FitResult result={fitState.result} />
      ) : null}
    </div>
  );
}
