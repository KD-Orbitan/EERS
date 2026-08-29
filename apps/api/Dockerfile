# Build context must be the monorepo root:
#   docker build -f apps/api/Dockerfile -t eers-api .
#
# Debian slim (not alpine) on purpose: @xenova/transformers pulls in
# onnxruntime-node, which has a history of missing-library failures on
# musl/alpine; Prisma also needs openssl, which is simpler to get right
# on Debian.
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo@1.13.4 prune --scope=api --docker

FROM base AS installer
WORKDIR /app
# bcrypt needs to compile its native binding if no prebuilt binary matches.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter api exec prisma generate --schema=prisma/schema.prisma
RUN pnpm exec turbo run build --filter=api...
# Bake the sentiment model into the image so containers don't spend ~2min
# downloading it on every cold start (a real problem on free-tier hosts
# that spin down on idle). Same model/task SentimentService loads at runtime.
RUN node apps/api/scripts/prefetch-model.mjs

FROM base AS runner
WORKDIR /app
RUN groupadd --system --gid 1001 nestjs && useradd --system --uid 1001 --gid nestjs nestjs
# --chown matters: @xenova/transformers downloads its model into a .cache/
# folder under its own node_modules path at runtime, so that tree needs to
# be writable by the user the container actually runs as.
COPY --chown=nestjs:nestjs --from=installer /app .
USER nestjs
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/api/dist/apps/api/src/main.js"]
