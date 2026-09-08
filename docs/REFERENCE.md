# REFERENCE.md

# Enterprise Evaluation & Ranking System (EERS)

Version: 1.0
Status: Locked
Priority: 6th (see DECISIONS.md D-027)

---

## How to use this document

This document is a lookup table.

Rules for AI agents:

```
- Use EXACTLY the values defined here — do not rename, retype, or abbreviate
- Error codes are the single source of truth for exception naming
- HTTP status codes map 1-to-1 with error codes — do not invent mappings
- Enum values must match database enum names exactly
- All string constants are case-sensitive
```

---

# Section 1. Database Enums

These values must match `schema.prisma` exactly.

## UserStatus

```typescript
enum UserStatus {
  active    = 'active'
  inactive  = 'inactive'
  banned    = 'banned'
  deleted   = 'deleted'
}
```

## BusinessStatus

```typescript
enum BusinessStatus {
  pending   = 'pending'
  approved  = 'approved'
  rejected  = 'rejected'
  hidden    = 'hidden'
}
```

## ReviewStatus

```typescript
enum ReviewStatus {
  pending   = 'pending'
  approved  = 'approved'
  rejected  = 'rejected'
  hidden    = 'hidden'
}
```

## ReportStatus

```typescript
enum ReportStatus {
  pending    = 'pending'
  reviewing  = 'reviewing'
  resolved   = 'resolved'
  rejected   = 'rejected'
}
```

## SentimentType

```typescript
enum SentimentType {
  positive  = 'positive'
  neutral   = 'neutral'
  negative  = 'negative'
}
```

## ImageType

```typescript
enum ImageType {
  AVATAR            = 'AVATAR'
  BUSINESS_COVER    = 'BUSINESS_COVER'
  BUSINESS_GALLERY  = 'BUSINESS_GALLERY'
  REVIEW_PHOTO      = 'REVIEW_PHOTO'
}
```

---

# Section 2. Role Names

Stored in `roles.role_name`. Seeded values — do not change.

```
USER
BUSINESS_OWNER
ADMIN
```

Used in JWT payload field `role`.

---

# Section 3. Notification Types

Stored in `notifications.type`. Use constants from `shared-constants`.

```typescript
BUSINESS_APPROVED   = 'BUSINESS_APPROVED'
BUSINESS_REJECTED   = 'BUSINESS_REJECTED'
REVIEW_APPROVED     = 'REVIEW_APPROVED'
REVIEW_REJECTED     = 'REVIEW_REJECTED'
REPORT_RESOLVED     = 'REPORT_RESOLVED'
NEW_REPLY           = 'NEW_REPLY'
REPORT_CREATED      = 'REPORT_CREATED'
NEW_REVIEW          = 'NEW_REVIEW'
CLAIM_SUBMITTED     = 'CLAIM_SUBMITTED'
CLAIM_APPROVED      = 'CLAIM_APPROVED'
CLAIM_REJECTED      = 'CLAIM_REJECTED'
```

Notification templates:

| Type               | Title                  | Content template                                            |
|--------------------|------------------------|---------------------------------------------------------------|
| BUSINESS_APPROVED  | "Business Approved"    | `Your business "{name}" has been approved.`                 |
| BUSINESS_REJECTED  | "Business Rejected"    | `Your business "{name}" was rejected. Reason: {reason}`     |
| REVIEW_APPROVED    | "Review Approved"      | `Your review has been approved.`                             |
| REVIEW_REJECTED    | "Review Rejected"      | `Your review has been rejected. Reason: {reason}`            |
| REPORT_RESOLVED    | "Report Resolved"      | `Your report has been reviewed and resolved.`                |
| NEW_REPLY          | "New Reply"            | `The business owner replied to your review.`                 |
| REPORT_CREATED     | "New Report"            | `A new report was submitted for review #{reviewId}.`         |
| NEW_REVIEW         | "New Review"            | `Your business "{name}" received a new review.`              |
| CLAIM_SUBMITTED    | "New Business Claim"    | `A new claim was submitted for business "{name}".`           |
| CLAIM_APPROVED     | "Claim Approved"        | `Your claim on "{name}" has been approved. You are now the owner of this business.` |
| CLAIM_REJECTED     | "Claim Rejected"        | `Your claim on "{name}" was rejected. Reason: {reason}`      |

REPORT_CREATED is sent to every user with the ADMIN role (see WF-RPT-001). NEW_REVIEW
is sent to the business owner (`business.ownerUserId`, see WF-REV-001). CLAIM_SUBMITTED
is sent to every user with the ADMIN role (see WF-CLAIM-001). All are delivered through
the same `CreateNotificationUseCase` mechanism as every other type (see WF-NOTI-001) —
no new endpoint or transport.

---

# Section 4. SSE Event Types

Sent via `text/event-stream`.

```
connection     ← sent once on connect
heartbeat      ← sent every 30 seconds
notification   ← sent when new notification for user
```

SSE event shape:

```typescript
// connection
interface SseConnectionEvent {
  event:     'connection'
  connected: true
  timestamp: string  // ISO-8601
}

// heartbeat
interface SseHeartbeatEvent {
  event:     'heartbeat'
  timestamp: string
}

// notification
interface SseNotificationEvent {
  event:          'notification'
  notificationId: number
  type:           string  // NOTIFICATION_TYPE value
  title:          string
  content:        string
}
```

---

# Section 5. Log Actions

Stored in `logs.action`. Use constants from `shared-constants`.

```typescript
// Auth
LOGIN_SUCCESS           = 'LOGIN_SUCCESS'
LOGOUT                  = 'LOGOUT'
PASSWORD_CHANGED        = 'PASSWORD_CHANGED'

// Business
BUSINESS_CREATED        = 'BUSINESS_CREATED'
BUSINESS_APPROVED       = 'BUSINESS_APPROVED'
BUSINESS_REJECTED       = 'BUSINESS_REJECTED'
BUSINESS_DELETED        = 'BUSINESS_DELETED'

// Review
REVIEW_CREATED          = 'REVIEW_CREATED'
REVIEW_APPROVED         = 'REVIEW_APPROVED'
REVIEW_REJECTED         = 'REVIEW_REJECTED'
REVIEW_DELETED          = 'REVIEW_DELETED'

// Report
REPORT_RESOLVED         = 'REPORT_RESOLVED'

// Business Claim
BUSINESS_CLAIM_SUBMITTED = 'BUSINESS_CLAIM_SUBMITTED'
BUSINESS_CLAIM_APPROVED  = 'BUSINESS_CLAIM_APPROVED'
BUSINESS_CLAIM_REJECTED  = 'BUSINESS_CLAIM_REJECTED'

// User
USER_BANNED             = 'USER_BANNED'

// System
RANKING_RECALCULATED    = 'RANKING_RECALCULATED'
```

Log entity types (stored in `logs.entity_type`):

```
User
Business
Review
Report
BusinessClaim
Ranking
System
```

---

# Section 6. Ranking Scopes

Stored in `ranking_snapshots.scope`.

```typescript
GLOBAL    = 'GLOBAL'    // scopeId = NULL
CATEGORY  = 'CATEGORY'  // scopeId = categoryId
PROVINCE  = 'PROVINCE'  // scopeId = NULL, filter by province string
```

## Ranking Trend Periods

Stored in `ranking_trend_config.period` (see DECISIONS.md D-031). Admin-editable via
`GET/PATCH /admin/rankings/trend-config`.

```typescript
DAY    = 'DAY'    // lookback = 1 day
WEEK   = 'WEEK'   // lookback = 7 days
MONTH  = 'MONTH'  // lookback = 30 days
```

Default: `WEEK`.

---

# Section 7. Cache Keys

Used in Redis. From `shared-constants/cache-keys.ts`.

```typescript
ranking:global
ranking:category:{categoryId}
ranking:province:{provinceName}
business:{businessId}
```

TTL:

```
ranking:*  → 3600 seconds (1 hour)
business:* → 300 seconds  (5 minutes)
```

---

# Section 8. Validation Rules

Applied via `class-validator` in DTOs.

## User

| Field           | Rules                                  |
|-----------------|----------------------------------------|
| name            | required, string, maxLength=100        |
| email           | required, isEmail, maxLength=255       |
| password        | required, string, minLength=8          |
| currentPassword | required, string                       |
| newPassword     | required, string, minLength=8          |

## Business

| Field       | Rules                                       |
|-------------|---------------------------------------------|
| name        | required, string, maxLength=150             |
| description | optional, string                            |
| phone       | required, string, maxLength=20              |
| email       | optional, isEmail, maxLength=255            |
| categoryIds | required, isArray, min 1 item, each isInt   |
| locations   | required, isArray, min 1 item               |

## Location

| Field       | Rules                          |
|-------------|--------------------------------|
| addressLine | required, string               |
| ward        | required, string, maxLength=100|
| province    | required, string, maxLength=100|

## Review

| Field           | Rules                                          |
|-----------------|------------------------------------------------|
| businessId      | required, isInt, isPositive                    |
| overallRating   | required, isInt, min=1, max=5                  |
| content         | required, string, minLength=10                 |
| criteriaRatings | required, isArray, min 1 item                  |
| criterionId     | required, isInt, isPositive                    |
| ratingValue     | required, isInt, min=1, max=5                  |

## Report

| Field       | Rules                          |
|-------------|--------------------------------|
| reviewId    | required, isInt, isPositive    |
| reasonId    | required, isInt, isPositive    |
| description | optional, string               |

## Business Claim

| Field      | Rules                                         |
|------------|------------------------------------------------|
| businessId | required, isInt, isPositive                    |
| message    | required, string, minLength=20, maxLength=1000 |

Claim rejection reuses the existing `## Admin moderation` table's `reason` rule
(required, string, minLength=10) below — no separate rule needed.

## Reply

| Field   | Rules                    |
|---------|--------------------------|
| content | required, string, min=1  |

## Admin moderation

| Field  | Rules                           |
|--------|---------------------------------|
| reason | required, string, minLength=10  |

## Ranking Trend Config (Admin)

| Field  | Rules                                  |
|--------|-----------------------------------------|
| period | required, isIn(['DAY','WEEK','MONTH']) |

---

# Section 9. File Upload Rules

| Rule              | Value                    |
|-------------------|--------------------------|
| Allowed types     | jpg, jpeg, png, webp     |
| Max size          | 10 MB (10 * 1024 * 1024) |
| Storage           | Cloudinary only          |
| DB fields         | secureUrl, cloudinaryPublicId |
| Max gallery images| 20 per business          |
| Max upload batch  | 5 files per request      |
| Max review photos | 5 per review             |

MIME type whitelist:

```
image/jpeg
image/jpg
image/png
image/webp
```

---

# Section 10. Pagination Defaults

| Parameter | Default | Maximum |
|-----------|---------|---------|
| page      | 1       | —       |
| limit     | 20      | 100     |

When `limit > 100`, silently cap to 100. Do NOT throw error.

---

# Section 11. JWT Configuration

| Token         | Secret env var          | Expiry  | Storage              |
|---------------|-------------------------|---------|----------------------|
| Access Token  | JWT_ACCESS_SECRET       | 15m     | Memory (client)      |
| Refresh Token | JWT_REFRESH_SECRET      | 7d      | HttpOnly Cookie      |

Cookie config:

```
name:     refreshToken
httpOnly: true
secure:   true  (false in development)
sameSite: strict
path:     /api/v1/auth/refresh
maxAge:   604800  (7 days in seconds)
```

---

# Section 12. Ranking Formula Constants

Defaults from DECISIONS.md D-012; administrators may update them through scoring config.

```
C = 0.63  // prior mean on the normalized [0,1] scale
m = 10    // positive prior strength
score = 100 * (C * m + R * v) / (m + v)
```

`R` is the weighted mean of normalized multi-criteria scores. `v` counts approved,
non-deleted reviews with positive weight. Fraud REJECTED has zero weight;
SUSPICIOUS scales the entire review weight by delta. Businesses with `v=0` are
omitted from all ranking snapshots, rather than displaying the prior as a score.
See D-012 for trust inputs, the status gate, and tie ordering.

Cron schedule:

```
0 * * * *   (every hour, on the hour)
```

---

# Section 13. Error Codes & HTTP Status Mapping

Global exception filter maps these codes to HTTP responses.

## Auth errors

| Code                    | HTTP | Description                              |
|-------------------------|------|------------------------------------------|
| UNAUTHORIZED            | 401  | No token provided                        |
| INVALID_CREDENTIALS     | 401  | Wrong email or password                  |
| INVALID_REFRESH_TOKEN   | 401  | Refresh token invalid or revoked         |
| TOKEN_EXPIRED           | 401  | Access or refresh token expired          |
| INVALID_GOOGLE_TOKEN    | 401  | Google idToken verification failed       |
| USER_BANNED             | 403  | Account is banned                        |
| FORBIDDEN               | 403  | Authenticated but not authorized         |

## User errors

| Code                    | HTTP | Description                              |
|-------------------------|------|------------------------------------------|
| USER_NOT_FOUND          | 404  | User does not exist                      |
| EMAIL_ALREADY_EXISTS    | 409  | Email already registered                 |
| INVALID_PASSWORD        | 400  | Current password is incorrect            |
| CANNOT_BAN_ADMIN        | 400  | Cannot ban an admin account              |
| USER_NOT_BANNED         | 400  | User is not banned (for unban)           |

## Business errors

| Code                    | HTTP | Description                              |
|-------------------------|------|------------------------------------------|
| BUSINESS_NOT_FOUND      | 404  | Business does not exist                  |
| BUSINESS_NOT_APPROVED   | 400  | Business is not approved for reviews     |
| BUSINESS_NOT_PENDING    | 400  | Business is not in pending status        |
| PHONE_ALREADY_EXISTS    | 409  | Phone number already in use              |
| EMAIL_ALREADY_EXISTS    | 409  | Business email already in use            |
| LAST_LOCATION_ERROR     | 400  | Cannot remove the last location          |
| LOCATION_NOT_FOUND      | 404  | Location does not exist                  |
| GALLERY_LIMIT_EXCEEDED  | 400  | Maximum gallery images (20) reached      |

## Review errors

| Code                    | HTTP | Description                              |
|-------------------------|------|------------------------------------------|
| REVIEW_NOT_FOUND        | 404  | Review does not exist                    |
| REVIEW_ALREADY_EXISTS   | 409  | User already reviewed this business      |
| REVIEW_NOT_PENDING      | 400  | Review is not in pending status          |
| INVALID_RATING          | 400  | Rating must be integer between 1 and 5   |
| INVALID_CRITERION       | 400  | Criterion does not belong to business    |
| PHOTO_LIMIT_EXCEEDED    | 400  | Maximum review photos (5) reached        |

## Reply errors

| Code                    | HTTP | Description                              |
|-------------------------|------|------------------------------------------|
| REPLY_NOT_FOUND         | 404  | Reply does not exist                     |
| REPLY_ALREADY_EXISTS    | 409  | Review already has a reply               |

## Report errors

| Code                    | HTTP | Description                              |
|-------------------------|------|------------------------------------------|
| REPORT_NOT_FOUND        | 404  | Report does not exist                    |
| REPORT_ALREADY_EXISTS   | 409  | User already reported this review        |
| REPORT_NOT_WITHDRAWABLE | 400  | Report status is not pending             |
| REASON_NOT_FOUND        | 404  | Report reason does not exist             |

## Business Claim errors

| Code                     | HTTP | Description                                    |
|--------------------------|------|-------------------------------------------------|
| BUSINESS_CLAIM_NOT_FOUND | 404  | Business claim does not exist                  |
| BUSINESS_ALREADY_CLAIMED | 409  | Business already has an owner                  |
| CLAIM_ALREADY_PENDING    | 409  | User already has a pending claim on this business |
| CLAIM_NOT_PENDING        | 400  | Claim status is not pending                    |

## Bookmark errors

| Code                    | HTTP | Description                              |
|-------------------------|------|-------------------------------------------|
| BOOKMARK_NOT_FOUND      | 404  | Bookmark does not exist                  |
| BOOKMARK_ALREADY_EXISTS | 409  | User already bookmarked this business    |

## Category & Criteria errors

| Code                       | HTTP | Description                           |
|----------------------------|------|---------------------------------------|
| CATEGORY_NOT_FOUND         | 404  | Category does not exist               |
| CATEGORY_ALREADY_EXISTS    | 409  | Category name already taken           |
| CRITERION_NOT_FOUND        | 404  | Criterion does not exist              |
| CRITERION_ALREADY_EXISTS   | 409  | Criterion name already taken          |
| ASSIGNMENT_ALREADY_EXISTS  | 409  | Criterion already assigned to category|
| ASSIGNMENT_NOT_FOUND       | 404  | Assignment does not exist             |

## Notification errors

| Code                    | HTTP | Description                              |
|-------------------------|------|------------------------------------------|
| NOTIFICATION_NOT_FOUND  | 404  | Notification does not exist              |

## File errors

| Code                    | HTTP | Description                              |
|-------------------------|------|------------------------------------------|
| INVALID_FILE_TYPE       | 400  | File type not allowed                    |
| FILE_TOO_LARGE          | 400  | File exceeds 10MB limit                  |
| IMAGE_NOT_FOUND         | 404  | Image not found                          |

## General errors

| Code                    | HTTP | Description                              |
|-------------------------|------|------------------------------------------|
| VALIDATION_ERROR        | 400  | DTO validation failed                    |
| RESOURCE_NOT_FOUND      | 404  | Generic not found                        |
| INTERNAL_SERVER_ERROR   | 500  | Unhandled server error                   |

---

# Section 14. Response Envelope (Quick Reference)

Success:

```json
{ "success": true, "data": {} }
{ "success": true, "data": [] }
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
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

Validation error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed"
  },
  "details": [
    { "field": "email", "message": "email must be an email" }
  ]
}
```

---

# Section 15. Seed Data

Data that MUST exist before any business logic runs.

## roles (seeded in Phase 0)

| roleId | roleName       |
|--------|----------------|
| 1      | USER           |
| 2      | BUSINESS_OWNER |
| 3      | ADMIN          |

## categories (seeded in Phase 0)

| categoryName              |
|---------------------------|
| Information Technology    |
| Education                 |
| Healthcare                |
| Finance                   |
| Retail                    |

## reasons (seeded in Phase 0)

| name                  |
|-----------------------|
| Spam                  |
| Fake Review           |
| Harassment            |
| Offensive Content     |
| Conflict of Interest  |
| Other                 |

## ranking_trend_config (seeded in migration)

Singleton row, seeded once:

| period |
|--------|
| WEEK   |

---

# Section 16. Environment Variables Reference

All variables required for `apps/api`:

| Variable                | Required | Description                          |
|-------------------------|----------|--------------------------------------|
| NODE_ENV                | Yes      | development / production             |
| PORT                    | Yes      | Server port (default 3000)           |
| API_PREFIX              | Yes      | URL prefix (api/v1)                  |
| DATABASE_URL            | Yes      | PostgreSQL connection string         |
| REDIS_URL               | Yes      | Redis connection string              |
| JWT_ACCESS_SECRET       | Yes      | Secret for access token signing      |
| JWT_REFRESH_SECRET      | Yes      | Secret for refresh token signing     |
| JWT_ACCESS_EXPIRES_IN   | Yes      | e.g. 15m                             |
| JWT_REFRESH_EXPIRES_IN  | Yes      | e.g. 7d                              |
| CLOUDINARY_CLOUD_NAME   | Yes      | Cloudinary cloud name                |
| CLOUDINARY_API_KEY      | Yes      | Cloudinary API key                   |
| CLOUDINARY_API_SECRET   | Yes      | Cloudinary API secret                |
| GOOGLE_CLIENT_ID        | Yes      | Google OAuth client ID               |
| GOOGLE_CLIENT_SECRET    | Yes      | Google OAuth client secret           |
| COOKIE_SECRET           | Yes      | Cookie signing secret                |

All variables required for `apps/web`:

| Variable                    | Required | Description                      |
|-----------------------------|----------|----------------------------------|
| NEXT_PUBLIC_API_URL         | Yes      | Backend base URL                 |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID| Yes      | Google OAuth client ID           |

---

End of REFERENCE.md — v1.0
