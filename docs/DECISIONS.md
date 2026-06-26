# DECISIONS.md

# Enterprise Evaluation & Ranking System (EERS)

Version: 1.0
Status: Locked
Priority: HIGHEST — overrides all other documents

---

## How to use this document

This document contains every locked technical decision for EERS.

Rules for AI agents:

```
- Read this file before reading any other document
- These decisions are final — do not invent alternatives
- When another document conflicts with this file, this file wins
- "MUST" = mandatory, no exceptions
- "MUST NOT" = forbidden, no exceptions
```

---

# Section 1. Identity & Keys

## D-001 — Primary Key Strategy

```
Decision : BIGSERIAL (auto-increment integer)
Applies to: ALL tables
NOT       : UUID, CUID, ULID, nanoid
```

Type mapping by entity size:

```
Large tables (users, businesses, reviews, reports, notifications, logs)
→ BIGSERIAL

Small/lookup tables (roles, categories, criteria, reasons)
→ SMALLSERIAL
```

Prisma scalar types:

```
BIGSERIAL   → Int  @id @default(autoincrement())
SMALLSERIAL → Int  @id @default(autoincrement())
```

---

# Section 2. Authentication

## D-002 — Password Hashing

```
Decision : bcrypt
Rounds   : 12
NOT      : Argon2, MD5, SHA1, SHA256, plain text
```

Library:

```
bcrypt (npm)
```

Never:

```
- Log passwords
- Return passwords in API responses
- Store plain text passwords
```

---

## D-003 — Token Strategy

```
Access Token
  Type    : JWT
  Lifetime: 15 minutes
  Storage : Memory (client-side)

Refresh Token
  Type    : JWT
  Lifetime: 7 days
  Storage : HttpOnly Cookie (client) + database (server)
```

JWT payload shape:

```json
{
  "sub": 1,
  "role": "USER"
}
```

Rules:

```
- Access token is stateless — do NOT persist in database
- Refresh token MUST be persisted — required for revocation
- JWT payload MUST NOT contain: email, avatar, full profile
- Role is read from JWT payload, not from database on every request
```

---

## D-004 — Authentication Methods

```
Supported in MVP:
  1. Email + Password
  2. Google OAuth 2.0

NOT supported in MVP:
  - Phone OTP
  - Magic Link
  - Apple Sign In
```

Google OAuth endpoints MUST be included in API implementation.

---

# Section 3. Authorization

## D-005 — Role Model

```
Roles (stored in roles table):
  1. USER
  2. BUSINESS_OWNER
  3. ADMIN

Guest = unauthenticated user, no database record
```

Role hierarchy for permission inheritance:

```
ADMIN > BUSINESS_OWNER > USER
```

Enforcement:

```
MUST use: NestJS Guards + Decorators
MUST NOT: if (role === 'ADMIN') checks inside controllers
```

---

# Section 4. Database

## D-006 — Database Platform

```
Decision : PostgreSQL 16+
ORM      : Prisma ORM
Pattern  : Repository Pattern
NOT      : TypeORM, Sequelize, raw SQL in application layer
```

---

## D-007 — Soft Delete Strategy

```
Applies to: users, businesses, reviews
Field     : deletedAt (DateTime?)

Active record   : deletedAt IS NULL
Deleted record  : deletedAt IS NOT NULL
```

Rules:

```
- MUST NOT hard delete users, businesses, or reviews
- All repository queries MUST filter deletedAt: null by default
- Soft-deleted records MUST NOT appear in any public API response
```

---

## D-008 — Timestamp Fields

Every table MUST contain:

```
createdAt : DateTime @default(now())
updatedAt : DateTime @updatedAt
```

Tables with soft delete additionally contain:

```
deletedAt : DateTime?
```

---

## D-009 — Character Encoding & Timezone

```
Encoding : UTF-8
Timezone : UTC (all timestamps stored in UTC)
```

---

# Section 5. Caching

## D-010 — Cache Layer

```
Decision : Redis
Provider : Upstash Redis (production)
NOT      : In-memory cache, Memcached
```

Rules:

```
- Redis is an OPTIMIZATION LAYER, not source of truth
- PostgreSQL is ALWAYS the source of truth
- System MUST function normally if Redis is unavailable
- MUST NOT store business logic state in Redis
- Only Infrastructure Layer may access Redis directly
```

---

# Section 6. Ranking Engine

## D-011 — Ranking Calculation Strategy

```
Decision : Precomputed snapshots
Trigger  : Scheduled cron job (every 1 hour) + Admin manual trigger
NOT      : Real-time calculation per request
```

Cron schedule:

```
0 * * * *
```

---

## D-012 — Ranking Formula

Bayesian Average:

```
score = (C × m + avgRating × n) / (m + n)

Where:
  n         = number of approved reviews for this business
  avgRating = average overall_rating of approved reviews
  C         = 3.5  (global prior mean, FIXED)
  m         = 10   (minimum review threshold, FIXED)
```

Example:

```
Business A: 2 reviews, avg 5.0
  score = (3.5 × 10 + 5.0 × 2) / (10 + 2) = 45 / 12 = 3.75

Business B: 100 reviews, avg 4.5
  score = (3.5 × 10 + 4.5 × 100) / (10 + 100) = 485 / 110 = 4.41

Business B ranks higher despite lower avg rating → correct behavior
```

Eligible inputs:

```
MUST include : reviews WHERE status = 'approved' AND deletedAt IS NULL
MUST exclude : pending, rejected, hidden, soft-deleted reviews
MUST exclude : businesses WHERE status != 'approved'
```

Constants are FIXED for MVP. Do NOT make them configurable at runtime.

---

## D-013 — Ranking Dimensions

```
Supported:
  1. Global     (all approved businesses)
  2. Category   (businesses within a category)
  3. Province   (businesses within a province)
```

Each dimension is a separate ranking snapshot scope.

---

# Section 7. File Storage

## D-014 — File Storage Provider

```
Decision : Cloudinary
NOT      : Local filesystem, AWS S3, GCS
```

Rules:

```
- MUST store only: Cloudinary URL + public_id in database
- MUST NOT store binary files in PostgreSQL
- MUST NOT store files on local server disk
```

Allowed upload types:

```
jpg, jpeg, png, webp
Max size: 10MB per file
```

---

# Section 8. Realtime Communication

## D-015 — Realtime Transport

```
Decision : Server-Sent Events (SSE)
NOT      : WebSocket, Long Polling, GraphQL Subscriptions
```

SSE rules:

```
- Heartbeat interval: 30 seconds
- Reconnect retry (client): 5 seconds
- Notification MUST be persisted to PostgreSQL before SSE push
- SSE failure MUST NOT prevent notification persistence
- Users MUST only receive their own notifications
```

---

# Section 9. Search

## D-016 — Search Engine

```
Decision : PostgreSQL Full Text Search with GIN indexes
NOT      : Elasticsearch, Meilisearch, Algolia, Typesense
```

---

# Section 10. Background Jobs

## D-017 — Job Scheduler

```
Decision : @nestjs/schedule
NOT      : BullMQ, Agenda, node-cron (standalone)
```

---

# Section 11. Architecture

## D-018 — Backend Architecture Style

```
Decision : Vertical Slice Architecture + Clean Architecture
```

Layer dependency direction (STRICT):

```
Presentation → Application → Domain
                              ↑
                       Infrastructure
```

Forbidden dependency directions:

```
MUST NOT: Domain → Infrastructure
MUST NOT: Domain → NestJS
MUST NOT: Domain → Prisma
MUST NOT: Controller → Prisma
MUST NOT: Controller → Redis
MUST NOT: UseCase → Prisma (direct)
MUST NOT: Module A Repository → Module B Repository
```

---

## D-019 — Module Ownership Rule

Every table and business concept has exactly ONE owner module.

```
users, refresh_tokens  → Auth Module (auth)
user profiles, avatars → User Module (user)
businesses, locations  → Business Module (business)
categories             → Category Module (category)
criteria               → Criteria Module (criteria)
reviews, replies       → Review Module (review)
review_criteria        → Review Module (review)
reports, reasons       → Report Module (report)
ranking_snapshots      → Ranking Module (ranking)
notifications          → Notification Module (notification)
logs                   → Audit Log Module (audit-log)
```

Cross-module access rule:

```
MUST use  : public UseCase/Service contracts exported by owner module
MUST NOT  : import another module's Repository directly
MUST NOT  : query another module's tables directly
```

---

## D-020 — Frontend Architecture Style

```
Decision : Feature-Based Architecture
Framework: Next.js 15 (App Router)
```

State management:

```
Server state : TanStack Query (useQuery, useMutation)
Client state : React useState / useContext
NOT          : Redux, MobX, Recoil, Zustand
```

Token storage:

```
Access Token  : Memory only
Refresh Token : HttpOnly Cookie
NOT           : localStorage, sessionStorage
```

---

# Section 12. API Design

## D-021 — API Style

```
Decision : REST
Base URL : /api/v1
NOT      : GraphQL, gRPC, SOAP
```

---

## D-022 — Response Envelope

All API responses MUST use this envelope:

Success (single):

```json
{ "success": true, "data": {} }
```

Success (list):

```json
{ "success": true, "data": [] }
```

Success (paginated):

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Rules:

```
- MUST NOT return raw Prisma models
- MUST NOT expose stack traces
- MUST NOT expose SQL errors
- MUST NOT expose internal exception details
```

---

## D-023 — Pagination Strategy

```
Type    : Offset pagination
Default : page=1, limit=20
Maximum : limit=100 (cap automatically, do not throw error)
```

---

# Section 13. Validation & Security

## D-024 — Request Validation

```
Library : class-validator + class-transformer
Scope   : All request DTOs, applied at Controller level via ValidationPipe
```

---

## D-025 — Security Headers & Policies

```
CORS     : Configured, whitelist frontend origin only
Rate Limiting: Apply to auth endpoints minimum
Input    : Validate all inputs via DTO before entering Use Cases
```

Never log:

```
passwords, tokens, refresh tokens, secrets, API keys
```

---

# Section 14. Testing

## D-026 — Testing Requirements

```
Framework : Jest
Required  : Unit tests + Integration tests per module
Coverage  : ≥ 80% on Service / Use Case layer
```

Mandatory test coverage areas:

```
- Authentication flows
- Business status workflow
- Review status workflow
- Ranking calculation formula
- Report deduplication
- RBAC enforcement
```

---

# Section 15. Conflict Resolution

## D-027 — Document Priority Order

When documents conflict, resolve in this order:

```
1. DECISIONS.md        ← this file, always wins
2. SCHEMA.md           ← database structure
3. API.md              ← endpoint contracts
4. WORKFLOWS.md        ← business logic flows
5. PLAYBOOK.md         ← implementation order
6. REFERENCE.md        ← enums, constants, error codes
```

Any document not in this list (PRD, SAD, old agenttasks, old sadv2)
is for human reading only. AI agents MUST NOT use them as implementation source.

---

## D-028 — Agent Stop Conditions

Agent MUST stop and request clarification if:

```
- A required business rule is missing from all documents
- Two decisions in this file appear to conflict with each other
- A schema change is needed that is not in SCHEMA.md
- The ranking formula constants (C, m) need to change
```

Agent MUST NOT:

```
- Invent business rules not documented
- Invent database columns not in SCHEMA.md
- Invent endpoints not in API.md
- Replace any technology listed in this document
- Hard delete users, businesses, or reviews
- Calculate ranking scores inside controllers or repositories
- Access Redis outside Infrastructure Layer
- Access Prisma outside Infrastructure Layer
```

---

End of DECISIONS.md — v1.0
