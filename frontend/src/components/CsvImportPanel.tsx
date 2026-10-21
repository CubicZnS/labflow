import { useId, useState, type ChangeEvent } from "react";
import { uploadCsv, type CsvImportResponse, type PreviewCell } from "../lib/api";

type UploadState =
  | { status: "idle" }
  | { status: "parsing"; fileName: string }
  | { status: "success"; fileName: string; result: CsvImportResponse }
  | { status: "error"; fileName: string; message: string };

const rowFormatter = new Intl.NumberFormat("zh-CN");

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + " B";
  }
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function PreviewValue({ value }: { value: PreviewCell }) {
  if (value === null) {
    return (
      <span aria-label="缺失值" className="text-slate-400">
        —
      </span>
    );
  }
  return <>{String(value)}</>;
}

function EmptyPreview() {
  return (
    <div className="flex h-full min-h-64 flex-col justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
      <p className="text-sm font-semibold text-ink">数据预览</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        选择 CSV 并解析后，这里会显示行数、数值列、警告和前 10 行数据。
      </p>
    </div>
  );
}

function CsvResult({ fileName, result }: { fileName: string; result: CsvImportResponse }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Parsed dataset</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">解析完成</h3>
          <p className="mt-1 truncate text-sm text-slate-500">{fileName}</p>
        </div>
        <span className="pill border-emerald-200 bg-emerald-50 text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          CSV 已解析
        </span>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <dt className="text-xs text-slate-500">数据行数</dt>
          <dd className="mt-1 text-xl font-semibold text-ink" data-testid="row-count">
            {rowFormatter.format(result.row_count)}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <dt className="text-xs text-slate-500">数值列</dt>
          <dd className="mt-1 text-sm font-medium text-ink" data-testid="numeric-columns">
            {result.numeric_columns.length > 0
              ? result.numeric_columns.join("、")
              : "未识别到数值列"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">解析警告</p>
        {result.warnings.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-amber-700" data-testid="warnings">
            {result.warnings.map((warning) => (
              <li key={warning} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-emerald-700" data-testid="no-warnings">
            无警告
          </p>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-ink">数据预览</h4>
          <span className="text-xs text-slate-500">前 {result.preview.length} 行</span>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm" data-testid="preview-table">
            <caption className="sr-only">CSV 数据预览</caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {result.columns.map((column) => (
                  <th key={column} scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {result.preview.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {result.columns.map((column) => (
                    <td key={column} className="whitespace-nowrap px-4 py-2 text-slate-700">
                      <PreviewValue value={row[column] ?? null} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CsvImportPanel() {
  const inputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });

  const isParsing = uploadState.status === "parsing";

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadState({ status: "idle" });
  }

  function handleClear() {
    setSelectedFile(null);
    setUploadState({ status: "idle" });
  }

  async function handleUpload() {
    if (!selectedFile || isParsing) {
      return;
    }
    const fileName = selectedFile.name;
    setUploadState({ status: "parsing", fileName });
    try {
      const result = await uploadCsv(selectedFile);
      setUploadState({ status: "success", fileName, result });
    } catch (error) {
      setUploadState({
        status: "error",
        fileName,
        message: error instanceof Error ? error.message : "CSV 上传失败，请稍后重试。",
      });
    }
  }

  return (
    <section id="import" className="container-page py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Data import</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          导入 CSV，先看清数据再分析
        </h2>
        <p className="mt-3 text-slate-600">
          上传后立即返回行数、数值列与缺失/重复等警告，并展示前 10 行预览。
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card">
          <h3 className="text-base font-semibold text-ink">1. 选择文件</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            支持 UTF-8 编码的 CSV，单文件最大 10 MB。文件只用于本地解析。
          </p>

          <label
            htmlFor={inputId}
            className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-cyan/40 bg-cyan/5 px-4 py-6 text-sm font-medium text-cyan transition hover:border-cyan hover:bg-cyan/10"
          >
            <span aria-hidden="true">＋</span>
            选择 CSV 文件
          </label>
          <input
            id={inputId}
            aria-label="选择 CSV 文件"
            className="sr-only"
            type="file"
            accept=".csv,text/csv"
            disabled={isParsing}
            onChange={handleFileChange}
          />

          {selectedFile ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink" data-testid="selected-file">
                  {selectedFile.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  已选择 · {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                disabled={isParsing}
                aria-label="清除已选文件"
                className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                清除
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500" data-testid="no-file">
              尚未选择文件。
            </p>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isParsing}
            className="mt-4 w-full rounded-xl bg-cyan px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {isParsing ? "正在解析…" : "上传并解析"}
          </button>

          {uploadState.status === "parsing" ? (
            <p role="status" className="mt-3 text-sm text-slate-600">
              正在上传并解析 {uploadState.fileName}，请稍候…
            </p>
          ) : null}

          {uploadState.status === "error" ? (
            <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm font-semibold text-rose-700">上传失败</p>
              <p className="mt-1 text-sm leading-6 text-rose-700" data-testid="upload-error">
                {uploadState.message}
              </p>
            </div>
          ) : null}

          <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
            没有现成数据？下载
            <a className="mx-1 font-medium text-cyan underline-offset-2 hover:underline" href="/samples/labflow-demo.csv" download>
              示例 CSV
            </a>
            体验导入流程。
          </p>
        </div>

        <div className="card" aria-live="polite">
          {uploadState.status === "success" ? (
            <CsvResult fileName={uploadState.fileName} result={uploadState.result} />
          ) : (
            <EmptyPreview />
          )}
        </div>
      </div>
    </section>
  );
}
