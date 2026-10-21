# Iteration Log

Every successful iteration records real work, tests, branch, commit SHA, and remote link.
Failed or blocked steps are reported honestly.

## Iteration #0 — Phase 0 bootstrap

- Date: 2026-10-21
- Goal: initialize the LabFlow repository, runnable backend/frontend skeletons, deterministic
  analysis tests, CI, and product documentation.
- Completed:
  - Private GitHub repository `CubicZnS/labflow`.
  - FastAPI shell with health, statistics, and fitting endpoints.
  - Deterministic analysis module with known-value tests.
  - React/Vite/Tailwind application shell with a Vitest smoke test.
  - GitHub Actions CI for backend and frontend.
  - Product roadmap, architecture, testing, business model, decisions, and agent operating docs.
- Tests:
  - Backend: `ruff check app tests` passed; `pytest -q` passed (16 tests).
  - Frontend: `pnpm typecheck` passed; `pnpm test:run` passed (2 tests); `pnpm build` succeeded.
  - Runtime smoke: `/api/health`, `/api/analysis/stats`, and `/api/analysis/fit` returned expected JSON;
    the built frontend served HTTP 200 from `vite preview`.
  - CI: GitHub Actions workflow configured for backend lint/test and frontend typecheck/test/build.
- Git branch: `main` (bootstrap commit).
- Commit SHA: `471d10335c138d428b1039b7e53f24eaa063d33a`
- GitHub: https://github.com/CubicZnS/labflow/commit/471d10335c138d428b1039b7e53f24eaa063d33a
- Known issues:
  - The MVP UI is a shell; CSV/XLSX import and charting are Phase 1–3 work.
  - No persistence, authentication, billing, or deployment yet.
  - Docker files are included but Docker is not installed on the development Mac mini, so the
    container path was not smoke-tested in this iteration.
  - FastAPI TestClient emits a Starlette/httpx deprecation warning; tests pass.
- Next iteration: Phase 1 — CSV import, validation, and basic statistics vertical slice.

## Iteration #1 — Phase 1.1 CSV parsing and validation API

- Date: 2026-10-21
- Goal: deliver the first Phase 1 backend increment — deterministic CSV import with validation,
  data-quality warnings, and a preview payload.
- Selected backlog task: MAC-12 (Phase 1.1 — CSV parsing and validation API).
- Branch: `iter/1`, created from `dev` at `7b3c2f1`.
- Completed:
  - `POST /api/datasets/csv` accepts a multipart CSV upload and returns `row_count`, `columns`,
    `numeric_columns`, `preview` (first 10 rows), and `warnings`.
  - Warnings for missing values, duplicate rows, non-numeric values in otherwise-numeric columns,
    and non-finite values. Preview serializes missing/non-finite values as `null`.
  - Clear 4xx errors: empty file (400), unsupported content type (415), header-only, malformed, or
    structurally ragged CSV (422), and over-limit upload (413).
  - Ragged rows are rejected before parsing so pandas cannot silently shift or drop fields.
  - UTF-8 with optional BOM, CRLF, quoted commas, and quoted newlines are supported.
  - 19 new dataset tests, including the ragged-row regressions and quoted-field cases.
- Review finding: the first implementation (`e2012ad`) silently shifted columns when a single row
  had one extra field. Lead review reproduced it, returned the task, and Dev fixed it in `fba7414`
  with field-count validation and regression tests. The iteration was not merged on the first
  report.
- Tests:
  - Backend: `ruff check app tests` passed; `pytest -q` passed (35 tests).
  - Frontend: unchanged; QA re-ran `pnpm typecheck`, `pnpm test:run` (2 passed), and `pnpm build`
    successfully.
- Independent QA: MAC-16, assigned to DeepSeek Worker QA, verdict **PASS** with 22 independent
  endpoint probes. QA confirmed the remote SHA, the diff scope, all acceptance criteria, the
  ragged-row rejection, quoted fields, and deterministic local parsing.
- Git:
  - Feature commits on `iter/1`:
    - `e2012adf929602eaa03ab99585270d8d45e95dad` — initial CSV import endpoint.
    - `fba741408e8b97e8d04a008a420d4e68e7edbc77` — reject ragged rows; non-finite warning.
  - Feature commit link: https://github.com/CubicZnS/labflow/commit/fba741408e8b97e8d04a008a420d4e68e7edbc77
  - Merge commit on `dev`: `0c9f89560b0369edf9f620c1400241db2dc8fd19`
  - Merge link: https://github.com/CubicZnS/labflow/commit/0c9f89560b0369edf9f620c1400241db2dc8fd19
- Known issues / limits:
  - CSV only; XLSX import is not implemented.
  - Comma-delimited UTF-8 only; other delimiters and encodings are not supported yet.
  - Upload limit is 10 MB and the whole file is read before the size check.
  - No frontend upload/preview UI yet; `numeric_columns` excludes columns with any text.
- Next iteration: Phase 1.2 — CSV upload and preview UI (MAC-13), depending on this API.

## Iteration #2 — Phase 1.2 CSV upload and preview UI

- Date: 2026-10-21
- Goal: connect the iteration 1 CSV API to the product UI so a user can upload a file and
  inspect the parsed dataset before analysis.
- Selected backlog task: MAC-13 (Phase 1.2 — CSV upload and preview UI).
- Branch: `iter/2`, created from `dev` at `f989508`.
- Completed:
  - CSV upload panel with file picker, selected-file state (name and size), clear action, and a
    parsing/in-flight state that disables duplicate submissions.
  - Uploads multipart/form-data field `file` to `POST /api/datasets/csv` via a typed API helper.
  - Success view shows row count, numeric columns, warnings or an explicit "no warnings" state,
    and a preview table of the returned columns and first 10 rows.
  - Missing (`null`) cells render a visible `—` placeholder with an accessible label.
  - Failures render a readable message taken from the API JSON `detail`, with a generic
    HTTP-status fallback for non-JSON responses; the page does not crash.
  - Deterministic synthetic fixture `frontend/public/samples/labflow-demo.csv` (12 rows) and a
    download link in the upload panel.
  - Existing health-check behavior and page shell preserved; Chinese-first copy and responsive
    layout kept.
- Tests:
  - Frontend: `pnpm typecheck` passed; `pnpm test:run` passed (6 tests, including upload success,
    clean/no-warning, API error detail, and non-JSON fallback); `pnpm build` succeeded.
  - Backend: unchanged by this iteration; QA confirmed `ruff check app tests` passed and
    `pytest -q` passed (35 tests).
  - Live QA: sample fixture uploaded to a local uvicorn instance returned 200 with
    `row_count=12`, three numeric columns, 10 preview rows, and two missing-value warnings; a
    malformed CSV returned the expected 422 detail. Server stopped after verification.
- Independent QA: MAC-18, assigned to DeepSeek Worker QA, verdict **PASS** after verifying the
  remote SHA, the exact five-file diff, all acceptance criteria, frontend/backend suites, and
  live endpoint behavior.
- Git:
  - Feature commit on `iter/2`: `80895d170df4b7efadbfe02cf6e3380232bf842e` — CSV upload and
    preview UI.
  - Feature commit link: https://github.com/CubicZnS/labflow/commit/80895d170df4b7efadbfe02cf6e3380232bf842e
  - Merge commit on `dev`: `6ed7e07f4eb3ebaafb3452522cfcac8a17b7a074`
  - Merge link: https://github.com/CubicZnS/labflow/commit/6ed7e07f4eb3ebaafb3452522cfcac8a17b7a074
- Known issues / limits:
  - CSV only; XLSX import, manual table editing, and column/unit selection are not implemented.
  - Statistics are not calculated yet; the UI stops at validated preview.
  - The 10 MB limit and UTF-8/comma-only parsing constraints from iteration 1 still apply.
  - Warnings are shown verbatim from the API in English inside the Chinese UI.
- Next iteration: Phase 1.3 — numeric column selection and basic statistics (mean, sample
  standard deviation, standard error) on imported data.

## Iteration #3 — Phase 1.3 summary statistics for imported numeric columns

- Date: 2026-10-21
- Goal: connect the imported dataset to deterministic summary statistics so a user can inspect
  n, mean, sample standard deviation, and standard error for a numeric column.
- Selected backlog task: MAC-14 (Phase 1.3 — summary statistics for imported numeric columns).
- Branch: `iter/3`, created from `dev` at `ca0c4e319135c0eddb46ac96693da306d9552eaf`.
- Completed:
  - `POST /api/datasets/csv` now returns `column_stats` keyed by numeric column name with `n`,
    `missing`, `mean`, sample `std` (ddof=1), and `sem`.
  - Statistics are computed deterministically from the full parsed dataset, not the 10-row
    preview. Missing and non-finite values are excluded and counted in `missing`.
  - Numeric columns with fewer than 2 finite values are omitted from `column_stats`; existing
    response fields, warnings, errors, and API paths are unchanged.
  - Frontend adds a numeric-column selector (defaults to the first numeric column) and a
    statistics panel showing n, mean, sample standard deviation, and SEM, formatted to 4
    significant digits with exponent notation for very large/small values.
  - Explicit missing/non-finite exclusion count, no-numeric-columns empty state, and
    insufficient-values explanation for omitted columns.
  - Scope decision: statistics are univariate, so this iteration selects a numeric Y column
    rather than X/Y; X/Y pairing remains Phase 2 work.
- Tests:
  - Backend: `ruff check app tests` passed; `pytest -q` passed (39 tests, 4 new statistics tests).
  - Frontend: `pnpm typecheck` passed; `pnpm test:run` passed (9 tests, 3 new statistics tests);
    `pnpm build` succeeded.
  - Lead API probe with values 2, 4, 8 and two missing values returned `n=3`, `missing=2`,
    `mean=4.666666666666667`, `std=3.055050463303893`, `sem=1.7638342073763937`, matching the
    expected sample statistics.
- Independent QA: MAC-20, assigned to DeepSeek Worker QA, verdict **PASS** after verifying the
  remote SHA, the exact six-file diff, all acceptance criteria, backend/frontend suites, and
  live endpoint probes with known values, missing/non-finite values, a too-sparse column, and a
  12-row dataset confirming full-dataset statistics.
- Git:
  - Feature commit on `iter/3`: `39baa39ff85688688ad00c1199521b801f3875d5` — deterministic column
    summary statistics.
  - Feature commit link: https://github.com/CubicZnS/labflow/commit/39baa39ff85688688ad00c1199521b801f3875d5
  - Merge commit on `dev`: `4868c1e8e92217fa11a892ba42e6f64a1897bb35`
  - Merge link: https://github.com/CubicZnS/labflow/commit/4868c1e8e92217fa11a892ba42e6f64a1897bb35
- Known issues / limits:
  - CSV only; XLSX import, manual table editing, and X/Y pairing/units are not implemented.
  - Statistics are descriptive only; no fitting or plotting yet.
  - Missing/non-finite values are silently excluded from calculations but counted in the UI;
    there is no per-row diagnostic table.
  - The 10 MB limit and UTF-8/comma-only parsing constraints from iteration 1 still apply.
  - Parsing warnings remain verbatim English inside the Chinese UI.
- Next iteration: Phase 1.4 — XLSX import with the same validation, preview, warnings, and
  statistics contract as CSV.

## Iteration #4 — Phase 1.4 XLSX import with the CSV validation contract

- Date: 2026-10-21
- Goal: let a user import a real experimental XLSX workbook and inspect the same validated
  preview, warnings, numeric columns, and summary statistics already available for CSV.
- Selected backlog task: MAC-22 (Phase 1.4 — XLSX import with the CSV validation and statistics
  contract). No Phase 1.4 task existed, so it was created from the roadmap.
- Branch: `iter/4`, created from `dev` at `bf17768ea3970aa9cfab606a3237376f324651c0`.
- Completed:
  - `POST /api/datasets/xlsx` returns the existing dataset contract (`row_count`, `columns`,
    `numeric_columns`, `column_stats`, `preview`, `warnings`) through a shared frame-building
    pipeline, so CSV and XLSX validation, warning order, numeric detection, statistics, and
    JSON-safe preview cannot drift.
  - Deterministic first-worksheet policy with one warning naming the imported sheet and total
    worksheet count; header-only or empty worksheets return 422.
  - XLSX errors: empty bytes 400, over-10 MB 413, unsupported content type 415, corrupt or
    no-data workbook 422; accepted types limited to XLSX OOXML plus `application/octet-stream`.
  - Blank and duplicate headers are made unique deterministically. Header width is derived from
    the widest populated row, so blank header cells backed by data survive, all-blank trailing
    columns are dropped, and a wider leading all-blank row cannot add a phantom column.
  - Added `openpyxl>=3.1,<4` to the backend dependencies; local install and CI both install from
    `backend/pyproject.toml`.
  - Frontend upload panel accepts `.csv` and `.xlsx`, routes by extension, rejects unsupported
    extensions before any request, shows the parsed format, and updates the Chinese CSV-only copy.
  - Tests build XLSX workbooks in memory with openpyxl; no binary fixtures were committed.
- Review and QA findings:
  - MAC-23 first QA verdict **FAIL**: duplicate headers such as `["x","x.1","x"]` produced
    duplicate labels and HTTP 500. Fixed in `7446abbb`; the task was returned to Dev, not merged.
  - MAC-24 second QA verdict **FAIL**: the optional phantom-column fix trimmed blank header
    cells, so `["x", null]` with data below returned 422 instead of matching CSV. Fixed in
    `fcf7139`; the task was returned to Dev again, not merged.
  - MAC-25 third QA verdict **PASS** after independent worktree verification of the remote SHA,
    diff scopes, both prior defects, the original contract, fuzzed headers, error statuses, and
    CSV regression.
- Tests:
  - Backend: `ruff check app tests` passed; `pytest -q` passed (66 tests, 50 dataset tests).
  - Frontend: `pnpm typecheck` passed; `pnpm test:run` passed (11 tests); `pnpm build` succeeded.
  - QA live probes confirmed known-value statistics, full-dataset computation, 10-row preview,
    missing/duplicate/non-numeric/non-finite warnings, multi-sheet policy, all documented error
    statuses, CSV parity for pure-numeric and pure-string data, and frontend endpoint routing.
- Independent QA: MAC-25, assigned to DeepSeek Worker QA, verdict **PASS**.
- Git:
  - Feature commits on `iter/4`:
    - `f2e94cbe0186a8f1578f8801573bef37a4722a7f` — XLSX import with shared validation contract.
    - `7446abbf5bb3940726477631f827e1997c0b5593` — collision-safe duplicate header labels.
    - `fcf7139c1bb1268e125f8c66520f0ea9377a9235` — preserve blank header columns backed by data.
  - Final feature commit link: https://github.com/CubicZnS/labflow/commit/fcf7139c1bb1268e125f8c66520f0ea9377a9235
  - Merge commit on `dev`: `746d502aecdd60d6e8bf98320404a3b667ae3bf4`
  - Merge link: https://github.com/CubicZnS/labflow/commit/746d502aecdd60d6e8bf98320404a3b667ae3bf4
- Known issues / limits:
  - Only the first worksheet is imported; there is no sheet picker yet.
  - Formula cells use cached values (`data_only=True`); formulas without a cached result appear as
    missing values.
  - A completely blank header row is skipped, so the first data row becomes the header.
  - Mixed-type XLSX cells may serialize numbers natively where CSV returns strings; columns,
    statistics, and warnings still match.
  - Manual table entry/editing and X/Y selection with units are not implemented.
  - The 10 MB limit still applies and the file is read before the size check.
- Next iteration: Phase 1.5 — X/Y column selection and unit labels on imported data, the bridge
  to Phase 2 fitting and Phase 3 plotting.

## Iteration #5 — Phase 1.5 X/Y pairing and units

- Date: 2026-10-21
- Goal: let a user select X and Y columns from an imported CSV/XLSX, optionally label units, and get
  an explicit paired series that fitting and plotting can consume.
- Selected backlog task: MAC-27 (Phase 1.5 — X/Y column pairing, unit labels, and paired series
  extraction). No Phase 1.5 task existed, so it was created from the roadmap.
- Branch: `iter/5`, created from `dev` at `8c5aeb98d2ba743d3895f6782c21571fb698ca51`.
- Completed:
  - `POST /api/datasets/series` accepts multipart `file`, `format` (csv/xlsx), `x_column`,
    `y_column`, and optional `x_unit`/`y_unit`, and returns the paired series contract:
    `x_column`, `y_column`, trimmed units or null, `row_count`, `pair_count`, `skipped_count`,
    every valid `pair` in file order, `x_stats`/`y_stats` over paired values, and warnings.
  - Pairing keeps only rows where both columns coerce to finite floats; every other row is skipped
    and counted once, with one explicit pairing warning in addition to the import warnings.
  - CSV and XLSX share the same frame loaders, so validation, warning order, numeric detection, and
    statistics cannot drift between formats.
  - Errors: 422 for unknown or identical columns, non-numeric columns, fewer than two valid pairs,
    units over 32 characters, and unsupported formats; 415/400/413/422 match the import endpoints
    for content type, empty, oversize, and malformed files.
  - Frontend adds `X/Y 配对与单位` after a successful import: numeric-only X/Y selects with defaults,
    optional unit inputs (max 32), distinct-column guard, loading/disabled states, Chinese error
    display, guidance when fewer than two numeric columns exist, and pair/skipped counts, units,
    and a first-10-pairs preview on success.
  - Added typed `createSeries` client and `SeriesResponse` types; no new dependencies.
- Review and QA findings:
  - MAC-28 first QA verdict **FAIL**: XLSX datetime columns passed `pd.to_numeric`, were converted
    to epoch nanoseconds, and returned 200, while the equivalent CSV ISO-date column returned 422.
    The task was returned to Dev; `dev` was not merged.
  - Fix `ae91783` rejects datetime64/timedelta64 in the series numeric check and adds four
    regression tests (XLSX datetime X/Y, CSV ISO-date, numeric XLSX success).
  - MAC-29 re-QA verdict **PASS** after independent worktree verification of the new SHA, the D1
    repro, the full adversarial suite, import-endpoint byte-parity with `dev`, and all gates.
- Tests:
  - Backend: `ruff check app tests` passed; `pytest -q` passed (91 tests, 24 series tests).
  - Frontend: `pnpm typecheck` passed; `pnpm test:run` passed (15 tests, 4 pairing tests);
    `pnpm build` succeeded.
- Independent QA: MAC-29, assigned to DeepSeek Worker QA, verdict **PASS**.
- Git:
  - Feature commits on `iter/5`:
    - `1c9541dbaff2490dbb46df0d925a73ccae2ba0f5` — X/Y pairing, units, and paired extraction.
    - `ae917839a7cff2ba595e4d93285dd820a9795a3a` — reject datetime/timedelta columns as non-numeric.
  - Final feature commit link: https://github.com/CubicZnS/labflow/commit/ae917839a7cff2ba595e4d93285dd820a9795a3a
  - Merge commit on `dev`: `760a30a2071e9928c42235269fbf29bf9bcb19d3`
  - Merge link: https://github.com/CubicZnS/labflow/commit/760a30a2071e9928c42235269fbf29bf9bcb19d3
- Known issues / limits:
  - Boolean columns are accepted as 0/1 by `/api/datasets/series` even though the import endpoints
    exclude booleans from `numeric_columns`; not exposed by the frontend.
  - Object columns mixing numbers and dates pair the numeric rows and skip the date rows rather
    than rejecting the column wholesale.
  - Only the first XLSX worksheet is imported; there is no sheet picker.
  - The 10 MB limit still applies and the file is read before the size check.
  - Manual table entry/editing remains unimplemented and is deferred until after fitting/plotting.
  - `frontend/src/lib/api.ts` has no trailing newline (cosmetic).
- Next iteration: Phase 2.1 — linear fit on the selected X/Y series with equation, R², and
  residual display, built on the existing deterministic `linear_fit` implementation.

## Iteration #6 — Phase 2.1 dataset fitting (linear, quadratic, cubic)

- Date: 2026-10-21
- Goal: let a user fit the selected X/Y series directly from the imported CSV/XLSX, choose degree
  1–3, and see the equation, R², coefficients, residual diagnostics, and a residual preview.
- Selected backlog task: MAC-31 (Phase 2.1 — dataset fit endpoint and fit panel). The backlog had
  no ready task, so it was created from the roadmap and assigned to Dev.
- Branch: `iter/6`, created from `dev` at `7060ed023a875df54716d59bfbb4b62cc758d92f`.
- Completed:
  - `POST /api/datasets/fit` accepts multipart `file`, `format`, `x_column`, `y_column`, `degree`
    (default 1, allowed 1–3), and optional `x_unit`/`y_unit`.
  - The endpoint reuses `build_series` for parsing, column validation, temporal rejection, pairing,
    skip counting, units, and warnings, and reuses `linear_fit`/`polynomial_fit` for least squares.
    No least-squares logic or CSV/XLSX parsing was duplicated.
  - Response adds `DatasetFitResponse`: column names, units, row/pair/skipped counts, degree,
    coefficients (highest power first), equation, R², pairs, fitted values, residuals, RMSE, maximum
    absolute residual, and warnings. `fitted`, `residuals`, and `pairs` stay aligned in file order.
  - Validation: invalid/non-integer/out-of-range degree 422, underdetermined `pair_count <= degree`
    422, constant X 422, unknown/identical/non-numeric columns 422, unit over 32 characters 422,
    unsupported format 422; content type 415, empty file 400, over-10 MB 413, malformed file 422,
    matching the existing import/series endpoints.
  - Frontend adds a typed `createFit` client and `FitPanel` rendered only after a successful series
    result. It offers linear/quadratic/cubic selection, loading/disabled states, Chinese error
    display with server detail, equation, R² at four decimals, coefficients, RMSE, maximum absolute
    residual, and a first-10-row preview (X, Y, fitted, residual) with a row-count caption.
  - A successful new series remounts the fit panel via `key`, clearing any previous fit result.
  - No new dependencies; existing import and series behavior is unchanged.
- Review and QA findings:
  - Lead verified the remote branch and `gh api` SHA `a461da1`, reviewed the full diff
    (`7060ed0..a461da1`: 8 allowed files, +1004/−1), and independently ran every gate before QC.
  - MAC-32 QA verdict **PASS**. QA independently confirmed known-value coefficients against
    `numpy.polyfit`/closed form, residual identity `fitted + residual == y`, noisy-fixture RMSE and
    max residual, CSV/XLSX payload parity, warning parity with `/api/datasets/series`, the complete
    error matrix including the 10 MB limit, byte-identical regression of import/series endpoints
    against `dev`, source-order pairing, and the frontend FormData/rendering/reset behavior.
  - Non-blocking observations from QA: an explicitly empty `degree` form value is treated as omitted
    and defaults to 1 (`" "` correctly returns 422); backend 422 messages remain English inside the
    Chinese UI; changing the degree after a successful fit leaves the old result visible until the
    user runs the fit again.
- Tests:
  - Backend: `ruff check app tests` passed; `pytest -q` passed (116 tests, 25 new fitting tests).
  - Frontend: `pnpm typecheck` passed; `pnpm test:run` passed (22 tests, 7 new fit tests);
    `pnpm build` succeeded.
- Independent QA: MAC-32, assigned to DeepSeek Worker QA, verdict **PASS**.
- Git:
  - Feature commit on `iter/6`: `a461da1d5216c15a313bf834802e43bed05d0951` — dataset polynomial fit
    endpoint and fit panel.
  - Feature commit link: https://github.com/CubicZnS/labflow/commit/a461da1d5216c15a313bf834802e43bed05d0951
  - Merge commit on `dev`: `48a3440c2b010ee5dc74587076b32de3ac700841`
  - Merge link: https://github.com/CubicZnS/labflow/commit/48a3440c2b010ee5dc74587076b32de3ac700841
- Known issues / limits:
  - No coefficient standard errors, confidence intervals, or measurement-error/error-bar support
    yet; uncertainty propagation remains open.
  - There is no ill-conditioned-fit warning; only underdetermined fits are rejected.
  - An empty `degree` form value defaults to 1 instead of being rejected.
  - Server validation messages are English inside the Chinese UI.
  - Changing the degree after a fit keeps the previous result until the next run.
  - Inherited: boolean columns are accepted as 0/1 by series/fit; mixed object columns skip date
    rows; only the first XLSX worksheet imports; the 10 MB file is read before the size check;
    manual table entry/editing is still unimplemented.
- Next iteration: Phase 2.2 — fit uncertainty and conditioning: coefficient standard errors and
  95% confidence intervals plus an explicit ill-conditioned-fit warning, with known-value and
  independent numerical baselines. Then Phase 2.3 adds Y-error columns and error-bar-aware inputs.


## Iteration #7 — Phase 2.2 fit uncertainty and conditioning diagnostics

- Date: 2026-10-21
- Goal: make a fit report honest uncertainty and numerical warnings, so a user can judge whether
  the coefficients are trustworthy instead of seeing only a point estimate and R².
- Selected backlog task: MAC-34 (Phase 2.2 — fit coefficient standard errors, 95% CIs, and
  ill-conditioning diagnostics). The backlog had no ready task, so it was created from the roadmap
  and assigned to Dev. QA verification was MAC-35.
- Branch: `iter/7`, created from `dev` at `201d2447cf30cc6b3921a1cd0eabf48152726104`.
- Completed:
  - `POST /api/datasets/fit` returns a typed `uncertainty` object in addition to the existing
    fields: `residual_dof`, `standard_errors`, `confidence_intervals`, `condition_number`, and
    `ill_conditioned`. Existing top-level fields, ordering, and error behavior are unchanged.
  - Uncertainty uses the shared deterministic least-squares result: `mse = SSR / residual_dof`,
    `cov = mse * pinv(XᵀX)`, coefficient standard errors from the covariance diagonal, and 95%
    two-sided CIs with `t.ppf(0.975, residual_dof)`. The covariance math lives once in
    `app/analysis.py` and is reused by both linear and polynomial fits.
  - Exactly determined fits (`pair_count == degree + 1`) stay HTTP 200 and return null standard
    errors/CIs plus one explicit warning, instead of dividing by zero or fabricating uncertainty.
  - Conditioning uses the 2-norm condition number of the unit-scaled Vandermonde design
    (`x / max(abs(x))`), so changing X units does not by itself trigger a warning. A non-finite or
    `> 1e12` condition number sets `ill_conditioned` and appends a warning with the real value.
  - `FitPanel` adds a Chinese-first coefficient uncertainty table (coefficient, standard error,
    95% CI low/high), residual degrees of freedom, condition number, a conditioning warning, and a
    note with em-dash cells when uncertainty cannot be estimated.
  - No new dependencies and no change to CSV/XLSX parsing, pairing, `/api/datasets/series`, the
    import endpoints, or the `/api/analysis/fit` response shape.
- Review and QA findings:
  - Lead verified the remote branch and `gh api` SHA `291864d`, reviewed the full diff
    (`201d244..291864d`: 8 allowed files, +572/−3), and independently ran every gate plus numerical
    probes against `scipy.stats.linregress` and t-based CIs before QA.
  - MAC-35 QA verdict **PASS**. QA independently recomputed linear/quadratic/cubic standard errors
    and CIs (deviations < 3e-15), the exact-fit null path, an ill-conditioned fixture
    (condition number 1.227e17, JSON-safe), unit-scale invariance, extreme X magnitudes, a
    rank-deficient repeated-X fit, the 14-case error matrix, endpoint regressions, and the
    frontend rendering/reset behavior.
  - Non-blocking observations: `backend/app/analysis.py` still lacks a trailing newline; the
    ill-conditioned fixture produces a benign numpy `RankWarning` from `np.polyfit`; the 1e12
    conditioning threshold is a heuristic; backend validation messages and warnings remain English
    inside the Chinese UI. No defects were found.
- Tests:
  - Backend: `ruff check app tests` passed; `pytest -q` passed (126 tests, 10 new uncertainty tests).
  - Frontend: `pnpm typecheck` passed; `pnpm test:run` passed (25 tests, 3 new uncertainty tests);
    `pnpm build` succeeded.
  - Post-merge gates on `dev` re-ran the same backend and frontend suites successfully before the
    iteration record was committed.
- Independent QA: MAC-35, assigned to DeepSeek Worker QA, verdict **PASS**.
- Git:
  - Feature commit on `iter/7`: `291864d0059c2edda9613a9af0ec777eb8c29b7c` — coefficient uncertainty
    and conditioning diagnostics.
  - Feature commit link: https://github.com/CubicZnS/labflow/commit/291864d0059c2edda9613a9af0ec777eb8c29b7c
  - Merge commit on `dev`: `2475463c467b6c9f8ff5a4756f8db342995c5c14`
  - Merge link: https://github.com/CubicZnS/labflow/commit/2475463c467b6c9f8ff5a4756f8db342995c5c14
- Known issues / limits:
  - Uncertainty is the classical ordinary-least-squares covariance assuming independent,
    identically distributed Y errors; there are no Y-error columns, error bars, or
    measurement-error propagation yet.
  - Exactly determined fits expose no uncertainty by design; the UI explains this rather than
    hiding it.
  - The ill-conditioning threshold (1e12) is a product heuristic, not a statistical guarantee.
  - Changing the degree after a successful fit still leaves the previous result visible until the
    next run; server warnings remain English inside the Chinese UI.
  - Inherited: boolean columns are accepted as 0/1 by series/fit; mixed object columns skip date
    rows; only the first XLSX worksheet imports; the 10 MB file is read before the size check;
    manual table entry/editing is still unimplemented.
- Next iteration: Phase 2.3 — Y-error columns, error bars, and measurement-error-aware uncertainty,
  reusing the same fit and uncertainty pipeline with explicit weighting rules and independent
  numerical baselines. Then Phase 3 scientific plotting can consume the fitted line and error data.


## 迭代 #8 — Phase 2.3a Y 误差列与加权最小二乘拟合

- 日期：2026-10-21
- 目标：让带有测量不确定度的实验数据可以使用绝对 Y 误差列做加权拟合，并如实报告
  加权系数、误差传播、χ² 与约化 χ²，同时保持无误差列时的既有拟合结果完全不变。
- 任务选择：MAC-37（Phase 2.3a — Y 误差列、加权拟合与误差感知不确定度）。首次独立验收
  MAC-38 判 **FAIL**；修复任务 MAC-39 完成后，复核任务 MAC-40 判 **PASS**。
- 分支：`iter/8`，从 `dev` 的 `4168609ed943ea74a9cd49e24f38220d54c3feb7` 创建。
- 已完成：
  - `POST /api/datasets/fit` 新增可选表单字段 `y_error_column` 与 `y_error_unit`。不提交时
    维持 Phase 2.2 的等权拟合；显式空串/空白串误差列返回 422，不会静默退化为等权；
    只提交单位而不提交误差列返回 422。
  - 误差列按现有 X/Y 配对规则校验：仅校验保留配对行；缺失、非有限、≤0 的 σ、
    与 X/Y 同列、不存在或非数值列均返回 422 并给出列名与数量；`1/σ²` 非有限同样 422。
    单位沿用现有规则：trim、空白为 `null`、超过 32 字符 422。
  - 加权求解集中在 `app/analysis.py` 的 `_weighted_least_squares`：系数为
    `lstsq(X·√w, y·√w)`；绝对误差协方差 `pinv(XᵀWX)`，不乘 MSE；标准误与 95% CI
    仍用 `t.ppf(0.975, residual_dof)`；`residual_dof = n − (degree + 1)`，为 0 时
    SE/CI 为 `null`。
  - `χ² = Σ wᵢrᵢ²`，`reduced_chi_squared = χ² / residual_dof`（仅加权且 dof > 0）。
    `rmse`、`max_abs_residual`、`r_squared` 保持未加权定义；条件数与
    `ill_conditioned` 规则不变。未加权路径与 Phase 2.2 数值一致。
  - 响应新增 `weighted`、`y_error_column`、`y_error_unit`、`y_errors`（与 `pairs`
    同序对齐）、`chi_squared`、`reduced_chi_squared`；加权且约化 χ² 不在 `[0.1, 10]`
    时追加一条确定性警告。JSON 不输出 NaN/Infinity。
  - 前端 `FitPanel` 新增中文优先的 Y 误差列下拉（排除 X/Y，默认“不使用（等权拟合）”）、
    单位输入（maxLength 32）、加权/等权标识、误差列/单位、χ²/约化 χ² 展示，以及预览表
    “Y 误差”列；新 series 仍重置拟合结果。
- 审查与验收发现：
  - Lead 独立复核 diff、远端 SHA 与全部 gate，并用自建 n=30、非均匀 σ 的 fixture 对
    `scipy.optimize.curve_fit(absolute_sigma=True)` 校验，系数与 SE 偏差 ≤ 4.5e-9。
  - MAC-38 发现两个问题：(1) `y_error_column=""` 与单独 `y_error_unit=""` 返回 200，
    误差列被静默丢弃；(2) 认为分支缺少中文迭代记录。代码缺陷经 Lead 复现后由 MAC-39
    修复；中文记录项按流程由 Lead 在 QA PASS 后创建合并/记录 commit 补齐，本轮记录、
    merge commit 与记录 commit 均为中文。
  - MAC-40 复核确认 7 条空串/单位行为、multipart 读取、WLS 数值、回归路径与全部 gate
    通过，无缺陷，判 **PASS**。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest` **155 passed**（新增加权数值基线、精确决定、
    对齐、校验矩阵、警告阈值、CSV/XLSX 一致性及空串回归）。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **30 passed**；`pnpm build` 成功。
  - 合并后在 `dev` 上重跑同一组后端与前端 gate，全部通过后才提交本记录。
- 独立 QA：MAC-40，DeepSeek Worker QA，结论 **PASS**（MAC-38 首轮 **FAIL** 已闭环）。
- Git：
  - `iter/8` 功能提交：`7c47690349717fafae2465494391cbfd0b5d1080`
    https://github.com/CubicZnS/labflow/commit/7c47690349717fafae2465494391cbfd0b5d1080
  - `iter/8` 修复提交：`93a10139e07168357ea314348d9ae39b3bee722f`
    https://github.com/CubicZnS/labflow/commit/93a10139e07168357ea314348d9ae39b3bee722f
  - `dev` 合并提交：`7b2fbcb25191c1505340d8701ce9573ae543065a`
    https://github.com/CubicZnS/labflow/commit/7b2fbcb25191c1505340d8701ce9573ae543065a
- 已知限制：
  - 加权拟合把提供的 σ 视为绝对值并假设误差相互独立；不估计额外方差缩放。
  - 拟合曲线与误差棒尚未在图表中绘制（属于 Phase 3）。
  - 更改误差列后，之前输入的单位仍会保留（仅 UX 陈旧，不影响计算）。
  - 直接调用 `linear_fit`/`polynomial_fit` 并传入 `inf` σ 会产生 0 权重而不报错；
    HTTP 端点会正确拒绝，因此用户不可达。
  - 服务端校验消息与警告仍为英文（中文 UI 内），沿用历史限制。
  - 继承限制：布尔列按 0/1 参与拟合；混合对象列会跳过日期行；仅导入第一个 XLSX
    worksheet；10 MB 文件在大小检查前已被读取；手工表格录入仍未实现。
- 下一轮：Phase 3.1 — 科学绘图第一步：基于已配对 X/Y 系列渲染 SVG 散点图，包含轴标签/
  单位、自动范围与空数据/单点提示，不新增第三方图表依赖；随后 3.2 叠加拟合曲线与 Y 误差棒，
  3.3 多系列与样式控制，3.4 PNG/SVG 导出。
