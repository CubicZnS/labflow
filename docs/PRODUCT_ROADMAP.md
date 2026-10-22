# LabFlow Product Roadmap

## Product thesis

LabFlow turns raw experimental measurements into validated statistics, publication-style figures,
and exportable analysis records. The first audience is Chinese university students, graduate
students, and research labs that repeatedly perform similar data-analysis and plotting work.

## Principles

1. Deterministic computation first; AI explains and guides, but never replaces numeric results.
2. One complete workflow is more valuable than many half-finished features.
3. Every iteration must produce a runnable, tested, committed, and pushed improvement.
4. No real charging, purchases, deployments, or destructive operations without approval.
5. Prefer local computation and low fixed costs until usage justifies infrastructure.

## Phases

### Phase 0 — Bootstrap (complete)

- [x] Private GitHub repository and branch workflow
- [x] FastAPI backend shell with deterministic analysis module
- [x] React/Vite/Tailwind frontend shell
- [x] Pytest and Vitest foundations
- [x] GitHub Actions CI
- [x] Product, architecture, testing, business, decision, and iteration docs
- [x] First commit pushed and verified on the remote

Acceptance: both applications start; tests pass; CI is configured; the first commit exists on GitHub.

### Phase 1 — Data import and validation (core complete)

- [x] CSV import with validation, warnings, and preview
- [x] XLSX import with preview
- [ ] Manual table entry/editing
- [x] X/Y selection and units
- [x] Numeric column detection
- [x] Missing/invalid/duplicate value diagnostics
- [x] Basic statistics: mean, sample standard deviation, standard error

Acceptance: a real experimental CSV/XLSX can be imported and produces correct summary statistics.

### Phase 2 — Curve fitting (complete)

Phase 1 acceptance is met: real CSV/XLSX files import with validation, statistics, and an explicit
paired series with units. Manual table entry/editing is deferred until after fitting/plotting.

- [x] Linear regression
- [x] Quadratic and cubic polynomial fits
- [x] Fit equation, R-squared, residuals
- [x] Coefficient standard errors and 95% confidence intervals
- [x] Ill-conditioned and exactly-determined fit warnings (underdetermined fits already return 422)
- [x] Y-error columns and measurement-error-aware weighted fits (χ², reduced χ²,
      absolute-error covariance)

Phase 2.1 (iteration 6) delivered dataset-level fits on the paired series with equation, R-squared,
residuals, RMSE, and maximum absolute residual. Phase 2.2 (iteration 7) added coefficient standard
errors, 95% confidence intervals, residual degrees of freedom, and explicit exactly-determined and
ill-conditioned warnings. Phase 2.3 (iteration 8) added optional absolute Y-error columns, weighted
least-squares coefficients, `pinv(XᵀWX)` uncertainty, χ²/reduced χ² diagnostics, and Chinese-first
error-column controls. Error-bar rendering moves to Phase 3 because it is a plotting concern.

Acceptance: known-value fixtures match independent numerical baselines.

### Phase 3 — Scientific plotting (complete)

Planned increments:

- [x] 3.1 SVG scatter plot of the paired series with axis labels/units, automatic ranges, and empty/
      single-point states; no new chart dependency (iteration #9, merge `2862994`)
- [x] 3.2 Fitted-curve overlay and Y-error bars, reusing the existing fit response; Y range includes
      curve samples and error endpoints, stale fit responses are isolated per series
      (iteration #10, merge `f98b1c9`)
- [x] 3.3 Chart title, grid toggle, tick density, and font-size controls on the single-series
      scatter plot; coordinate domain, point positions, fitted curve, and error bars are
      independent of the selected density (iteration #11, merge `4545a60`)
- [x] 3.4 Multiple series overlay with legend: primary series plus up to three added Y series,
      shared X/Y domains, fixed color/shape encoding, Chinese legend, add/remove/limit/error
      handling; primary-only fit overlay and error bars
      (iteration #12, merge `227d04a`)
- [x] 3.5 PNG and SVG export (iteration #13, merge `f00101b`)

Phase 3 acceptance is met: the current chart can be exported as a deterministic SVG clone or a
2× PNG raster with a white background, without new dependencies or re-fetching data. The HTML
legend is intentionally excluded from the image and remains a documented limitation (iteration
#13, merge `f00101b1910c8707e3244aa559aeb0c659b1c8a1`).

Original scope kept for reference:

- Scatter, line, scatter+fit, error-bar charts
- Multiple series, axis labels/units/ranges
- Title, legend, font, grid, tick controls
- PNG and SVG export

Acceptance: a user can go from uploaded data to an exported publication-style figure.

### Phase 4 — MVP productization (in progress)

- [x] 4.1a Local project snapshot v1: deterministic `.labflow.json` with a SHA-256 data
      fingerprint (format, size, row count, numeric columns) plus X/Y columns/units, ordered
      extra series, fit settings, and chart style. Saving, strict Chinese validation, dataset
      identity check, and ordered one-click rerun (main series → extras → fit) are implemented;
      the file contains no raw data rows, pairs, fit coefficients, or credentials
      (iteration #14, merge `d56f2a2`)
- [x] 4.1b Project metadata and export settings: snapshot schema v2 adds `metadata.name`
      (≤80), `metadata.note` (≤500), and `export.pngScale` (1/2/3, default 2); v1 project
      files are strictly validated and migrated to v2; SVG/PNG export format stays per-click
      and custom size/DPI is not persisted. Local-only, no-upload boundary kept
      (iteration #15, merge `aeed184`)
- [x] Project save/reopen and rerun (local config snapshot; the same data file must be
      re-imported and is verified by SHA-256 before rerun)
- [x] 4.2 Sample datasets and onboarding: one-click load of the built-in demo CSV, landing
      page copy aligned with current Phase 4 capabilities, and a first-run step guide
      (iteration #16, merge `aa5268e`)
- [x] 4.3a Accessibility foundation and status announcements: skip link, global visible focus,
      reduced-motion preference, accessible parse-status announcements and `aria-busy`,
      keyboard-reachable project-open button, busy-state disables
      (iteration #17, merge `b4a3379`)
- [x] 4.3b-1 Privacy review and frontend error experience: Chinese network/HTTP/non-JSON
      messages for health checks and dataset POSTs, offline health-check retry, a verifiable
      four-item privacy summary on the landing page, and `docs/PRIVACY.md`
      (iteration #18)
- [x] 4.3b-2 Localize backend user-facing validation error messages: all user-facing `detail`
      strings and import/pairing/fitting warnings are Chinese, with status codes, response
      fields, endpoints, and numeric results unchanged (iteration #19)
- [x] 4.4a 发布前静态代码兼容性审查与中文试用手册准备（迭代 #20）：
      [实际能力证据、人工矩阵与本地脚本](BROWSER_TRIAL_CHECKLIST.md)。仅文档准备，不代表浏览器验证通过。
- [ ] 4.4b 执行 Chrome/Safari/Firefox 人工矩阵，记录完整版本、OS、日期、下载文件及失败证据，
      再处理证据支持的兼容问题；目前全部待执行。
- [ ] 4.4c 外部用户无需开发者帮助完成工作流的真实验收；招募、部署与付费服务仍须另行授权。

Phase 4 MVP 尚未完成；静态审查与手册准备完成不等于人工验证或产品接受。

Acceptance: an external test user completes the workflow without developer help.

### Phase 5 — Commercial validation

- Controlled trial, interviews, usage metrics
- Free/Pro/Team entitlement validation
- Willingness-to-pay research and cost accounting

No real billing or paid acquisition without explicit approval. No fabricated users or revenue.

### Phase 6 — Continuous commercial iteration

Only after real usage evidence: richer fits, templates, batch analysis, reports, collaboration,
accounts/cloud sync, English UI, and optional AI guidance.

## MVP boundary

In scope: import, validate, statistics, linear/polynomial fit, scientific plots, project persistence,
PNG/SVG export, Chinese-first UI.

Out of scope for the MVP: real payments, production deployment, team collaboration, cloud sync,
AI-generated numeric results, mobile apps.

## Success metrics

- First-analysis completion rate
- Repeat usage within 7/30 days
- Export success rate
- Defect and failed-iteration rate
- Trial-to-paid conversion (only with real data)
- Variable cost per active user

Until real data exists, metrics are reported as `暂无数据`; assumptions are not presented as facts.

## 迭代 #22 实际状态（2026-10-23 Asia/Shanghai）

Phase 4.4b 的 T10 已完成 Firefox 158.0.1 headless + Selenium Remote/BiDi 自动化实测：后端停止后的中文失败/重试状态、恢复重导配对拟合，以及单独阻断示例 GET 时结果保留/解除重试。证据与边界见 [浏览器清单](BROWSER_TRIAL_CHECKLIST.md#迭代-22t10-离线失败与重试恢复实测)。待 Lead 独立审查及独立 QA，不宣称产品 QA PASS。T09、Chrome/Safari、Firefox 有头人工矩阵与真实外部验收仍待执行，Phase 4 MVP 未完成。无离线分析或请求超时能力承诺；下一轮由 Lead 只选一个未完成项。
