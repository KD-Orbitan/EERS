# Contributing to EERS

Use the [root README](README.md) for prerequisites and local portfolio setup. Run commands below from the repository root; use `pnpm.cmd` on PowerShell if script execution is restricted.

## Code organization

- `apps/api/src/modules/<feature>` owns a backend business capability. Keep controllers in `presentation`, orchestration in `application`, business contracts in `domain`, and external adapters in `infrastructure`.
- New application use cases should depend on ports rather than directly on Prisma, Redis, or external SDKs. Some existing Admin use cases still need this refactor.
- Put backend feature tests in the feature's `tests` directory by default. Existing colocated tests can stay until that area is being changed. HTTP integration tests live in `apps/api/test`.
- `apps/web/app/features/<feature>` owns frontend components, queries, mutations, schemas, and feature types. Shared UI belongs in `app/components`; cross-feature utilities belong in `app/lib`.
- Keep route pages focused on composition. Extract reusable behavior when it has a clear owner rather than adding global helpers for every feature.
- `packages/shared-types` and `packages/shared-constants` hold genuinely shared contracts and values. Browser-only view models stay in the web application.

Read the [technical decisions](docs/DECISIONS.md) when changing behavior. Update relevant documentation alongside implementation; the [documentation index](docs/README.md) distinguishes references from historical plans.

## Checks

```sh
pnpm portfolio:check
```

This covers frontend TypeScript, API compilation, backend unit tests, and authentication HTTP contract tests with mocked use cases. It does not cover full browser journeys or database integration. CI also runs frontend lint, the web production build, and Docker image builds.

## What belongs in Git

Commit application source, tests, dependency lockfiles, Prisma schema and migrations (including `migration_lock.toml`), CI, Docker configuration, sanitized environment examples, and maintained documentation. Keep migration history intact.

Keep actual credentials, environment overrides, generated output, local assistant settings, scratch files, and personal prompt drafts outside version control. Design references may remain under `apps/web/figma`; label them as mockups rather than screenshots of implemented behavior.

The root `/report/` directory is a local academic artifact. The backend and frontend `report` feature directories are application source and must remain trackable. Use root-anchored ignore patterns for root-only artifacts.

Adding a tracked file to `.gitignore` does not untrack it. For deliberately local files, `git rm --cached -- <file>` preserves the working copy while staging removal from the repository. This does not erase prior commits.

Before committing, review `git diff`, `git diff --cached`, and `git status --short`. Commit related changes together; avoid mixing generated demo data, feature changes, and documentation cleanup into one unexplained commit.

## Data scripts

The supported English demo entry points are `portfolio:migrate`, `portfolio:seed`, and `portfolio:preview` (see the root README). Other seed and backfill scripts under `apps/api/prisma` and maintenance scripts under `apps/api/scripts` are task-specific tools, not steps to run as a batch. Inspect their target database, assumptions, and apply flags before use. Do not run data scripts merely to verify a documentation change.
