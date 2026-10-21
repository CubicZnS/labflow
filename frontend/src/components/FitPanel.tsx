import { useEffect, useId, useRef, useState } from "react";
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

function termLabel(power: number): string {
  if (power === 0) {
    return "常数项";
  }
  if (power === 1) {
    return "x";
  }
  return `x^${power}`;
}

function FitResult({ result }: { result: FitResponse }) {
  const previewRows = result.pairs.slice(0, PREVIEW_LIMIT);
  const limited = result.pair_count > PREVIEW_LIMIT;
  const { uncertainty } = result;
  const standardErrors = uncertainty.standard_errors;
  const confidenceIntervals = uncertainty.confidence_intervals;
  const highestPower = result.coefficients.length - 1;

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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            result.weighted
              ? "bg-cyan/10 text-cyan-800"
              : "bg-slate-200 text-slate-600"
          }`}
          data-testid="fit-weighted-badge"
        >
          {result.weighted
            ? "加权拟合（使用 Y 误差列）"
            : "等权拟合（未使用 Y 误差列）"}
        </span>
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-500">Y 误差列</dt>
          <dd
            className="mt-1 text-base font-semibold text-ink"
            data-testid="fit-error-column"
          >
            {result.y_error_column ?? "未使用"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Y 误差单位</dt>
          <dd
            className="mt-1 text-base font-semibold text-ink"
            data-testid="fit-error-unit"
          >
            {result.y_error_unit ?? "未标注"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">χ²</dt>
          <dd
            className="mt-1 text-base font-semibold text-ink"
            data-testid="fit-chi-squared"
          >
            {result.chi_squared === null ? "—" : formatValue(result.chi_squared)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">约化 χ²</dt>
          <dd
            className="mt-1 text-base font-semibold text-ink"
            data-testid="fit-reduced-chi2"
          >
            {result.reduced_chi_squared === null
              ? "—"
              : formatValue(result.reduced_chi_squared)}
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
          data-testid="fit-uncertainty-table"
        >
          <caption className="px-4 py-2 text-left text-xs text-slate-500">
            系数不确定度（95% 置信区间）
          </caption>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                系数项
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                系数
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                标准误
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                95% CI 下限
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                95% CI 上限
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {result.coefficients.map((coefficient, index) => {
              const standardError = standardErrors?.[index];
              const interval = confidenceIntervals?.[index];
              return (
                <tr key={index}>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                    {termLabel(highestPower - index)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                    {formatValue(coefficient)}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-2 text-slate-700"
                    data-testid={`fit-uncertainty-se-${index}`}
                  >
                    {standardError === undefined ? "—" : formatValue(standardError)}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-2 text-slate-700"
                    data-testid={`fit-uncertainty-ci-low-${index}`}
                  >
                    {interval ? formatValue(interval.low) : "—"}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-2 text-slate-700"
                    data-testid={`fit-uncertainty-ci-high-${index}`}
                  >
                    {interval ? formatValue(interval.high) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">残差自由度</dt>
          <dd
            className="mt-1 text-base font-semibold text-ink"
            data-testid="fit-residual-dof"
          >
            {uncertainty.residual_dof}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">条件数</dt>
          <dd
            className="mt-1 text-base font-semibold text-ink"
            data-testid="fit-condition-number"
          >
            {uncertainty.condition_number === null
              ? "—"
              : formatValue(uncertainty.condition_number)}
          </dd>
        </div>
      </dl>

      {uncertainty.ill_conditioned ? (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
          data-testid="fit-conditioning-warning"
        >
          设计矩阵病态，系数估计可能不稳定。
        </div>
      ) : null}

      {standardErrors === null ? (
        <p
          className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600"
          data-testid="fit-uncertainty-note"
        >
          有效数据点恰好等于参数个数，无法估计系数不确定度。
        </p>
      ) : null}

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
              {result.weighted ? (
                <th scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                  Y 误差
                </th>
              ) : null}
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
                {result.weighted ? (
                  <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                    {formatValue(result.y_errors?.[index] ?? Number.NaN)}
                  </td>
                ) : null}
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
  numericColumns,
  onFitChange,
}: {
  file: File;
  format: DatasetFormat;
  series: SeriesResponse;
  numericColumns: string[];
  onFitChange: (result: FitResponse | null) => void;
}) {
  const degreeId = useId();
  const errorColumnId = useId();
  const errorUnitId = useId();
  const [degree, setDegree] = useState<FitDegree>(1);
  const [errorColumn, setErrorColumn] = useState("");
  const [errorUnit, setErrorUnit] = useState("");
  const [fitState, setFitState] = useState<FitState>({ status: "idle" });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isLoading = fitState.status === "loading";
  const availableErrorColumns = numericColumns.filter(
    (column) => column !== series.x_column && column !== series.y_column,
  );

  async function handleRun() {
    if (isLoading) {
      return;
    }
    setFitState({ status: "loading" });
    onFitChange(null);
    try {
      const result = await createFit(file, format, {
        xColumn: series.x_column,
        yColumn: series.y_column,
        xUnit: series.x_unit ?? undefined,
        yUnit: series.y_unit ?? undefined,
        degree,
        yErrorColumn: errorColumn || undefined,
        yErrorUnit: errorColumn ? errorUnit : undefined,
      });
      if (!mountedRef.current) {
        return;
      }
      setFitState({ status: "success", result });
      onFitChange(result);
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      setFitState({
        status: "error",
        message:
          error instanceof Error ? error.message : "拟合失败，请稍后重试。",
      });
      onFitChange(null);
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

        <div className="w-full sm:w-52">
          <label htmlFor={errorColumnId} className="block text-xs text-slate-500">
            Y 误差列（可选）
          </label>
          <select
            id={errorColumnId}
            value={errorColumn}
            disabled={isLoading}
            onChange={(event) => setErrorColumn(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            data-testid="fit-error-select"
          >
            <option value="">不使用（等权拟合）</option>
            {availableErrorColumns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        {errorColumn ? (
          <div className="w-full sm:w-44">
            <label htmlFor={errorUnitId} className="block text-xs text-slate-500">
              Y 误差单位（可选）
            </label>
            <input
              id={errorUnitId}
              type="text"
              value={errorUnit}
              maxLength={32}
              disabled={isLoading}
              onChange={(event) => setErrorUnit(event.target.value)}
              placeholder="例如 µV"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              data-testid="fit-error-unit-input"
            />
          </div>
        ) : null}

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
