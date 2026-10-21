import { useEffect, useState } from "react";
import { CsvImportPanel } from "./components/CsvImportPanel";
import { fetchHealth } from "./lib/api";

type ApiState = "loading" | "online" | "offline";

const workflow = [
  {
    step: "01",
    title: "导入数据",
    body: "CSV、XLSX 或手动录入；自动识别数值列并预览。",
  },
  {
    step: "02",
    title: "确认列与单位",
    body: "选择 X、Y、误差列，明确单位与有效数字。",
  },
  {
    step: "03",
    title: "确定性分析",
    body: "统计、线性/多项式拟合、R² 与残差，结果可复现。",
  },
  {
    step: "04",
    title: "科研绘图与导出",
    body: "生成课程/汇报级图表，导出 PNG、SVG 与数据。",
  },
];

const features = [
  "均值、样本标准差、标准误",
  "线性、二次、三次拟合",
  "拟合方程、R²、残差与误差棒",
  "中文优先的科研级图表样式",
  "项目保存、重开与重跑",
  "数据不离开本地，不送第三方 AI",
];

function App() {
  const [apiState, setApiState] = useState<ApiState>("loading");
  const [apiVersion, setApiVersion] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((health) => {
        setApiVersion(health.version);
        setApiState("online");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setApiState("offline");
        }
      });
    return () => controller.abort();
  }, []);

  const apiLabel =
    apiState === "online"
      ? "API 已连接 · v" + apiVersion
      : apiState === "offline"
        ? "API 未连接"
        : "正在检查 API";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-mist/80 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <a className="flex items-center gap-3" href="#top" aria-label="LabFlow 首页">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm font-bold text-white">
              LF
            </span>
            <span className="text-lg font-semibold tracking-tight text-ink">LabFlow</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
            <a className="hover:text-ink" href="#import">导入数据</a>
            <a className="hover:text-ink" href="#workflow">工作流</a>
            <a className="hover:text-ink" href="#roadmap">路线图</a>
            <a className="hover:text-ink" href="#trust">数据与隐私</a>
          </nav>
          <a
            className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href="#import"
          >
            开始分析
          </a>
        </div>
      </header>

      <main id="top">
        <section className="container-page grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <span className="pill border-cyan/20 bg-cyan/5 text-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
              Phase 1 · 数据导入
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
              从原始实验数据，
              <span className="block text-cyan">到可复现的科研图表。</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              LabFlow 把导入、校验、统计、拟合、绘图和导出串成一条清晰的工作流。
              计算由确定性算法完成，图表为课程实验和科研汇报而设计。
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                className="rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition hover:bg-cyan-800"
                href="#import"
              >
                上传 CSV 数据
              </a>
              <a
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-slate-400"
                href="#roadmap"
              >
                阅读产品路线图
              </a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-200 pt-6">
              <div>
                <dt className="text-xs text-slate-500">计算方式</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">确定性算法</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">界面语言</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">中文优先</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">数据位置</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">本地处理</dd>
              </div>
            </dl>
          </div>

          <div className="card relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Analysis pipeline</p>
                <h2 className="mt-2 text-lg font-semibold text-ink">一次完整的分析</h2>
              </div>
              <span className="pill border-emerald-200 bg-emerald-50 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                reproducible
              </span>
            </div>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <svg viewBox="0 0 320 170" role="img" aria-label="示例拟合曲线图" className="h-48 w-full">
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0e7490" />
                    <stop offset="100%" stopColor="#6d5bd0" />
                  </linearGradient>
                </defs>
                <line x1="28" y1="142" x2="300" y2="142" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="28" y1="18" x2="28" y2="142" stroke="#cbd5e1" strokeWidth="1" />
                <path d="M28 128 C80 124 118 100 160 88 S238 52 300 34" fill="none" stroke="url(#lineGradient)" strokeWidth="3" />
                <circle cx="62" cy="122" r="3.5" fill="#0e7490" />
                <circle cx="104" cy="108" r="3.5" fill="#0e7490" />
                <circle cx="146" cy="96" r="3.5" fill="#0e7490" />
                <circle cx="188" cy="78" r="3.5" fill="#0e7490" />
                <circle cx="230" cy="62" r="3.5" fill="#0e7490" />
                <circle cx="272" cy="44" r="3.5" fill="#0e7490" />
                <text x="36" y="158" fill="#64748b" fontSize="9">x</text>
                <text x="10" y="28" fill="#64748b" fontSize="9">y</text>
              </svg>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">R²</p>
                <p className="mt-1 text-sm font-semibold text-ink">0.998</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">数据点</p>
                <p className="mt-1 text-sm font-semibold text-ink">24</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">导出</p>
                <p className="mt-1 text-sm font-semibold text-ink">SVG / PNG</p>
              </div>
            </div>
          </div>
        </section>

        <CsvImportPanel />

        <section id="workflow" className="container-page py-16">
          <div className="max-w-2xl">
            <p className="eyebrow">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">一条流程，覆盖从数据到图表</h2>
            <p className="mt-3 text-slate-600">每个步骤都可回溯、可复现；AI 只做解释和引导，不参与数值计算。</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((item) => (
              <article key={item.step} className="card">
                <p className="text-xs font-semibold tracking-widest text-cyan">{item.step}</p>
                <h3 className="mt-3 text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="roadmap" className="container-page py-16">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="card">
              <p className="eyebrow">Current phase</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Phase 1 · CSV 导入与预览</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                CSV 上传、数值列识别、缺失/重复警告与数据预览已就位。
                下一阶段从列选择、单位确认和基础统计开始。
              </p>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">后端状态</span>
                <span
                  className={
                    "pill " +
                    (apiState === "online"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : apiState === "offline"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-500")
                  }
                >
                  {apiLabel}
                </span>
              </div>
            </div>
            <div className="card">
              <p className="eyebrow">MVP capabilities</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">首批必须完成的能力</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="trust" className="container-page pb-20">
          <div className="rounded-3xl bg-ink px-6 py-10 text-white sm:px-10">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Trust by design</p>
                <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">计算结果透明，用户数据留在本地。</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  公式、单位、有效数字和拟合条件都会记录。
                  MVP 不启用真实收费、不把实验数据送往第三方 AI。
                </p>
              </div>
              <a
                className="inline-flex shrink-0 items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-100"
                href="https://github.com/CubicZnS/labflow"
              >
                查看 GitHub 仓库
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 py-8">
        <div className="container-page flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>LabFlow · 科研数据分析与绘图</p>
          <p>Phase 1 · CSV 导入与预览 · 结果可复现优先</p>
        </div>
      </footer>
    </div>
  );
}

export default App;