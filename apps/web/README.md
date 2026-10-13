# EERS Web

Next.js frontend for discovering businesses, writing reviews, exploring rankings, and customer, owner, and administrator workflows. Uses React, Tailwind CSS, TanStack Query, React Hook Form, and Zod.

## Run the portfolio demo

Follow the [root setup guide](../../README.md) to start and seed the backend. From the repository root:

```sh
pnpm --filter web portfolio:dev
```

Open `http://localhost:3101`. The command loads `portfolio.env.example` and connects to the portfolio API at `http://localhost:3100/api/v1` unless your shell overrides the environment. Demo accounts are listed in the root guide.

## Structure

- `app/(main)` and other route directories: pages and layouts.
- `app/features/<feature>`: feature components, queries, mutations, validation schemas, and types.
- `app/components`: shared UI.
- `app/hooks`: cross-feature hooks.
- `app/lib`: API client, query keys, utilities, and design tokens.
- `public`: static assets.
- `figma`: design references; these are mockups, not proof of implemented behavior.

The API client keeps access tokens in memory and uses cookies for refresh requests. TanStack Query manages server state; form schemas validate browser input. Backend validation and authorization remain authoritative.

## Verification

Run from the repository root:

```sh
pnpm --filter web exec tsc --noEmit
pnpm --filter web lint
pnpm --filter web build
```

`pnpm portfolio:check` combines the TypeScript check with backend compilation and tests; it does not include web lint or the Next.js production build. CI runs both separately. A successful type check is not a browser workflow test.

See the [portfolio walkthrough](../../docs/PORTFOLIO.md) and [contribution guide](../../CONTRIBUTING.md) for demo and organization conventions.
