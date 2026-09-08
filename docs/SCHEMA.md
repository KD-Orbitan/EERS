# SCHEMA.md

# Enterprise Evaluation & Ranking System (EERS)

Version: 1.0
Status: Locked
Priority: 2nd (see DECISIONS.md D-027)

---

## How to use this document

This is the single source of truth for all database structure.

Rules for AI agents:

```
- Copy Prisma models from this file directly into schema.prisma
- Do NOT invent columns, tables, or relations not defined here
- Do NOT remove columns defined here
- All schema changes require updating this file first
- When this file conflicts with DDS or sadv2, this file wins
```

---

## Global Prisma Config

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Enums

```prisma
enum UserStatus {
  active
  inactive
  banned
  deleted
}

enum BusinessStatus {
  pending
  approved
  rejected
  hidden
}

enum ReviewStatus {
  pending
  approved
  rejected
  hidden
}

enum ReportStatus {
  pending
  reviewing
  resolved
  rejected
}

enum BusinessClaimStatus {
  pending
  approved
  rejected
}

enum SentimentType {
  positive
  neutral
  negative
}

enum ImageType {
  AVATAR
  BUSINESS_COVER
  BUSINESS_LOGO
  BUSINESS_GALLERY
  REVIEW_PHOTO
}
```

---

## Module: Auth

Owner: `auth` module

### Table: roles

```prisma
model Role {
  roleId   Int    @id @default(autoincrement()) @map("role_id") @db.SmallInt
  roleName String @unique @map("role_name") @db.VarChar(50)

  users User[]

  @@map("roles")
}
```

Seed data (MUST be seeded before any other data):

```
roleId=1  roleName=USER
roleId=2  roleName=BUSINESS_OWNER
roleId=3  roleName=ADMIN
```

---

### Table: refresh_tokens

```prisma
model RefreshToken {
  tokenId   BigInt   @id @default(autoincrement()) @map("token_id")
  token     String   @unique @db.Text
  expiresAt DateTime @map("expires_at") @db.Timestamptz
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  revokedAt DateTime? @map("revoked_at") @db.Timestamptz

  userId BigInt @map("user_id")
  user   User   @relation(fields: [userId], references: [userId])

  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}
```

---

## Module: User

Owner: `user` module

### Table: users

```prisma
model User {
  userId    BigInt      @id @default(autoincrement()) @map("user_id")
  name      String      @db.VarChar(100)
  email     String      @unique @db.VarChar(255)
  password  String      @db.VarChar(255)
  status    UserStatus  @default(active)
  createdAt DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime    @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime?   @map("deleted_at") @db.Timestamptz

  roleId Int  @map("role_id") @db.SmallInt
  role   Role @relation(fields: [roleId], references: [roleId])

  // avatar stored via images table
  images            Image[]
  businesses        Business[]        @relation("BusinessOwner")
  approvedBusiness  Business[]        @relation("BusinessApprover")
  reviews           Review[]          @relation("ReviewWriter")
  managedReviews    Review[]          @relation("ReviewManager")
  replies           Reply[]
  reports           Report[]
  notifications     Notification[]
  refreshTokens     RefreshToken[]
  logs              Log[]
  bookmarks         Bookmark[]
  businessClaims          BusinessClaim[]   @relation("BusinessClaimant")
  reviewedBusinessClaims  BusinessClaim[]   @relation("BusinessClaimReviewer")

  @@index([email])
  @@map("users")
}
```

Notes:

```
- password stores bcrypt hash (rounds=12), never plain text
- deletedAt: soft delete, filter deletedAt IS NULL in all queries
- avatar: stored in images table WHERE userId IS NOT NULL
          AND reviewId IS NULL AND businessId IS NULL
```

---

## Module: Business

Owner: `business` module

### Table: businesses

```prisma
model Business {
  businessId  BigInt         @id @default(autoincrement()) @map("business_id")
  name        String         @db.VarChar(150)
  description String?        @db.Text
  phone       String         @unique @db.VarChar(20)
  email       String?        @unique @db.VarChar(255)
  status      BusinessStatus @default(pending)
  avgRating   Decimal        @default(0) @map("avg_rating") @db.Decimal(3, 2)
  createdAt   DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime       @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt   DateTime?      @map("deleted_at") @db.Timestamptz

  ownerUserId      BigInt? @map("owner_user_id")
  owner            User?   @relation("BusinessOwner", fields: [ownerUserId], references: [userId])

  approvedByUserId BigInt? @map("approved_by_user_id")
  approvedBy       User?   @relation("BusinessApprover", fields: [approvedByUserId], references: [userId])

  images              Image[]
  locations           BusinessLocation[]
  businessCategories  BusinessCategory[]
  reviews             Review[]
  rankingSnapshots    RankingSnapshot[]
  rankingSnapshotHistory RankingSnapshotHistory[]
  bookmarks           Bookmark[]
  claims              BusinessClaim[]

  @@index([status])
  @@index([ownerUserId])
  @@index([name])
  @@map("businesses")
}
```

Notes:

```
- status starts as 'pending' on creation, NEVER skip this default
- avgRating is denormalized for read performance, updated after ranking recalc
- deletedAt: soft delete
- Full text search index added separately (see Indexes section)
- ownerUserId is nullable — NULL means "unclaimed" (admin-created business with no owner yet).
  Only an admin-created business ever has ownerUserId IS NULL; see D-033 and Module: Business
  Claim below for how a user claims an unclaimed business and how ownership transfers.
```

---

### Table: locations

```prisma
model Location {
  locationId  BigInt   @id @default(autoincrement()) @map("location_id")
  addressLine String   @map("address_line") @db.Text
  ward        String   @db.VarChar(100)
  province    String   @db.VarChar(100)
  latitude    Decimal? @db.Decimal(9, 6)
  longitude   Decimal? @db.Decimal(9, 6)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  businessLocations BusinessLocation[]

  @@index([province])
  @@map("locations")
}
```

`latitude`/`longitude` are nullable and never accepted as request input — see D-032
(auto-geocoded server-side from `addressLine`/`ward`/`province` via OpenStreetMap Nominatim,
best-effort, `null` on any geocoding failure).

---

### Table: business_locations

```prisma
model BusinessLocation {
  businessId BigInt @map("business_id")
  locationId BigInt @map("location_id")

  business Business @relation(fields: [businessId], references: [businessId])
  location Location @relation(fields: [locationId], references: [locationId])

  @@id([businessId, locationId])
  @@map("business_locations")
}
```

---

## Module: Category

Owner: `category` module

### Table: categories

```prisma
model Category {
  categoryId   Int    @id @default(autoincrement()) @map("category_id") @db.SmallInt
  categoryName String @unique @map("category_name") @db.VarChar(100)

  categoryCriteria  CategoryCriterion[]
  businessCategories BusinessCategory[]

  @@map("categories")
}
```

Seed data (examples, MUST be seeded):

```
Information Technology
Education
Healthcare
Finance
Retail
```

---

### Table: business_categories

```prisma
model BusinessCategory {
  businessId BigInt @map("business_id")
  categoryId Int    @map("category_id") @db.SmallInt

  business Business  @relation(fields: [businessId], references: [businessId])
  category Category  @relation(fields: [categoryId], references: [categoryId])

  @@id([businessId, categoryId])
  @@map("business_categories")
}
```

---

## Module: Criteria

Owner: `criteria` module

### Table: criteria

```prisma
model Criterion {
  criterionId Int     @id @default(autoincrement()) @map("criterion_id") @db.SmallInt
  name        String  @unique @db.VarChar(100)
  description String? @db.Text

  categoryCriteria CategoryCriterion[]
  reviewCriteria   ReviewCriterion[]

  @@map("criteria")
}
```

---

### Table: category_criteria

```prisma
model CategoryCriterion {
  categoryId  Int @map("category_id") @db.SmallInt
  criterionId Int @map("criterion_id") @db.SmallInt

  category  Category  @relation(fields: [categoryId], references: [categoryId])
  criterion Criterion @relation(fields: [criterionId], references: [criterionId])

  @@id([categoryId, criterionId])
  @@map("category_criteria")
}
```

Business Rule enforced here:

```
Businesses inherit criteria from their categories via this join table.
Businesses CANNOT define custom criteria.
To get criteria for a business:
  SELECT c.* FROM criteria c
  JOIN category_criteria cc ON cc.criterion_id = c.criterion_id
  JOIN business_categories bc ON bc.category_id = cc.category_id
  WHERE bc.business_id = :businessId
```

---

## Module: Review

Owner: `review` module

### Table: reviews

```prisma
model Review {
  reviewId   BigInt        @id @default(autoincrement()) @map("review_id")
  content    String        @db.Text
  overallRating Int        @map("overall_rating") @db.SmallInt
  sentiment  SentimentType?
  sentimentScore       Decimal?  @map("sentiment_score") @db.Decimal(5, 4)
  sentimentAnalyzedAt  DateTime? @map("sentiment_analyzed_at") @db.Timestamptz
  status     ReviewStatus  @default(pending)
  createdAt  DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime      @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt  DateTime?     @map("deleted_at") @db.Timestamptz

  writerUserId    BigInt  @map("writer_user_id")
  writer          User    @relation("ReviewWriter", fields: [writerUserId], references: [userId])

  businessId      BigInt   @map("business_id")
  business        Business @relation(fields: [businessId], references: [businessId])

  managedByUserId BigInt?  @map("managed_by_user_id")
  managedBy       User?    @relation("ReviewManager", fields: [managedByUserId], references: [userId])

  images          Image[]
  reviewCriteria  ReviewCriterion[]
  replies         Reply[]
  reports         Report[]

  // One active review per (writerUserId, businessId): enforced via a partial
  // unique index (WHERE deleted_at IS NULL) added in migration SQL, not here —
  // a plain @@unique would block re-reviewing after a soft-deleted review.
  @@index([businessId])
  @@index([writerUserId])
  @@index([status])
  @@map("reviews")
}
```

Partial unique index (add in migration file, Prisma does not support this natively):

```sql
CREATE UNIQUE INDEX uq_review_writer_business_active
ON reviews (writer_user_id, business_id)
WHERE deleted_at IS NULL;
```

Notes:

```
- overallRating: enforce 1-5 in application layer (not DB constraint)
- sentiment: nullable, populated by sentiment analysis service (optional feature)
  Set to NULL if sentiment analysis is not run
- One user may have at most one ACTIVE review per business (see partial unique
  index above). After a review is soft-deleted, the user may write a new one.
- deletedAt: soft delete
- managedByUserId: admin who last moderated this review
- Full text search index added separately (see Indexes section)
```

---

### Table: review_criteria

```prisma
model ReviewCriterion {
  reviewId    BigInt   @map("review_id")
  criterionId Int      @map("criterion_id") @db.SmallInt
  ratingValue Int      @map("rating_value") @db.SmallInt
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  review    Review    @relation(fields: [reviewId], references: [reviewId])
  criterion Criterion @relation(fields: [criterionId], references: [criterionId])

  @@id([reviewId, criterionId])
  @@map("review_criteria")
}
```

Notes:

```
- ratingValue: enforce 1-5 in application layer
- criterionId MUST belong to a category that the reviewed business belongs to
  (enforced in application layer, not DB constraint)
```

---

### Table: replies

```prisma
model Reply {
  replyId   BigInt   @id @default(autoincrement()) @map("reply_id")
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  userId   BigInt @map("user_id")
  user     User   @relation(fields: [userId], references: [userId])

  reviewId BigInt @map("review_id")
  review   Review @relation(fields: [reviewId], references: [reviewId])

  @@unique([reviewId])
  @@index([reviewId])
  @@map("replies")
}
```

Notes:

```
- UNIQUE(reviewId): one review → one reply only (business owner reply)
- Only BUSINESS_OWNER of the reviewed business may create a reply
- ADMIN cannot create replies (enforced in application layer)
```

---

## Module: Report

Owner: `report` module

### Table: reasons

```prisma
model Reason {
  reasonId    Int      @id @default(autoincrement()) @map("reason_id") @db.SmallInt
  name        String   @db.VarChar(100)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  reports Report[]

  @@map("reasons")
}
```

Seed data (MUST be seeded):

```
Spam
Fake Review
Harassment
Offensive Content
Conflict of Interest
Other
```

---

### Table: reports

```prisma
model Report {
  reportId    BigInt       @id @default(autoincrement()) @map("report_id")
  description String?      @db.Text
  status      ReportStatus @default(pending)
  createdAt   DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime     @updatedAt @map("updated_at") @db.Timestamptz

  reasonId Int    @map("reason_id") @db.SmallInt
  reason   Reason @relation(fields: [reasonId], references: [reasonId])

  userId BigInt @map("user_id")
  user   User   @relation(fields: [userId], references: [userId])

  reviewId BigInt @map("review_id")
  review   Review @relation(fields: [reviewId], references: [reviewId])

  @@unique([userId, reviewId])
  @@index([reviewId])
  @@index([status])
  @@map("reports")
}
```

Notes:

```
- UNIQUE(userId, reviewId): one user can report one review only once
- description: optional additional context from reporter
```

---

## Module: Business Claim

Owner: `business-claim` module

### Table: business_claims

```prisma
model BusinessClaim {
  claimId     BigInt              @id @default(autoincrement()) @map("claim_id")
  message     String              @db.Text
  status      BusinessClaimStatus @default(pending)
  createdAt   DateTime            @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime            @updatedAt @map("updated_at") @db.Timestamptz

  businessId BigInt   @map("business_id")
  business   Business @relation(fields: [businessId], references: [businessId])

  userId BigInt @map("user_id")
  user   User   @relation("BusinessClaimant", fields: [userId], references: [userId])

  reviewedByUserId BigInt? @map("reviewed_by_user_id")
  reviewedBy       User?   @relation("BusinessClaimReviewer", fields: [reviewedByUserId], references: [userId])

  @@index([businessId])
  @@index([status])
  @@map("business_claims")
}
```

Notes:

```
- No UNIQUE(userId, businessId) constraint — a user may resubmit a claim after a rejection
- "One active pending claim per user per business" is enforced in application logic, not the DB
- message: required free-text explanation from the claimant (no evidence upload)
- reviewedByUserId: set to the admin who approved/rejected the claim; null while pending
```

---

## Module: Bookmark

Owner: `bookmark` module

### Table: bookmarks

```prisma
model Bookmark {
  bookmarkId BigInt   @id @default(autoincrement()) @map("bookmark_id")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  userId BigInt @map("user_id")
  user   User   @relation(fields: [userId], references: [userId])

  businessId BigInt   @map("business_id")
  business   Business @relation(fields: [businessId], references: [businessId])

  @@unique([userId, businessId])
  @@index([userId])
  @@index([businessId])
  @@map("bookmarks")
}
```

Notes:

```
- UNIQUE(userId, businessId): a user can bookmark a business only once
- Hard delete on unbookmark — bookmarks are not in the D-007 soft-delete list
- No status/moderation workflow — a bookmark is a simple user preference record
```

---

## Module: Notification

Owner: `notification` module

### Table: notifications

```prisma
model Notification {
  notificationId BigInt   @id @default(autoincrement()) @map("notification_id")
  type           String   @db.VarChar(100)
  title          String   @db.VarChar(255)
  content        String   @db.Text
  isRead         Boolean  @default(false) @map("is_read")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz

  userId BigInt @map("user_id")
  user   User   @relation(fields: [userId], references: [userId])

  @@index([userId])
  @@index([userId, isRead])
  @@map("notifications")
}
```

Notes:

```
- type: use NOTIFICATION_TYPE constants from REFERENCE.md
  e.g. 'BUSINESS_APPROVED', 'REVIEW_REJECTED', 'NEW_REPLY'
- Notification MUST be persisted before SSE push (see DECISIONS.md D-015)
```

---

## Module: Ranking

Owner: `ranking` module

### Table: ranking_snapshots

```prisma
model RankingSnapshot {
  snapshotId    BigInt   @id @default(autoincrement()) @map("snapshot_id")
  scope         String   @db.VarChar(50)
  scopeId       BigInt?  @map("scope_id")
  rank          Int
  rankingScore  Decimal  @map("ranking_score") @db.Decimal(10, 4)
  avgRating     Decimal  @map("avg_rating") @db.Decimal(3, 2)
  reviewCount   Int      @map("review_count")
  calculatedAt  DateTime @default(now()) @map("calculated_at") @db.Timestamptz

  businessId BigInt   @map("business_id")
  business   Business @relation(fields: [businessId], references: [businessId])

  @@unique([scope, scopeId, businessId])
  @@index([scope, scopeId, rank])
  @@index([businessId])
  @@map("ranking_snapshots")
}
```

Notes:

```
- scope values: 'GLOBAL' | 'CATEGORY' | 'PROVINCE'
  (see REFERENCE.md RANKING_SCOPE constants)
- scopeId:
    GLOBAL   → NULL
    CATEGORY → categoryId
    PROVINCE → NULL (filter by province name via business join)
- rankingScore: composite Bayesian index on [0,100] (see DECISIONS.md D-012)
- reviewCount: number of positive-weight reviews contributing to ranking; excludes automatic fraud REJECTED. Businesses with zero contributing reviews have no snapshot.
- avgRating: raw mean of moderation-approved reviews, independent of fraud weighting.
- Populated exclusively by RankingRecalculationJob, never by API handlers
- Ranking APIs read from this table via Redis cache (see DECISIONS.md D-011)
```
### Table: scoring_config

```prisma
model ScoringConfig {
  configId         Int     @id @default(autoincrement()) @map("config_id") @db.SmallInt
  bayesianC        Decimal @default(3.5)  @map("bayesian_c")        @db.Decimal(4,2)
  bayesianM        Int     @default(10)   @map("bayesian_m")
  fraudLambda1     Decimal @default(0.4)  @map("fraud_lambda_1")    @db.Decimal(4,3)
  fraudLambda2     Decimal @default(0.4)  @map("fraud_lambda_2")    @db.Decimal(4,3)
  fraudLambda3     Decimal @default(0.2)  @map("fraud_lambda_3")    @db.Decimal(4,3)
  thetaDup         Decimal @default(0.85) @map("theta_dup")         @db.Decimal(4,3)
  lDup             Int     @default(20)   @map("l_dup")
  thetaSpam        Int     @default(5)    @map("theta_spam")
  spamWindowHours  Int     @default(24)   @map("spam_window_hours")
  thetaSus         Decimal @default(0.3)  @map("theta_sus")         @db.Decimal(4,3)
  thetaReject      Decimal @default(0.7)  @map("theta_reject")      @db.Decimal(4,3)
  trustAlpha       Decimal @default(0.5)  @map("trust_alpha")       @db.Decimal(4,3)
  trustBeta        Decimal @default(0.3)  @map("trust_beta")        @db.Decimal(4,3)
  trustGamma       Decimal @default(0.2)  @map("trust_gamma")       @db.Decimal(4,3)
  suspiciousDelta  Decimal @default(0.3)  @map("suspicious_delta")  @db.Decimal(4,3)
  timeDecayLambda  Decimal @default(0.01) @map("time_decay_lambda") @db.Decimal(6,4)
  sentimentLambda  Decimal @default(0.0)  @map("sentiment_lambda")  @db.Decimal(4,3)
  weightAlpha      Decimal @default(0.4)  @map("weight_alpha")      @db.Decimal(4,3)
  weightBeta       Decimal @default(0.4)  @map("weight_beta")       @db.Decimal(4,3)
  weightGamma      Decimal @default(0.2)  @map("weight_gamma")      @db.Decimal(4,3)
  lMin             Int     @default(10)   @map("l_min")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @updatedAt      @map("updated_at") @db.Timestamptz

  @@map("scoring_config")
}
```

### Table: criterion_weights

```prisma
model CriterionWeight {
  weightId    Int     @id @default(autoincrement()) @map("weight_id") @db.SmallInt
  categoryId  Int     @map("category_id")  @db.SmallInt
  criterionId Int     @map("criterion_id") @db.SmallInt
  weight      Decimal @default(1.0)        @db.Decimal(5,4)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt      @map("updated_at") @db.Timestamptz

  category  Category  @relation(fields: [categoryId],  references: [categoryId])
  criterion Criterion @relation(fields: [criterionId], references: [criterionId])

  @@unique([categoryId, criterionId])
  @@map("criterion_weights")
}
```

### Table: user_trust_scores

```prisma
model UserTrustScore {
  trustScoreId   BigInt   @id @default(autoincrement()) @map("trust_score_id")
  userId         BigInt   @map("user_id")
  trustScore     Decimal  @map("trust_score")      @db.Decimal(5,4)
  validReviews   Int      @default(0) @map("valid_reviews")
  accountAgeDays Int      @default(0) @map("account_age_days")
  flaggedCount   Int      @default(0) @map("flagged_count")
  calculatedAt   DateTime @default(now()) @map("calculated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [userId])

  @@unique([userId])
  @@map("user_trust_scores")
}
```

User trust counter semantics (D-012): `validReviews` counts non-deleted moderation-approved reviews; `flaggedCount` counts non-deleted moderation-rejected reviews. Automatic fraud labels affect neither counter.

### Table: review_fraud_scores

```prisma
model ReviewFraudScore {
  fraudScoreId     BigInt   @id @default(autoincrement()) @map("fraud_score_id")
  reviewId         BigInt   @map("review_id")
  fraudScore       Decimal  @map("fraud_score")       @db.Decimal(5,4)
  duplicateSignal  Decimal  @default(0) @map("duplicate_signal") @db.Decimal(5,4)
  spamSignal       Decimal  @default(0) @map("spam_signal")      @db.Decimal(5,4)
  trustSignal      Decimal  @default(0) @map("trust_signal")     @db.Decimal(5,4)
  fraudStatus      String   @default("VALID") @map("fraud_status") @db.VarChar(20)
  calculatedAt     DateTime @default(now()) @map("calculated_at") @db.Timestamptz

  review Review @relation(fields: [reviewId], references: [reviewId])

  @@unique([reviewId])
  @@map("review_fraud_scores")
}
```

### Table: ranking_snapshot_history

```prisma
model RankingSnapshotHistory {
  historyId    BigInt   @id @default(autoincrement()) @map("history_id")
  rank         Int
  rankingScore Decimal  @map("ranking_score") @db.Decimal(10, 4)
  calculatedAt DateTime @default(now()) @map("calculated_at") @db.Timestamptz

  businessId BigInt   @map("business_id")
  business   Business @relation(fields: [businessId], references: [businessId])

  @@index([businessId, calculatedAt])
  @@map("ranking_snapshot_history")
}
```

Notes:

```
- GLOBAL scope only (no scope/scopeId columns — see DECISIONS.md D-031)
- Append-only: one row per business per hourly cron run
- Rows older than 40 days are purged each cron run (retention, see D-031)
- Used exclusively to compute the `trend` field on
  GET /rankings/businesses/:businessId — never read/written outside RankingModule
```

### Table: ranking_trend_config

```prisma
model RankingTrendConfig {
  configId  Int      @id @default(autoincrement()) @map("config_id") @db.SmallInt
  period    String   @default("WEEK") @db.VarChar(10) // DAY | WEEK | MONTH
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@map("ranking_trend_config")
}
```

Notes:

```
- Singleton row, same read/write pattern as scoring_config (findFirst / updateMany({where:{}}))
- period: DAY=1 day lookback, WEEK=7 days, MONTH=30 days (see REFERENCE.md)
- Editable via GET/PATCH /admin/rankings/trend-config (Admin only)
```

---

## Module: Shared / Infrastructure

Owner: managed across modules via image upload service

### Table: images

```prisma
model Image {
  imageId            BigInt    @id @default(autoincrement()) @map("image_id")
  cloudinaryPublicId String    @map("cloudinary_public_id") @db.Text
  secureUrl          String    @map("secure_url") @db.Text
  width              Int?
  height             Int?
  format             String?   @db.VarChar(10)
  imageType          ImageType @map("image_type")
  displayOrder       Int?      @map("display_order") @db.SmallInt  // for gallery ordering
  createdAt          DateTime  @default(now()) @map("created_at") @db.Timestamptz

  // Owner column must match imageType (enforced via CHECK constraint in migration)
  userId     BigInt?   @map("user_id")
  reviewId   BigInt?   @map("review_id")
  businessId BigInt?   @map("business_id")

  user     User?     @relation(fields: [userId], references: [userId])
  review   Review?   @relation(fields: [reviewId], references: [reviewId])
  business Business? @relation(fields: [businessId], references: [businessId])

  @@index([userId])
  @@index([reviewId])
  @@index([businessId])
  @@map("images")
}
```

CHECK constraint (add in migration file, Prisma does not support this natively):

```sql
ALTER TABLE images ADD CONSTRAINT images_type_owner_consistency CHECK (
  CASE
    WHEN image_type = 'AVATAR'           THEN user_id IS NOT NULL AND business_id IS NULL AND review_id IS NULL
    WHEN image_type = 'BUSINESS_COVER'   THEN business_id IS NOT NULL AND user_id IS NULL AND review_id IS NULL
    WHEN image_type = 'BUSINESS_LOGO'    THEN business_id IS NOT NULL AND user_id IS NULL AND review_id IS NULL
    WHEN image_type = 'BUSINESS_GALLERY' THEN business_id IS NOT NULL AND user_id IS NULL AND review_id IS NULL
    WHEN image_type = 'REVIEW_PHOTO'     THEN review_id IS NOT NULL AND user_id IS NULL AND business_id IS NULL
    ELSE false
  END
);
```

Partial unique indexes and gallery ordering index:

```sql
-- Each user can have only 1 avatar
CREATE UNIQUE INDEX uq_user_avatar ON images (user_id) WHERE image_type = 'AVATAR';

-- Each business can have only 1 cover photo
CREATE UNIQUE INDEX uq_business_cover ON images (business_id) WHERE image_type = 'BUSINESS_COVER';

-- Each business can have only 1 logo
CREATE UNIQUE INDEX uq_business_logo ON images (business_id) WHERE image_type = 'BUSINESS_LOGO';

-- Composite index for gallery ordering
CREATE INDEX idx_business_gallery_order ON images (business_id, display_order) WHERE image_type = 'BUSINESS_GALLERY';
```

Notes:

```
- imageType: AVATAR | BUSINESS_COVER | BUSINESS_LOGO | BUSINESS_GALLERY | REVIEW_PHOTO
- Avatar          : userId IS NOT NULL, reviewId IS NULL, businessId IS NULL — 1 per user (partial unique index)
- Business cover  : businessId IS NOT NULL, userId IS NULL, reviewId IS NULL — 1 per business (partial unique index); wide hero/banner image
- Business logo   : businessId IS NOT NULL, userId IS NULL, reviewId IS NULL — 1 per business (partial unique index); small square brand mark shown in cards/listings, distinct from the cover banner
- Business gallery: businessId IS NOT NULL, userId IS NULL, reviewId IS NULL — many per business, ordered by displayOrder
- Review photo    : reviewId IS NOT NULL, userId IS NULL, businessId IS NULL — many per review
- displayOrder: only meaningful for BUSINESS_GALLERY, NULL otherwise
- secureUrl: Cloudinary HTTPS URL, store as-is
- cloudinaryPublicId: required for deletion from Cloudinary
- MUST NOT store binary data here
```

---

## Module: Audit Log

Owner: `audit-log` module

### Table: logs

```prisma
model Log {
  logId      BigInt   @id @default(autoincrement()) @map("log_id")
  action     String   @db.VarChar(100)
  entityType String   @map("entity_type") @db.VarChar(100)
  entityId   BigInt?  @map("entity_id")
  oldData    Json?    @map("old_data")
  newData    Json?    @map("new_data")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  userId BigInt? @map("user_id")
  user   User?   @relation(fields: [userId], references: [userId])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@map("logs")
}
```

Notes:

```
- action: use LOG_ACTION constants from REFERENCE.md
  e.g. 'BUSINESS_APPROVED', 'REVIEW_DELETED', 'USER_BANNED'
- oldData / newData: JSONB snapshot of record before/after change
- userId: actor who performed the action (NULL for system-generated events)
- Logs MUST NEVER be deleted or updated
```

---

## Full Text Search Indexes

Add via raw SQL in migration (Prisma does not support GIN natively):

```sql
-- Business name search
CREATE INDEX idx_businesses_name_fts
ON businesses
USING gin(to_tsvector('simple', name));

-- Business name + description search
CREATE INDEX idx_businesses_description_fts
ON businesses
USING gin(to_tsvector('simple', coalesce(description, '')));

-- Review content search
CREATE INDEX idx_reviews_content_fts
ON reviews
USING gin(to_tsvector('simple', content));
```

Usage in queries:

```sql
WHERE to_tsvector('simple', name) @@ plainto_tsquery('simple', :searchTerm)
```

---

## Standard Query Filters

Every repository method returning lists MUST apply these filters by default:

### Soft delete filter

```typescript
where: {
  deletedAt: null,
}
```

### Business visibility by role

```
Guest / User   → status = 'approved' only
Business Owner → status IN ('pending', 'approved', 'rejected') WHERE ownerUserId = currentUserId
Admin          → all statuses
```

### Review visibility by role

```
Guest / User   → status IN ('pending', 'approved') AND deletedAt IS NULL
Admin          → all statuses including rejected and hidden
```

---

## Aggregate Ownership Matrix

| Table                | Owner Module  | Soft Delete |
|----------------------|---------------|-------------|
| roles                | auth          | No          |
| refresh_tokens       | auth          | No          |
| users                | user          | Yes         |
| images               | user/business/review | No   |
| businesses           | business      | Yes         |
| locations            | business      | No          |
| business_locations   | business      | No          |
| categories           | category      | No          |
| business_categories  | category      | No          |
| criteria             | criteria      | No          |
| category_criteria    | criteria      | No          |
| reviews              | review        | Yes         |
| review_criteria      | review        | No          |
| replies              | review        | No          |
| reasons              | report        | No          |
| reports              | report        | No          |
| bookmarks            | bookmark      | No          |
| notifications        | notification  | No          |
| ranking_snapshots    | ranking       | No          |
| ranking_snapshot_history | ranking   | No          |
| ranking_trend_config | ranking       | No          |
| logs                 | audit-log     | No          |

---

## Schema Validation Checklist

Before running migrations:

```
✓ All BIGSERIAL tables use @default(autoincrement())
✓ All SMALLSERIAL tables use @db.SmallInt + @default(autoincrement())
✓ All timestamps use @db.Timestamptz
✓ Soft delete tables have deletedAt DateTime?
✓ All tables have createdAt
✓ All updatable tables have updatedAt @updatedAt
✓ images CHECK constraint added in migration file
✓ FTS indexes added in migration file
✓ Seed data prepared for: roles, categories, reasons
```

---

End of SCHEMA.md — v1.0
