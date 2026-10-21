# Architecture and Product Decisions

## ADR-001 — Monorepo with separate frontend and backend

Status: accepted.

A single repository keeps product, API, tests, and documentation synchronized for a small team.
The frontend and backend remain independently deployable.

## ADR-002 — Python numerical core with deterministic tests

Status: accepted.

NumPy/SciPy/Pandas provide mature, auditable numerical primitives. Analysis functions are pure
and tested against known values. AI is not in the calculation path.

## ADR-003 — Local-first SQLite persistence

Status: accepted for MVP.

SQLite minimizes operational cost and supports local project files. A managed database is
deferred until collaboration and cloud sync are validated.

## ADR-004 — No AI dependency in the MVP

Status: accepted.

The MVP does not call an LLM. Optional explanation/guidance can be added after the deterministic
workflow is reliable, behind explicit consent and cost controls.

## ADR-005 — Branch and release workflow

Status: accepted.

`main` is stable and human-approved. Automated iterations push to `iter/N` branches, pass QA, and
merge to `dev`. No force-push. Every successful iteration records a real remote commit SHA.

## ADR-006 — No real billing or production deployment without approval

Status: accepted.

Pricing is a hypothesis. Payment integration, paid acquisition, and production releases require
explicit human approval and real user evidence.

## ADR-007 — Portable Rollup WASM build

Status: accepted for Phase 0.

The local Mac mini runtime uses a hardened Node binary that rejects linker-signed native Rollup
modules. The frontend therefore pins `rollup` to `@rollup/wasm-node` via `pnpm-workspace.yaml`.
This keeps local builds and CI portable across hardened and standard Node environments at a small
build-performance cost. Revisit when the local runtime or Rollup native loading changes.