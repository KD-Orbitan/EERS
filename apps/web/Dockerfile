# Build context must be the monorepo root:
#   docker build -f apps/web/Dockerfile -t eers-web .
FROM node:22-bookworm-slim AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo@1.13.4 prune --scope=web --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# Next.js reads NEXT_PUBLIC_* vars at build time and inlines them into the
# client bundle, so they must be passed as build args, not just runtime env.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
RUN pnpm exec turbo run build --filter=web...

FROM base AS runner
WORKDIR /app
RUN groupadd --system --gid 1001 nextjs && useradd --system --uid 1001 --gid nextjs nextjs
# Next.js standalone output only includes the files actually needed to run
# (a pruned node_modules + server.js) — see next.config.ts's output: 'standalone'.
COPY --from=installer --chown=nextjs:nextjs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nextjs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nextjs /app/apps/web/public ./apps/web/public
USER nextjs
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "apps/web/server.js"]
