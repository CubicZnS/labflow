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

### Phase 3 — Scientific plotting (in progress)

Planned increments:

- [x] 3.1 SVG scatter plot of the paired series with axis labels/units, automatic ranges, and empty/
      single-point states; no new chart dependency (iteration #9, merge `2862994`)
- [ ] 3.2 Fitted-curve overlay and Y-error bars, reusing the existing fit response
- [ ] 3.3 Multiple series, title, legend, grid, font, and tick controls
- [ ] 3.4 PNG and SVG export

Original scope kept for reference:

- Scatter, line, scatter+fit, error-bar charts
- Multiple series, axis labels/units/ranges
- Title, legend, font, grid, tick controls
- PNG and SVG export

Acceptance: a user can go from uploaded data to an exported publication-style figure.

### Phase 4 — MVP productization

- Project save/reopen and rerun
- Sample datasets and onboarding
- Error handling and accessibility pass
- Data privacy and security review

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