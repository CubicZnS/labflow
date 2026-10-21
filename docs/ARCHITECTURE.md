# LabFlow Architecture

## Shape

LabFlow is a small monorepo with two deployable units:

```text
frontend/  React + TypeScript + Vite + Tailwind
backend/   FastAPI + Python numerical core
```

The frontend calls the backend under `/api`. In development, Vite proxies `/api` to
`http://127.0.0.1:8000`. In production, the frontend static build is served by a reverse proxy
that forwards `/api` to the backend.

## Backend

- `app/main.py` exposes HTTP routes and CORS configuration.
- `app/analysis.py` contains pure, deterministic numerical functions.
- `app/schemas.py` defines request/response contracts with Pydantic.
- Numerical code must not depend on network access, LLM output, or UI state.
- Core functions raise explicit errors for invalid or ill-conditioned inputs.

Future persistence will use SQLite for local-first projects, then a managed relational database
only when multi-user cloud deployment is justified.

## Frontend

- React function components and TypeScript strict mode.
- Tailwind for a restrained scientific/SaaS visual system.
- API access is isolated in `src/lib/api.ts`.
- Chart rendering will be added in Phase 3 with a tested charting library; chart configuration
  will be stored as serializable data, not opaque component state.

## Data flow

```text
upload/table -> validation -> normalized dataset -> deterministic analysis -> chart spec
             -> export (PNG/SVG/CSV) -> saved project
```

Every derived number must be traceable to a formula, input columns, units, and settings.

## Security and privacy

- No API keys, tokens, database credentials, or user data in Git.
- Uploaded data is processed locally by default and is never sent to third-party AI services.
- File uploads will be size/type limited and parsed with defensive libraries.
- The MVP has no real payment or production deployment path.

## Deployment

Phase 0 is local-first. Containerization and a staging deployment are later, low-risk steps and
require explicit approval before anything touches real users.

## Non-goals

Microservices, event buses, Kubernetes, real-time collaboration, and a custom ML stack are
premature for the MVP.