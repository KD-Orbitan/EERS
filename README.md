# EERS — Enterprise Evaluation & Ranking System

An English-language portfolio project for discovering businesses, writing multi-criteria reviews, and exploring transparent business rankings. Built with Next.js, NestJS, PostgreSQL, Prisma, and Redis in a pnpm monorepo.

## Features

- Business discovery with category and location filters, maps, and profile pages.
- Customer reviews with criterion scores, owner replies, and sentiment summaries.
- Rankings combining multi-criteria scores, reviewer trust, fraud signals, time decay, and Bayesian adjustment.
- Customer, business-owner, and administrator workflows with role-based access.
- JWT authentication, moderation, reports, bookmarks, and notifications.
- OpenAPI documentation served by the backend at `/docs`.

## English portfolio edition

Branch: `portfolio/english`. The demo contains **15 fictional businesses**, **90 English reviews**, **5 categories**, **4 criteria**, **360 criterion ratings**, and **15 owner replies** across three cities in Vietnam. Names, descriptions, reviews, replies, and locations are supplied in English or Romanised form. Prices remain in VND and opening hours use Vietnam local time.

All demo businesses, people, and reviews are fictional. Map coordinates are illustrative; links and emails use the reserved `example.invalid` domain. Sentiment labels are authored demo data. Rankings are computed using the application's actual ranking services. Ranking history starts when the seed runs; historical trends are not fabricated.

The original Vietnamese seed scripts remain available for the original project. **Use only the portfolio commands below for this edition.** Git branches do not isolate databases, so this setup uses a separate PostgreSQL volume, Redis instance, database name, and application ports.

## Run locally

Requirements: Node.js 22+, pnpm 11.9, and Docker Desktop running Linux containers. On PowerShell systems that block `.ps1` scripts, use `pnpm.cmd` in place of `pnpm`.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter api exec prisma generate
pnpm portfolio:infra
pnpm portfolio:migrate
pnpm portfolio:seed
pnpm portfolio:dev
```

| Service | URL |
| --- | --- |
| Web application | http://localhost:3101 |
| API | http://localhost:3100/api/v1 |
| API documentation | http://localhost:3100/docs |

The commands load `apps/api/portfolio.env.example` and `apps/web/portfolio.env.example` explicitly, leaving your existing `.env` files untouched. These files contain local demo settings only. Environment variables already exported in your shell take precedence; start from a shell without existing `DATABASE_URL`, `REDIS_URL`, `PORT`, or `NEXT_PUBLIC_API_URL` overrides.

PostgreSQL listens on `55432`; Redis listens on `56379`. Both are bound to localhost. To stop the demo infrastructure while retaining its data:

```sh
docker compose -f docker-compose.portfolio.yml stop
```

To inspect the seed plan without connecting to the database:

```sh
pnpm --filter api portfolio:preview
```

Seeding is transactional and requires the dedicated `eers_portfolio` database. Re-running against the original demo dataset preserves existing records and refreshes rankings. It refuses databases containing other users or businesses; use a fresh portfolio database if you have expanded the demo.

## Demo accounts

Local demo password: `PortfolioDemo2026!` (configured by `PORTFOLIO_DEMO_PASSWORD` before the first seed).

| Role | Email |
| --- | --- |
| Administrator | `admin@portfolio.example.invalid` |
| Business owner | `owner@portfolio.example.invalid` |
| Customer | `reviewer1@portfolio.example.invalid` |

Other customers are `reviewer2` through `reviewer6` at the same domain. To demonstrate creating a new review, register a new customer: the seeded customers already reviewed every demo business. Password changes in the example environment do not change already seeded accounts.

Google login and image uploads require your own Google OAuth and Cloudinary configuration. Public hosting also requires private credentials, production URLs, HTTPS, and a dedicated hosted database/cache; the checked-in settings are for local demonstration.

## Architecture

Browse the [documentation index](docs/README.md) for technical references, contribution conventions, and the distinction between current documentation and implementation history.

```text
apps/web                 Next.js / React / Tailwind / TanStack Query
apps/api                 NestJS API and background jobs
apps/api/prisma          PostgreSQL schema, migrations, and demo datasets
packages/shared-types    Shared TypeScript contracts
packages/shared-constants Shared application constants
```

The API separates domain, application, and infrastructure concerns. PostgreSQL stores application data and ranking snapshots; Redis caches ranking results. The ranking pipeline derives criterion scores, trust and fraud signals, review weights, and adjusted business scores before publishing snapshots.

## Suggested portfolio walkthrough

See the [full-stack portfolio guide](docs/PORTFOLIO.md) for an architecture diagram, code references, a five-minute demo, and CV bullet examples.

1. Browse businesses and filter by category or city.
2. Open a profile to inspect reviews, criterion scores, and sentiment summaries.
3. Compare businesses in the ranking page and explain the scoring methodology.
4. Sign in as the owner to explore business dashboards and reply to feedback.
5. Sign in as the administrator to demonstrate moderation and configuration.

## Validation

```sh
pnpm portfolio:check
```

This runs frontend TypeScript checks, the API build, backend unit tests, and authentication HTTP contract tests. The HTTP tests use real controllers and middleware with mocked application use cases; they require no database and are not full browser end-to-end tests. CI also runs frontend lint, the web production build, and Docker image builds on `main` and `portfolio/**` branches and pull requests targeting those branches.

The portfolio seed verifies business, review, criterion-rating, and global-ranking counts after it runs. Add your hosted demo URL, screenshots, and a short architecture walkthrough to this README when publishing the project for your CV.
