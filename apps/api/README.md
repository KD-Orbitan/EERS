# EERS API

NestJS backend for business discovery, reviews, moderation, notifications, and rankings. PostgreSQL is accessed through Prisma; Redis supports caching.

## Run the portfolio demo

Follow the [root setup guide](../../README.md) first. From the repository root, after infrastructure, migrations, and seed are ready:

```sh
pnpm --filter api portfolio:dev
```

The portfolio API is at `http://localhost:3100/api/v1`; generated OpenAPI documentation is at `http://localhost:3100/docs`. This command loads `portfolio.env.example`. Demo accounts and optional Google/Cloudinary setup are documented in the root guide.

## Structure

- `src/modules`: business capabilities, generally split into domain, application, infrastructure, and presentation layers.
- `src/common`: shared guards, decorators, exceptions, HTTP handling, and ports.
- `src/infrastructure`: database, cache, storage, and sentiment adapters.
- `src/jobs`: background-job implementations; inspect module registration to determine which are active.
- `src/configure-http-app.ts`: HTTP configuration shared by bootstrap and contract tests.
- `prisma`: schema, migration history, and datasets.
- `test`: HTTP integration tests; feature unit tests live under `src/modules`.

Some Admin use cases still access Prisma directly. Architecture tests protect established boundaries; the project does not claim complete architecture compliance.

## Verification

Run from the repository root:

```sh
pnpm --filter api exec prisma generate
pnpm --filter api build
pnpm --filter api exec jest --runInBand
pnpm --filter api test:e2e --runInBand
```

The current HTTP suite uses real controllers and middleware with mocked use cases. It does not require PostgreSQL or Redis and is not a database end-to-end suite. `pnpm portfolio:check` also checks frontend TypeScript.

Use the [documentation index](../../docs/README.md) for API specifications, business workflows, and contribution conventions. Follow only the portfolio seed commands for the English demo; other seed/backfill files are task-specific tools.
