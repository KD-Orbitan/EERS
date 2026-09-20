# PLAYBOOK-API.md

# Enterprise Evaluation & Ranking System (EERS)
# Backend Implementation Playbook

Version: 1.0
Status: Locked
Priority: 5th (see DECISIONS.md D-027)
Applies to: NestJS backend at apps/api

---

## How to use this document

This document tells the agent WHAT to build and IN WHAT ORDER.

Rules:

```
- Read DECISIONS.md first, then SCHEMA.md, then this file
- Complete phases in order — do not skip ahead
- Complete ALL tasks in a phase before moving to next phase
- After each module: run tests, fix failures, then report
- Do NOT invent files, folders, or logic not listed here
- When unsure about business logic → check WORKFLOWS.md
- When unsure about API shape → check API.md
- When unsure about schema → check SCHEMA.md
```

Checkpoint format after each module:

```
✓ Files created: [list]
✓ Tests passed: [X/X]
✓ Migration applied: yes/no
✓ Ready for next module: yes/no
```

---

## Repository Structure

```
eers/
├── apps/
│   ├── api/                  ← work here
│   └── web/                  ← ignore for this playbook
├── packages/
│   ├── shared-types/
│   ├── shared-constants/
│   └── shared-utils/
├── docs/
├── package.json              ← pnpm workspace root
├── pnpm-workspace.yaml
└── turbo.json
```

Backend root: `apps/api/`

```
apps/api/
├── src/
│   ├── modules/
│   ├── common/
│   ├── infrastructure/
│   ├── config/
│   ├── jobs/
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── test/
├── .env.example
└── package.json
```

---

## Module Structure Template

Every module follows this exact structure.
Copy this template when creating a new module.

```
src/modules/<name>/
├── application/
│   ├── commands/
│   ├── queries/
│   ├── dto/
│   ├── use-cases/
│   └── validators/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── exceptions/
├── infrastructure/
│   └── repositories/
├── presentation/
│   └── controllers/
└── <name>.module.ts
```

---

# Phase 0 — Monorepo Bootstrap

**Goal:** Working monorepo with all tooling configured.

---

## Task 0.1 — Init monorepo

```bash
mkdir eers && cd eers
pnpm init
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test":  { "dependsOn": ["^build"] },
    "dev":   { "cache": false, "persistent": true }
  }
}
```

---

## Task 0.2 — Create shared packages

Create `packages/shared-types/`:

```
packages/shared-types/
├── src/
│   ├── enums/
│   │   ├── user-status.enum.ts
│   │   ├── business-status.enum.ts
│   │   ├── review-status.enum.ts
│   │   ├── report-status.enum.ts
│   │   └── sentiment-type.enum.ts
│   ├── interfaces/
│   │   └── pagination-meta.interface.ts
│   └── index.ts
└── package.json
```

Create `packages/shared-constants/`:

```
packages/shared-constants/
├── src/
│   ├── cache-keys.ts
│   ├── notification-types.ts
│   ├── log-actions.ts
│   ├── ranking-scopes.ts
│   └── index.ts
└── package.json
```

Values for `cache-keys.ts`:

```typescript
export const CACHE_KEYS = {
  RANKING_GLOBAL:   'ranking:global',
  RANKING_CATEGORY: (id: number) => `ranking:category:${id}`,
  RANKING_PROVINCE: (name: string) => `ranking:province:${name}`,
  BUSINESS_DETAIL:  (id: number) => `business:${id}`,
} as const
```

Values for `notification-types.ts`:

```typescript
export const NOTIFICATION_TYPE = {
  BUSINESS_APPROVED: 'BUSINESS_APPROVED',
  BUSINESS_REJECTED: 'BUSINESS_REJECTED',
  REVIEW_APPROVED:   'REVIEW_APPROVED',
  REVIEW_REJECTED:   'REVIEW_REJECTED',
  REPORT_RESOLVED:   'REPORT_RESOLVED',
  NEW_REPLY:         'NEW_REPLY',
} as const
```

Values for `log-actions.ts`:

```typescript
export const LOG_ACTION = {
  LOGIN_SUCCESS:          'LOGIN_SUCCESS',
  LOGOUT:                 'LOGOUT',
  PASSWORD_CHANGED:       'PASSWORD_CHANGED',
  BUSINESS_CREATED:       'BUSINESS_CREATED',
  BUSINESS_APPROVED:      'BUSINESS_APPROVED',
  BUSINESS_REJECTED:      'BUSINESS_REJECTED',
  BUSINESS_DELETED:       'BUSINESS_DELETED',
  REVIEW_CREATED:         'REVIEW_CREATED',
  REVIEW_APPROVED:        'REVIEW_APPROVED',
  REVIEW_REJECTED:        'REVIEW_REJECTED',
  REVIEW_DELETED:         'REVIEW_DELETED',
  REPORT_RESOLVED:        'REPORT_RESOLVED',
  USER_BANNED:            'USER_BANNED',
  RANKING_RECALCULATED:   'RANKING_RECALCULATED',
} as const
```

Values for `ranking-scopes.ts`:

```typescript
export const RANKING_SCOPE = {
  GLOBAL:   'GLOBAL',
  CATEGORY: 'CATEGORY',
  PROVINCE: 'PROVINCE',
} as const
```

---

## Task 0.3 — Init NestJS app

```bash
cd apps
npx @nestjs/cli new api --package-manager pnpm --skip-git
```

Install dependencies:

```bash
cd api
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/schedule
pnpm add passport passport-jwt passport-local
pnpm add @prisma/client prisma
pnpm add bcrypt class-validator class-transformer
pnpm add ioredis
pnpm add cloudinary multer @nestjs/platform-express
pnpm add @nestjs/swagger swagger-ui-express
pnpm add google-auth-library

pnpm add -D @types/bcrypt @types/multer @types/passport-jwt @types/passport-local prisma
```

---

## Task 0.4 — Configure environment

Create `apps/api/.env.example`:

```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eers

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cookie
COOKIE_SECRET=change-me-cookie-secret
```

Create `apps/api/src/config/` with these files:

```
config/
├── app.config.ts
├── database.config.ts
├── jwt.config.ts
├── redis.config.ts
└── cloudinary.config.ts
```

Use `@nestjs/config` with `ConfigModule.forRoot({ isGlobal: true })`.

---

## Task 0.5 — Setup Prisma schema

Copy the full Prisma schema from `SCHEMA.md` into:

```
apps/api/prisma/schema.prisma
```

Then run:

```bash
npx prisma migrate dev --name init
```

Add FTS indexes and images CHECK constraint as raw SQL in the migration file
(see SCHEMA.md — Full Text Search Indexes section).

Verify migration applies cleanly:

```bash
npx prisma migrate status
```

---

## Task 0.6 — Setup global infrastructure

Create these files:

```
src/common/
├── filters/
│   └── global-exception.filter.ts    ← maps domain exceptions to HTTP codes
├── interceptors/
│   └── response.interceptor.ts       ← wraps responses in { success, data } envelope
├── pipes/
│   └── validation.pipe.ts
├── decorators/
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
└── guards/
    ├── jwt-auth.guard.ts
    └── roles.guard.ts

src/infrastructure/
├── database/
│   └── prisma.service.ts
├── cache/
│   └── redis.service.ts
└── storage/
    └── cloudinary.service.ts
```

Register in `main.ts`:

```typescript
app.setGlobalPrefix('api/v1')
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
app.useGlobalFilters(new GlobalExceptionFilter())
app.useGlobalInterceptors(new ResponseInterceptor())
```

---

## Task 0.7 — Setup Swagger

```typescript
const config = new DocumentBuilder()
  .setTitle('EERS API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('docs', app, document)
```

---

## Task 0.8 — Setup seed

Create `apps/api/prisma/seed.ts` with:

```
1. Seed roles: USER, BUSINESS_OWNER, ADMIN
2. Seed categories: (see SCHEMA.md categories seed data)
3. Seed reasons: (see SCHEMA.md reasons seed data)
```

Run:

```bash
npx prisma db seed
```

---

## Task 0.9 — Health check endpoint

Create `src/modules/health/health.controller.ts`:

```
GET /health → { status: 'ok', timestamp: ISO-8601 }
```

---

## Phase 0 — Definition of Done

```
✓ pnpm install runs without errors
✓ shared-types, shared-constants packages build
✓ npx prisma migrate dev --name init succeeds
✓ npx prisma db seed succeeds
✓ Application boots: pnpm dev
✓ GET /health returns 200
✓ Swagger loads at /docs
✓ .env.example has all required keys
✓ pnpm --filter @eers/shared-types build   → thành công
✓ pnpm --filter @eers/shared-constants build → thành công
✓ import từ @eers/shared-types trong apps/api không báo lỗi TypeScript
```

---

# Phase 1 — Auth Module

**Depends on:** Phase 0
**Workflows:** WF-AUTH-001 to WF-AUTH-005
**APIs:** API.md Chapter 1

---

## Task 1.1 — Module structure

Create `src/modules/auth/` using the module template.

---

## Task 1.2 — Domain layer

Create:

```
domain/entities/user.entity.ts
domain/repositories/user.repository.ts          ← abstract class
domain/repositories/refresh-token.repository.ts ← abstract class
domain/exceptions/auth.exceptions.ts
```

Exceptions to define (see WORKFLOWS.md Section 12):

```
InvalidCredentialsException
InvalidRefreshTokenException
TokenExpiredException
InvalidGoogleTokenException
UserBannedException
```

---

## Task 1.3 — Infrastructure layer

Create:

```
infrastructure/repositories/prisma-user.repository.ts
infrastructure/repositories/prisma-refresh-token.repository.ts
```

---

## Task 1.4 — Application layer

Create one file per use case:

```
application/use-cases/register.use-case.ts        ← WF-AUTH-001
application/use-cases/login.use-case.ts            ← WF-AUTH-002
application/use-cases/google-auth.use-case.ts      ← WF-AUTH-003
application/use-cases/refresh-token.use-case.ts    ← WF-AUTH-004
application/use-cases/logout.use-case.ts           ← WF-AUTH-005
```

Create DTOs:

```
application/dto/register.dto.ts
application/dto/login.dto.ts
application/dto/google-auth.dto.ts
```

---

## Task 1.5 — Presentation layer

Create:

```
presentation/controllers/auth.controller.ts
```

Routes (in registration order — see API.md):

```
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

---

## Task 1.6 — JWT strategy

Create:

```
src/common/strategies/
├── jwt.strategy.ts          ← validates access token
└── jwt-refresh.strategy.ts  ← reads HttpOnly cookie
```

---

## Task 1.7 — Tests

Create:

```
src/modules/auth/tests/
├── register.use-case.spec.ts
├── login.use-case.spec.ts
├── refresh-token.use-case.spec.ts
└── auth.controller.spec.ts
```

Required test cases:

```
register:
  ✓ creates user with hashed password
  ✓ throws EMAIL_ALREADY_EXISTS if email taken

login:
  ✓ returns accessToken on valid credentials
  ✓ sets refreshToken cookie
  ✓ throws INVALID_CREDENTIALS on wrong password
  ✓ throws INVALID_CREDENTIALS on unknown email
  ✓ throws USER_BANNED if user is banned

refresh:
  ✓ returns new accessToken on valid cookie
  ✓ throws INVALID_REFRESH_TOKEN on missing cookie
  ✓ throws TOKEN_EXPIRED on expired token

logout:
  ✓ revokes refresh token
  ✓ clears cookie
```

Run:

```bash
pnpm test --filter=api
```

---

## Phase 1 — Definition of Done

```
✓ POST /auth/register works
✓ POST /auth/login returns accessToken + sets cookie
✓ POST /auth/refresh returns new accessToken
✓ POST /auth/logout clears cookie
✓ GET  /auth/me returns current user
✓ JwtAuthGuard protects routes correctly
✓ All auth tests pass
✓ Swagger shows auth endpoints
```

---

# Phase 2 — User Module

**Depends on:** Phase 1
**Workflows:** WF-USER-001 to WF-USER-003
**APIs:** API.md Chapter 2

---

## Task 2.1 — Module structure

Create `src/modules/user/` using module template.

---

## Task 2.2 — Use cases

```
application/use-cases/update-profile.use-case.ts    ← WF-USER-001
application/use-cases/change-password.use-case.ts   ← WF-USER-002
application/use-cases/upload-avatar.use-case.ts     ← WF-USER-003
```

---

## Task 2.3 — Cloudinary integration

`UploadAvatarUseCase` uses `CloudinaryService` from infrastructure.

Flow:

```
1. Validate file (type + size)
2. Delete old avatar from Cloudinary if exists
3. Upload new file
4. Save image record to images table
```

---

## Task 2.4 — Controller

```
GET    /users/profile
PATCH  /users/profile
PATCH  /users/change-password
POST   /users/avatar          ← multipart/form-data
```

---

## Task 2.5 — Tests

Required test cases:

```
change-password:
  ✓ updates password hash
  ✓ revokes all refresh tokens
  ✓ throws INVALID_PASSWORD on wrong current password

upload-avatar:
  ✓ saves image record with correct userId
  ✓ deletes old avatar before upload
  ✓ throws INVALID_FILE_TYPE on wrong format
```

---

## Phase 2 — Definition of Done

```
✓ GET  /users/profile returns profile
✓ PATCH /users/profile updates name
✓ PATCH /users/change-password works + revokes tokens
✓ POST /users/avatar uploads and returns URL
✓ All user tests pass
```

---

# Phase 3 — Category & Criteria Modules

**Depends on:** Phase 2
**APIs:** API.md Chapters 4 & 5

---

## Task 3.1 — Category module

```
src/modules/category/
```

Use cases:

```
application/use-cases/get-categories.use-case.ts
application/use-cases/get-category-by-id.use-case.ts
```

Controller routes:

```
GET /categories
GET /categories/:categoryId
GET /categories/:categoryId/criteria
```

---

## Task 3.2 — Criteria module

```
src/modules/criteria/
```

Use cases:

```
application/use-cases/get-criteria.use-case.ts
application/use-cases/get-criteria-by-category.use-case.ts
```

Controller routes:

```
GET /criteria
```

Public contracts to export:

```typescript
// used by review module
GetCriteriaByCategoryUseCase
```

---

## Task 3.3 — Tests

Required test cases:

```
✓ GET /categories returns seeded categories
✓ GET /categories/:id returns single category
✓ GET /categories/:id/criteria returns linked criteria
✓ GET /criteria returns all criteria
✓ throws CATEGORY_NOT_FOUND for unknown id
```

---

## Phase 3 — Definition of Done

```
✓ All category endpoints return seeded data
✓ GET /categories/:id/criteria returns correct criteria
✓ GetCriteriaByCategoryUseCase exported correctly
✓ All tests pass
```

---

# Phase 4 — Business Module

**Depends on:** Phase 3
**Workflows:** WF-BUS-001 to WF-BUS-005
**APIs:** API.md Chapter 3

---

## Task 4.1 — Module structure

Create `src/modules/business/`.

---

## Task 4.2 — Use cases

```
application/use-cases/create-business.use-case.ts      ← WF-BUS-001
application/use-cases/update-business.use-case.ts      ← WF-BUS-002
application/use-cases/delete-business.use-case.ts      ← WF-BUS-003
application/use-cases/get-business-list.use-case.ts    ← includes WF-SEARCH-001
application/use-cases/get-business-by-id.use-case.ts
application/use-cases/get-my-businesses.use-case.ts
application/use-cases/get-business-statistics.use-case.ts
application/use-cases/add-location.use-case.ts         ← WF-BUS-004
application/use-cases/update-location.use-case.ts
application/use-cases/remove-location.use-case.ts      ← WF-BUS-005
```

Public contracts to export:

```typescript
// used by review module and ranking module
GetBusinessByIdUseCase
ValidateBusinessOwnershipUseCase
```

---

## Task 4.3 — Search implementation

`GetBusinessListUseCase` uses PostgreSQL FTS (see WF-SEARCH-001).

Use `prisma.$queryRaw` for FTS queries with GIN index.

---

## Task 4.4 — Controller routes

Register in this order (see API.md route registration order):

```
POST   /businesses
GET    /businesses
GET    /businesses/my
GET    /businesses/:businessId
PATCH  /businesses/:businessId
DELETE /businesses/:businessId
GET    /businesses/:businessId/statistics
POST   /businesses/:businessId/locations
PATCH  /businesses/:businessId/locations/:locationId
DELETE /businesses/:businessId/locations/:locationId
```

---

## Task 4.5 — Tests

Required test cases:

```
create:
  ✓ creates with status 'pending'
  ✓ creates locations and categories
  ✓ throws PHONE_ALREADY_EXISTS on duplicate phone
  ✓ throws CATEGORY_NOT_FOUND on invalid categoryId

list:
  ✓ returns approved businesses only
  ✓ FTS search filters correctly
  ✓ categoryId filter works
  ✓ province filter works

ownership:
  ✓ owner can update own business
  ✓ non-owner cannot update → FORBIDDEN
  ✓ admin can update any business

location:
  ✓ cannot remove last location → LAST_LOCATION_ERROR
```

---

## Phase 4 — Definition of Done

```
✓ POST /businesses creates with status 'pending'
✓ GET  /businesses returns approved only with pagination
✓ GET  /businesses?search= FTS works
✓ GET  /businesses/my returns owner's businesses
✓ PATCH/DELETE enforce ownership
✓ Location CRUD works
✓ Cannot remove last location
✓ GetBusinessByIdUseCase exported correctly
✓ All tests pass
```

---

# Phase 5 — Review & Reply Modules

**Depends on:** Phase 4
**Workflows:** WF-REV-001 to WF-REV-003, WF-REPLY-001 to WF-REPLY-003
**APIs:** API.md Chapters 6 & 7

---

## Task 5.1 — Review module

```
src/modules/review/
```

Use cases:

```
application/use-cases/create-review.use-case.ts         ← WF-REV-001
application/use-cases/update-review.use-case.ts         ← WF-REV-002
application/use-cases/delete-review.use-case.ts         ← WF-REV-003
application/use-cases/get-review-by-id.use-case.ts
application/use-cases/get-business-reviews.use-case.ts
application/use-cases/get-my-reviews.use-case.ts
application/use-cases/get-review-statistics.use-case.ts
```

Public contracts to export:

```typescript
// used by ranking module
GetApprovedReviewsUseCase
GetReviewStatisticsUseCase
```

---

## Task 5.2 — Reply use cases

Inside review module (same module):

```
application/use-cases/create-reply.use-case.ts    ← WF-REPLY-001
application/use-cases/update-reply.use-case.ts    ← WF-REPLY-002
application/use-cases/delete-reply.use-case.ts    ← WF-REPLY-003
```

---

## Task 5.3 — Controller routes

Register in order:

```
POST   /reviews
GET    /reviews/my
GET    /reviews/:reviewId
PATCH  /reviews/:reviewId
DELETE /reviews/:reviewId
POST   /reviews/:reviewId/reply
GET    /reviews/:reviewId/reply
PATCH  /replies/:replyId
DELETE /replies/:replyId
GET    /businesses/:businessId/reviews
GET    /businesses/:businessId/review-statistics
```

Note: `/businesses/:businessId/reviews` route lives in review module
but is registered on the businesses path. Use `@Controller()` with
explicit path or register in business module and delegate to review service.

---

## Task 5.4 — Tests

Required test cases:

```
create review:
  ✓ creates with status 'pending'
  ✓ creates review_criteria records
  ✓ throws REVIEW_ALREADY_EXISTS on duplicate
  ✓ throws BUSINESS_NOT_APPROVED if not approved
  ✓ throws INVALID_CRITERION if criterion not in business category

update review:
  ✓ status resets to 'pending' after edit
  ✓ owner can edit own review
  ✓ non-owner throws FORBIDDEN

reply:
  ✓ business owner can reply
  ✓ throws REPLY_ALREADY_EXISTS on second reply
  ✓ non-owner throws FORBIDDEN
  ✓ admin cannot create reply → FORBIDDEN

visibility:
  ✓ guest receives approved + pending only
  ✓ admin receives all statuses
```

---

## Phase 5 — Definition of Done

```
✓ POST /reviews creates with criteria ratings
✓ PATCH /reviews/:id resets status to pending
✓ DELETE /reviews/:id soft deletes
✓ POST /reviews/:id/reply works for business owner
✓ UNIQUE constraint on replies enforced
✓ GetApprovedReviewsUseCase exported correctly
✓ All tests pass
```

---

# Phase 6 — Report Module

**Depends on:** Phase 5
**Workflows:** WF-RPT-001 to WF-RPT-002
**APIs:** API.md Chapter 8

---

## Task 6.1 — Module structure

```
src/modules/report/
```

---

## Task 6.2 — Use cases

```
application/use-cases/create-report.use-case.ts     ← WF-RPT-001
application/use-cases/withdraw-report.use-case.ts   ← WF-RPT-002
application/use-cases/get-my-reports.use-case.ts
application/use-cases/get-report-by-id.use-case.ts
application/use-cases/get-reasons.use-case.ts
```

---

## Task 6.3 — Controller routes

Register in order:

```
GET    /reports/reasons
POST   /reports
GET    /reports/my
GET    /reports/:reportId
DELETE /reports/:reportId
```

---

## Task 6.4 — Tests

```
✓ creates report with status 'pending'
✓ throws REPORT_ALREADY_EXISTS on duplicate
✓ throws REVIEW_NOT_FOUND for unknown review
✓ withdraw only when status = 'pending'
✓ throws REPORT_NOT_WITHDRAWABLE if not pending
✓ non-owner cannot view report → FORBIDDEN
```

---

## Phase 6 — Definition of Done

```
✓ POST /reports creates report
✓ GET /reports/reasons returns seeded data
✓ DELETE /reports/:id withdraws pending report only
✓ UNIQUE(userId, reviewId) enforced
✓ All tests pass
```

---

# Phase 7 — Ranking Module

**Depends on:** Phase 5
**Workflows:** WF-RANK-001
**APIs:** API.md Chapter 9

---

## Task 7.1 — Module structure

```
src/modules/ranking/
```

Domain service:

```
domain/services/bayesian-score.calculator.ts
```

Formula (from DECISIONS.md D-012):

```typescript
score = 100 * (C * m + weightedNormalizedRating * totalReviewWeight) / (m + totalReviewWeight)
// Defaults: C = 0.63, m = 10. See D-012 for fraud gating and trust inputs.
// Require at least one positive-weight VALID review for snapshots.
```

---

## Task 7.2 — Ranking job

```
src/jobs/ranking-recalculation.job.ts
```

Decorated with `@Cron('0 * * * *')` from `@nestjs/schedule`.

Follows WF-RANK-001 exactly — full replace strategy, batch queries.

---

## Task 7.3 — Use cases

```
application/use-cases/get-global-ranking.use-case.ts
application/use-cases/get-top-businesses.use-case.ts
application/use-cases/get-business-ranking.use-case.ts
application/use-cases/get-ranking-metadata.use-case.ts
application/use-cases/trigger-recalculation.use-case.ts   ← for admin API
```

---

## Task 7.4 — Cache layer

```
infrastructure/cache/ranking-cache.service.ts
```

Uses `CACHE_KEYS` from `shared-constants`.

Read flow:

```
1. Try Redis → return if hit
2. Miss → query ranking_snapshots
3. Store in Redis (TTL = 1 hour)
4. Return
```

---

## Task 7.5 — Controller routes

Register in order:

```
GET /rankings
GET /rankings/top
GET /rankings/metadata
GET /rankings/businesses/:businessId
```

---

## Task 7.6 — Tests

```
bayesian calculator:
  ✓ omits businesses without positive-weight VALID reviews from every scope
  ✓ returns correct score for business with 2 reviews
  ✓ returns correct score for business with 100 reviews
  ✓ more evidence moves the score toward its weighted mean (up above C, down below C)

ranking job:
  ✓ only includes approved businesses
  ✓ only includes approved reviews
  ✓ excludes soft-deleted reviews
  ✓ invalidates Redis cache after run

ranking api:
  ✓ reads from snapshot, not raw reviews
  ✓ cache miss falls back to DB
```

---

## Phase 7 — Definition of Done

```
✓ Cron job runs and generates snapshots
✓ GET /rankings returns paginated data from snapshot
✓ GET /rankings/top returns top N
✓ Redis cache hit on second request
✓ BayesianScoreCalculator unit tests pass
✓ All ranking tests pass
```

---

# Phase 8 — Notification Module

**Depends on:** Phase 5, Phase 4
**Workflows:** WF-NOTI-001
**APIs:** API.md Chapter 10

---

## Task 8.1 — Module structure

```
src/modules/notification/
```

---

## Task 8.2 — Use cases

```
application/use-cases/create-notification.use-case.ts   ← WF-NOTI-001
application/use-cases/get-notifications.use-case.ts
application/use-cases/get-unread-count.use-case.ts
application/use-cases/mark-as-read.use-case.ts
application/use-cases/mark-all-read.use-case.ts
```

Public contracts to export:

```typescript
// used by all moderation workflows
CreateNotificationUseCase
```

---

## Task 8.3 — SSE implementation

```
presentation/sse/notification-sse.controller.ts
infrastructure/sse/sse-connection.manager.ts
```

`SseConnectionManager` tracks active connections:

```typescript
// Map<userId, Subject<MessageEvent>>
private connections: Map<number, Subject<MessageEvent>>
```

`NotificationSseController`:

```
GET /notifications/stream
→ returns Observable<MessageEvent>
→ uses @Sse() decorator
→ sends heartbeat every 30 seconds
→ sends 'connection' event on connect
```

`CreateNotificationUseCase` calls `SseConnectionManager.push(userId, event)`
after persisting to DB. Failure to push is silent (see WF-NOTI-001).

---

## Task 8.4 — Controller routes

Register in order:

```
GET    /notifications/unread-count
GET    /notifications/read-all       ← note: this is PATCH, not GET
PATCH  /notifications/read-all
GET    /notifications/stream
GET    /notifications
GET    /notifications/:notificationId
PATCH  /notifications/:notificationId/read
```

---

## Task 8.5 — Wire notifications into moderation workflows

Update these use cases to call `CreateNotificationUseCase`:

```
ApproveBusinessUseCase   → BUSINESS_APPROVED
RejectBusinessUseCase    → BUSINESS_REJECTED
ApproveReviewUseCase     → REVIEW_APPROVED
RejectReviewUseCase      → REVIEW_REJECTED
ResolveReportUseCase     → REPORT_RESOLVED
CreateReplyUseCase       → NEW_REPLY (to review author)
```

Each call happens OUTSIDE the transaction, after commit.

---

## Task 8.6 — Tests

```
✓ notification persisted before SSE push
✓ SSE push failure does not throw
✓ GET /notifications returns only current user's notifications
✓ PATCH /notifications/:id/read sets isRead=true
✓ PATCH /notifications/read-all updates all unread
✓ GET /notifications/unread-count returns correct count
✓ SSE stream sends heartbeat
✓ SSE stream sends notification event after create
```

---

## Phase 8 — Definition of Done

```
✓ GET /notifications/stream connects and sends heartbeat
✓ Notification created and pushed after business approval
✓ Notification created and pushed after review approval
✓ PATCH /notifications/read-all works
✓ CreateNotificationUseCase exported correctly
✓ All notification tests pass
```

---

# Phase 9 — Admin Module

**Depends on:** All previous phases
**Workflows:** WF-ADMIN-001 to WF-ADMIN-006
**APIs:** API.md Chapter 11

---

## Task 9.1 — Module structure

```
src/modules/admin/
```

Admin module ORCHESTRATES — it calls use cases from other modules.
It does NOT duplicate business logic.

---

## Task 9.2 — Use cases (admin orchestration)

```
application/use-cases/approve-business.use-case.ts    ← WF-ADMIN-001
application/use-cases/reject-business.use-case.ts     ← WF-ADMIN-002
application/use-cases/approve-review.use-case.ts      ← WF-ADMIN-003
application/use-cases/reject-review.use-case.ts       ← WF-ADMIN-004
application/use-cases/resolve-report.use-case.ts      ← WF-ADMIN-005
application/use-cases/reject-report.use-case.ts
application/use-cases/get-reports.use-case.ts
application/use-cases/ban-user.use-case.ts             ← WF-ADMIN-006
application/use-cases/unban-user.use-case.ts
application/use-cases/get-users.use-case.ts
application/use-cases/create-category.use-case.ts
application/use-cases/create-criterion.use-case.ts
application/use-cases/assign-criterion.use-case.ts
application/use-cases/remove-criterion.use-case.ts
application/use-cases/get-logs.use-case.ts
application/use-cases/trigger-ranking.use-case.ts
```

---

## Task 9.3 — Audit log module

```
src/modules/audit-log/
```

```
application/use-cases/create-audit-log.use-case.ts
```

Wire `CreateAuditLogUseCase` into all admin use cases (see WORKFLOWS.md
for which actions generate logs).

---

## Task 9.4 — Controller routes

All under `/admin`, all require `Admin` role:

```
POST   /admin/businesses/:id/approve
POST   /admin/businesses/:id/reject
POST   /admin/businesses/:id/hide
POST   /admin/reviews/:id/approve
POST   /admin/reviews/:id/reject
POST   /admin/reviews/:id/hide
GET    /admin/reports
POST   /admin/reports/:id/resolve
POST   /admin/reports/:id/reject
GET    /admin/users
PATCH  /admin/users/:id/ban
PATCH  /admin/users/:id/unban
POST   /admin/categories
POST   /admin/criteria
POST   /admin/categories/:categoryId/criteria/:criterionId
DELETE /admin/categories/:categoryId/criteria/:criterionId
POST   /admin/rankings/recalculate
GET    /admin/logs
```

---

## Task 9.5 — Tests

```
✓ only admin can access /admin routes
✓ approve business → status='approved' + notification sent
✓ reject business → status='rejected' + notification sent
✓ approve review  → status='approved' + notification sent
✓ reject review   → status='rejected' + notification sent
✓ resolve report  → status='resolved' + notification sent
✓ ban user → status='banned' + refresh tokens revoked
✓ cannot ban admin → CANNOT_BAN_ADMIN
✓ audit log created for each moderation action
✓ non-admin → FORBIDDEN on all /admin routes
```

---

## Phase 9 — Definition of Done

```
✓ All /admin endpoints work and require Admin role
✓ Notifications triggered after each moderation action
✓ Audit logs created after each moderation action
✓ RBAC enforced — non-admin gets FORBIDDEN
✓ All admin tests pass
```

---

# Phase 10 — Hardening & Final Validation

**Depends on:** All phases complete

---

## Task 10.1 — Review all route registrations

Verify route order matches API.md "Route Registration Order" section exactly.
Test each static route (e.g. `/my`, `/top`, `/metadata`) does not
get captured by a preceding param route.

---

## Task 10.2 — Review all transactions

Verify every multi-table write has `prisma.$transaction(...)`.
Check WORKFLOWS.md for the full list.

---

## Task 10.3 — Review all ownership checks

Verify these use cases check ownership before mutation:

```
UpdateBusinessUseCase
DeleteBusinessUseCase
AddLocationUseCase
RemoveLocationUseCase
UpdateReviewUseCase
DeleteReviewUseCase
CreateReplyUseCase
UpdateReplyUseCase
DeleteReplyUseCase
WithdrawReportUseCase
```

---

## Task 10.4 — Review soft delete filters

Verify all repository methods that return lists apply:

```typescript
where: { deletedAt: null }
```

---

## Task 10.5 — Run full test suite

```bash
pnpm test --filter=api
```

All tests must pass. Fix any failures before proceeding.

---

## Task 10.6 — Swagger audit

Verify every endpoint in Swagger has:

```
Summary
Description
Auth requirement (Bearer)
Request example
Response example
```

---

## Task 10.7 — Environment check

Verify all keys in `.env.example` are used in config files.
No hardcoded secrets anywhere in source code.

---

## Phase 10 — Definition of Done (= Project Complete)

```
✓ All 60+ endpoints implemented and match API.md exactly
✓ All phases 0-9 Definition of Done satisfied
✓ Full test suite passes with ≥ 80% coverage on use case layer
✓ Swagger complete at /docs
✓ prisma migrate status shows no pending migrations
✓ npx prisma db seed runs cleanly
✓ Application starts with pnpm dev
✓ GET /health returns 200
✓ No hardcoded secrets
✓ No Prisma access outside infrastructure layer
✓ No business logic in controllers
```

---

End of PLAYBOOK-API.md — v1.0
