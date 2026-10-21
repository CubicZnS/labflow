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