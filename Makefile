PYTHON_BIN ?= python3

.PHONY: backend-install backend-test frontend-install frontend-test frontend-build test

backend-install:
	cd backend && $(PYTHON_BIN) -m venv .venv && .venv/bin/pip install -e ".[dev]"

backend-test:
	cd backend && .venv/bin/python -m pytest -q

frontend-install:
	cd frontend && pnpm install

frontend-test:
	cd frontend && pnpm test:run

frontend-build:
	cd frontend && pnpm build

test: backend-test frontend-test frontend-build