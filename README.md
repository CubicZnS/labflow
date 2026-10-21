# LabFlow

Research data analysis and scientific plotting, from raw measurements to report-ready figures.

LabFlow is a SaaS product for students, researchers, and labs. The MVP focuses on a reliable,
reproducible workflow: import experimental data, validate columns, run deterministic statistics,
fit models, plot results, and export figures. AI is optional guidance, never a replacement for
numeric computation.

## Status

Phase 0 — bootstrap. The repository contains a runnable FastAPI backend, a React/Vite/Tailwind
frontend shell, deterministic analysis functions with tests, and CI. Product features are added
iteration by iteration in `docs/ITERATION_LOG.md`.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Python 3.12, FastAPI, NumPy, Pandas, SciPy
- Storage: SQLite (introduced in a later iteration)
- Tests: Pytest, Vitest
- CI: GitHub Actions

## Quick start

### Backend

```sh
cd backend
PYTHON_BIN=${PYTHON_BIN:-python3}
$PYTHON_BIN -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

API health: <http://127.0.0.1:8000/api/health>

Python 3.12+ is required. If your `python3` is older, set `PYTHON_BIN` to a 3.12+ interpreter
before creating the virtual environment.

### Frontend

```sh
cd frontend
pnpm install
pnpm dev
```

Open <http://127.0.0.1:5173>. Vite proxies `/api` to the backend on port 8000.

### Docker

```sh
docker compose up --build
```

- Frontend: <http://127.0.0.1:8080>
- Backend: <http://127.0.0.1:8000/api/health>

The frontend nginx container proxies `/api` to the backend service.

### Tests

```sh
cd backend && .venv/bin/python -m pytest
cd frontend && pnpm test:run
cd frontend && pnpm build
```

## Repository layout

```text
backend/       FastAPI app and deterministic analysis functions
frontend/      React application shell
docs/          Roadmap, architecture, testing, decisions, iteration log
.github/       CI workflow
```

## Git workflow

- `main` is the stable branch and is only updated by human-approved merges/releases.
- Each unattended iteration uses an `iter/N` branch, is validated by QA, and is pushed to GitHub.
- Integration work lands on `dev` after QA. Automated agents never force-push.
- Every successful iteration records a real commit SHA and remote branch in `docs/ITERATION_LOG.md`.

## Guardrails

- No secrets or user data in Git.
- No real billing, purchases, or production deployment without approval.
- Numeric results are produced by tested deterministic code.
- Uploaded data is not sent to third-party AI services.