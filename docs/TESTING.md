# Testing Strategy

## Backend

```sh
cd backend
.venv/bin/python -m pytest -q
```

Required coverage areas:

- Known-value tests for mean, sample standard deviation, and standard error.
- Exact linear fits and polynomial fits with known coefficients.
- R-squared, residual, and invalid-input behavior.
- API contract tests for health, statistics, fitting, and validation errors.

Numerical tests must use explicit expected values from formulas or independent baselines.
AI-generated output is never an oracle.

## Frontend

```sh
cd frontend
pnpm test:run
pnpm build
```

Phase 0 covers the application shell and API-status behavior. Later phases add upload-to-chart
flow tests and viewport checks.

## Docker

```sh
docker compose up --build
```

Use this for a production-like local smoke test. The frontend container serves the static build
and proxies `/api` to the backend container.

## CI

GitHub Actions runs backend tests and frontend typecheck/test/build on every push and pull request.
A red CI run blocks a successful iteration.

## Iteration acceptance gate

- Task acceptance criteria pass.
- Relevant automated tests pass.
- The project builds.
- No new severe regression.
- Documentation matches behavior.
- A real commit exists and is pushed to the remote.
- The commit SHA is recorded in `docs/ITERATION_LOG.md`.