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

### Phase 1 — Data import and validation (current)

- [x] CSV import with validation, warnings, and preview
- [ ] XLSX import with preview
- [ ] Manual table entry/editing
- [ ] X/Y selection and units
- [x] Numeric column detection
- [x] Missing/invalid/duplicate value diagnostics
- [x] Basic statistics: mean, sample standard deviation, standard error

Acceptance: a real experimental CSV/XLSX can be imported and produces correct summary statistics.

### Phase 2 — Curve fitting

- Linear regression
- Quadratic and cubic polynomial fits
- Fit equation, R-squared, residuals
- Error bars and uncertainty propagation
- Warnings for underdetermined or ill-conditioned fits

Acceptance: known-value fixtures match independent numerical baselines.

### Phase 3 — Scientific plotting

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