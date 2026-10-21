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
