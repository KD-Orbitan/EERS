# API.md

# Enterprise Evaluation & Ranking System (EERS)

Version: 1.0
Status: Locked
Priority: 3rd (see DECISIONS.md D-027)

---

## How to use this document

This is the single source of truth for all API contracts.

Rules for AI agents:

```
- Implement EXACTLY the endpoints defined here, nothing more
- Do NOT invent endpoints not listed here
- Do NOT rename routes, change HTTP methods, or alter response shapes
- Request/Response shapes are TypeScript interfaces — implement as-is
- Error codes must match exactly — see REFERENCE.md for full error code list
- All routes are relative to /api/v1
```

---

## Global Conventions

### Auth notation

```
Public         → no token required
User+          → requires JWT, any authenticated role
BusinessOwner+ → requires JWT, role = BUSINESS_OWNER or ADMIN
Admin          → requires JWT, role = ADMIN only
```

### Response wrapper

All responses use the envelope defined in DECISIONS.md D-022.
Interfaces below describe the `data` field only.

### Pagination params (reused across endpoints)

```typescript
interface PaginationQuery {
  page?:  number  // default 1
  limit?: number  // default 20, max 100
}
```

### Sorting params (reused across endpoints)

```typescript
interface SortQuery {
  sortBy?:    string
  sortOrder?: 'asc' | 'desc'  // default 'desc'
}
```

---

# Chapter 1. Auth APIs

Base: `/auth`

---

## POST /auth/register

```
Auth   : Public
Purpose: Create a new user account with role USER
```

Request:

```typescript
interface RegisterDto {
  name:     string  // max 100 chars
  email:    string  // valid email, unique
  password: string  // min 8 chars
}
```

Response `201`:

```typescript
interface RegisterResponse {
  userId: number
  name:   string
  email:  string
  role:   'USER'
}
```

Errors:

```
EMAIL_ALREADY_EXISTS  409
VALIDATION_ERROR      400
```

---

## POST /auth/login

```
Auth   : Public
Purpose: Authenticate with email + password
```

Request:

```typescript
interface LoginDto {
  email:    string
  password: string
}
```

Response `200`:

```typescript
interface LoginResponse {
  accessToken: string
  expiresIn:   number  // seconds, value = 900
  user: {
    userId: number
    name:   string
    role:   'USER' | 'BUSINESS_OWNER' | 'ADMIN'
  }
}
```

Side effect:

```
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800
```

Errors:

```
INVALID_CREDENTIALS  401
USER_BANNED          403
VALIDATION_ERROR     400
```

---

## POST /auth/google

```
Auth   : Public
Purpose: Authenticate via Google OAuth — frontend sends idToken obtained from Google SDK
```

Request:

```typescript
interface GoogleAuthDto {
  idToken: string  // ID token from Google Sign-In SDK
}
```

Behavior:

```
1. Verify idToken with Google
2. If email exists → link account, issue tokens
3. If email not exists → create new account with role USER, issue tokens
```

Response `200`:

```typescript
interface GoogleAuthResponse {
  accessToken: string
  expiresIn:   number
  user: {
    userId: number
    name:   string
    email:  string
    role:   'USER' | 'BUSINESS_OWNER' | 'ADMIN'
  }
}
```

Side effect:

```
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800
```

Errors:

```
INVALID_GOOGLE_TOKEN  401
USER_BANNED           403
```

---

## POST /auth/refresh

```
Auth   : Public (uses HttpOnly Cookie)
Purpose: Issue new access token using refresh token from cookie
```

Request:

```
No body — reads refreshToken from HttpOnly Cookie automatically
```

Response `200`:

```typescript
interface RefreshResponse {
  accessToken: string
  expiresIn:   number  // 900
}
```

Errors:

```
INVALID_REFRESH_TOKEN  401
TOKEN_EXPIRED          401
```

---

## POST /auth/logout

```
Auth   : User+
Purpose: Revoke refresh token and clear cookie
```

Request:

```
No body
```

Response `200`:

```typescript
interface LogoutResponse {
  message: string  // "Logged out successfully"
}
```

Side effect:

```
Clear-Cookie: refreshToken
Revoke refresh token in database
```

---

## GET /auth/me

```
Auth   : User+
Purpose: Get current authenticated user
```

Response `200`:

```typescript
interface MeResponse {
  userId:    number
  name:      string
  email:     string
  avatarUrl: string | null
  role:      'USER' | 'BUSINESS_OWNER' | 'ADMIN'
  status:    'active' | 'inactive' | 'banned'
  createdAt: string  // ISO-8601
}
```

---

# Chapter 2. User APIs

Base: `/users`

---

## GET /users/profile

```
Auth   : User+
Purpose: Get current user's profile
```

Response `200`:

```typescript
interface UserProfileResponse {
  userId:    number
  name:      string
  email:     string
  avatarUrl: string | null
  status:    'active' | 'inactive' | 'banned'
  createdAt: string
}
```

---

## PATCH /users/profile

```
Auth   : User+
Purpose: Update current user's name
```

Request:

```typescript
interface UpdateProfileDto {
  name: string  // max 100 chars
}
```

Response `200`:

```typescript
interface UpdateProfileResponse {
  userId: number
  name:   string
}
```

Errors:

```
VALIDATION_ERROR  400
```

---

## PATCH /users/change-password

```
Auth   : User+
Purpose: Change current user's password
```

Request:

```typescript
interface ChangePasswordDto {
  currentPassword: string
  newPassword:     string  // min 8 chars
}
```

Response `200`:

```typescript
interface ChangePasswordResponse {
  message: string  // "Password changed successfully"
}
```

Errors:

```
INVALID_PASSWORD  400
VALIDATION_ERROR  400
```

---

## POST /users/avatar

```
Auth        : User+
Purpose     : Upload or replace avatar image
Content-Type: multipart/form-data
```

Request:

```
Field: avatar (file)
Allowed types: jpg, jpeg, png, webp
Max size: 10MB
```

Response `200`:

```typescript
interface UploadAvatarResponse {
  avatarUrl: string  // Cloudinary HTTPS URL
}
```

Errors:

```
INVALID_FILE_TYPE  400
FILE_TOO_LARGE     400
```

---

# Chapter 3. Business APIs

Base: `/businesses`

---

## POST /businesses

```
Auth   : User+
Purpose: Create a new business (starts as pending)
```

Request:

```typescript
interface CreateBusinessDto {
  name:        string    // max 150 chars
  description: string?
  phone:       string    // max 20 chars, unique
  email:       string?   // valid email, unique
  categoryIds: number[]  // min 1 category (smallint IDs)
  locations: Array<{
    addressLine: string  // required
    ward:        string  // max 100 chars
    province:    string  // max 100 chars
  }>                     // min 1 location
}
```

Response `201`:

```typescript
interface CreateBusinessResponse {
  businessId: number
  status:     'pending'
}
```

Errors:

```
VALIDATION_ERROR          400
CATEGORY_NOT_FOUND        404
PHONE_ALREADY_EXISTS      409
EMAIL_ALREADY_EXISTS      409
```

---

## GET /businesses

```
Auth   : Public
Purpose: List approved businesses with filtering and pagination
```

Query params:

```typescript
interface BusinessListQuery extends PaginationQuery, SortQuery {
  search?:     string   // FTS on name + description
  categoryId?: number
  province?:   string
}
```

Allowed `sortBy` values:

```
avgRating   (default)
createdAt
reviewCount
```

Response `200` (paginated):

```typescript
interface BusinessListItem {
  businessId:  number
  name:        string
  description: string | null
  avgRating:   number
  reviewCount: number
  status:      'approved'
  province:    string | null  // from first location
  latitude:    number | null  // from first location with coordinates — see D-032
  longitude:   number | null  // from first location with coordinates — see D-032
  categories:  Array<{ categoryId: number; categoryName: string }>
  logoUrl:     string | null  // from imageType = 'BUSINESS_LOGO'
}
```

Notes:

```
- Returns approved businesses only (public)
- reviewCount = count of approved reviews only
```

---

## GET /businesses/my

```
Auth   : User+
Purpose: Get all businesses owned by current user (all statuses)
```

Notes:

```
IMPORTANT: Register this route BEFORE /businesses/:businessId in NestJS
to prevent 'my' being parsed as businessId param
```

Response `200` (paginated):

```typescript
interface MyBusinessListItem {
  businessId: number
  name:       string
  status:     'pending' | 'approved' | 'rejected' | 'hidden'
  avgRating:  number
  createdAt:  string
}
```

---

## GET /businesses/:businessId

```
Auth   : Public (visibility varies by role — see notes)
Purpose: Get business detail
```

Visibility rules:

```
approved  → visible to everyone
pending   → visible to owner + admin only
rejected  → visible to owner + admin only
hidden    → visible to admin only
```

Response `200`:

```typescript
interface BusinessDetailResponse {
  businessId:   number
  name:         string
  description:  string | null
  phone:        string
  email:        string | null
  avgRating:    number
  reviewCount:  number
  status:       'pending' | 'approved' | 'rejected' | 'hidden'
  owner: {
    userId: number
    name:   string
  }
  categories: Array<{
    categoryId:   number
    categoryName: string
  }>
  locations: Array<{
    locationId:  number
    addressLine: string
    ward:        string
    province:    string
    latitude:    number | null  // auto-geocoded — see D-032
    longitude:   number | null  // auto-geocoded — see D-032
  }>
  coverUrl: string | null       // from imageType = 'BUSINESS_COVER'
  logoUrl:  string | null       // from imageType = 'BUSINESS_LOGO'
  gallery: Array<{              // from imageType = 'BUSINESS_GALLERY', ordered by displayOrder
    imageId:      number
    url:          string
    displayOrder: number | null
  }>
  createdAt: string
}
```

Errors:

```
BUSINESS_NOT_FOUND  404
FORBIDDEN           403
```

---

## PATCH /businesses/:businessId

```
Auth   : BusinessOwner+ (must own business), Admin
Purpose: Update business info
```

Request:

```typescript
interface UpdateBusinessDto {
  name?:        string
  description?: string
  phone?:       string
  email?:       string
}
```

Response `200`:

```typescript
interface UpdateBusinessResponse {
  businessId: number
}
```

Errors:

```
BUSINESS_NOT_FOUND    404
FORBIDDEN             403
PHONE_ALREADY_EXISTS  409
EMAIL_ALREADY_EXISTS  409
```

---

## DELETE /businesses/:businessId

```
Auth     : BusinessOwner+ (must own business), Admin
Purpose  : Soft delete business
Behavior : Sets deletedAt = now()
```

Response `204`: No content

Errors:

```
BUSINESS_NOT_FOUND  404
FORBIDDEN           403
```

---

## GET /businesses/:businessId/statistics

```
Auth   : BusinessOwner+ (must own business), Admin
Purpose: Get business performance statistics
```

Response `200`:

```typescript
interface BusinessStatisticsResponse {
  reviewCount:     number
  avgRating:       number
  rankingPosition: number | null
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}
```

Errors:

```
BUSINESS_NOT_FOUND  404
FORBIDDEN           403
```

---

## GET /businesses/:businessId/review-trend

```
Auth   : BusinessOwner+ (must own business), Admin
Purpose: Get monthly approved-review counts for the owner dashboard chart
```

Response `200`:

```typescript
interface ReviewTrendPoint {
  month:       string  // "YYYY-MM"
  reviewCount: number
}

type ReviewTrendResponse = ReviewTrendPoint[]
```

Notes:

```
- Always exactly 12 points, one per calendar month, oldest first, ending
  with the current month — months with no reviews return reviewCount: 0
  (no gaps)
- Computed over reviews WHERE business_id = :businessId AND status =
  'approved' AND deleted_at IS NULL, same filter as
  GET /businesses/:businessId/statistics.reviewCount
```

Errors:

```
BUSINESS_NOT_FOUND  404
FORBIDDEN           403
```

---

## POST /businesses/:businessId/locations

```
Auth   : BusinessOwner+ (must own business), Admin
Purpose: Add a new location to a business
```

Request:

```typescript
interface CreateLocationDto {
  addressLine: string
  ward:        string  // max 100 chars
  province:    string  // max 100 chars
}
```

Response `201`:

```typescript
interface CreateLocationResponse {
  locationId: number
}
```

Notes:

```
`latitude`/`longitude` are auto-geocoded server-side from the address (D-032) —
never accepted as request input, not returned in this response (fetch the
business detail to see them once geocoded).
```

Errors:

```
BUSINESS_NOT_FOUND  404
FORBIDDEN           403
```

---

## PATCH /businesses/:businessId/locations/:locationId

```
Auth   : BusinessOwner+ (must own business), Admin
Purpose: Update a business location
```

Request:

```typescript
interface UpdateLocationDto {
  addressLine?: string
  ward?:        string
  province?:    string
}
```

Response `200`:

```typescript
interface UpdateLocationResponse {
  locationId: number
}
```

Notes:

```
Changing addressLine/ward/province re-geocodes latitude/longitude server-side
(D-032) — never accepted as request input.
```

Errors:

```
BUSINESS_NOT_FOUND   404
LOCATION_NOT_FOUND   404
FORBIDDEN            403
```

---

## DELETE /businesses/:businessId/locations/:locationId

```
Auth   : BusinessOwner+ (must own business), Admin
Purpose: Remove a location from a business
```

Response `204`: No content

Errors:

```
BUSINESS_NOT_FOUND        404
LOCATION_NOT_FOUND        404
FORBIDDEN                 403
LAST_LOCATION_ERROR       400  // cannot remove last location
```

---

## POST /businesses/:businessId/cover

```
Auth        : BusinessOwner+ (must own business), Admin
Purpose     : Upload or replace the business cover photo
Content-Type: multipart/form-data
```

Request:

```
Field: cover (file)
Allowed types: jpg, jpeg, png, webp
Max size: 10MB
```

Workflow: if a cover already exists, the old image is deleted from Cloudinary and its record removed before the new one is created (see WF-BUS-006).

Response `200`:

```typescript
interface UploadCoverResponse {
  coverUrl: string
}
```

Errors:

```
BUSINESS_NOT_FOUND   404
FORBIDDEN             403
INVALID_FILE_TYPE     400
FILE_TOO_LARGE        400
```

---

## DELETE /businesses/:businessId/cover

```
Auth   : BusinessOwner+ (must own business), Admin
Purpose: Remove the business cover photo
```

Response `204`: No content

Errors:

```
BUSINESS_NOT_FOUND   404
FORBIDDEN             403
IMAGE_NOT_FOUND       404  // no cover currently set
```

---

## POST /businesses/:businessId/logo

```
Auth        : BusinessOwner+ (must own business), Admin
Purpose     : Upload or replace the business logo (small square brand mark shown in cards/listings — distinct from the cover banner)
Content-Type: multipart/form-data
```

Request:

```
Field: logo (file)
Allowed types: jpg, jpeg, png, webp
Max size: 10MB
```

Workflow: if a logo already exists, the old image is deleted from Cloudinary and its record removed before the new one is created (see WF-BUS-009).

Response `200`:

```typescript
interface UploadLogoResponse {
  logoUrl: string
}
```

Errors:

```
BUSINESS_NOT_FOUND   404
FORBIDDEN             403
INVALID_FILE_TYPE     400
FILE_TOO_LARGE        400
```

---

## DELETE /businesses/:businessId/logo

```
Auth   : BusinessOwner+ (must own business), Admin
Purpose: Remove the business logo
```

Response `204`: No content

Errors:

```
BUSINESS_NOT_FOUND   404
FORBIDDEN             403
IMAGE_NOT_FOUND       404  // no logo currently set
```

---

## POST /businesses/:businessId/gallery

```
Auth        : BusinessOwner+ (must own business), Admin
Purpose     : Upload one or more business gallery images
Content-Type: multipart/form-data
```

Request:

```
Field: images (file[], max 5 files per request)
Allowed types: jpg, jpeg, png, webp
Max size: 10MB per file
```

New images are appended after the current max displayOrder for the business (see WF-BUS-007). Total gallery images per business is capped at 20.

Response `201`:

```typescript
interface UploadGalleryResponse {
  images: Array<{
    imageId:      number
    url:          string
    displayOrder: number
  }>
}
```

Errors:

```
BUSINESS_NOT_FOUND        404
FORBIDDEN                  403
INVALID_FILE_TYPE          400
FILE_TOO_LARGE             400
GALLERY_LIMIT_EXCEEDED     400
```

---

## DELETE /businesses/:businessId/gallery/:imageId

```
Auth   : BusinessOwner+ (must own business), Admin
Purpose: Remove a single image from the business gallery
```

Response `204`: No content

Errors:

```
BUSINESS_NOT_FOUND   404
FORBIDDEN             403
IMAGE_NOT_FOUND       404  // imageId does not belong to this business's gallery
```

---

## PATCH /businesses/:businessId/gallery/reorder

```
Auth   : BusinessOwner+ (must own business), Admin
Purpose: Reorder the business gallery
```

Request:

```typescript
interface ReorderGalleryDto {
  imageIds: number[]  // ordered array of imageIds — new display order (1-based)
}
```

Response `200`:

```typescript
interface ReorderGalleryResponse {
  message: string  // "Gallery reordered successfully"
}
```

Errors:

```
BUSINESS_NOT_FOUND   404
FORBIDDEN             403
IMAGE_NOT_FOUND       404  // one or more imageIds do not belong to this business's gallery
```

---

# Chapter 4. Category APIs

Base: `/categories`

---

## GET /categories

```
Auth   : Public
Purpose: List all categories
```

Response `200`:

```typescript
interface CategoryListItem {
  categoryId:   number
  categoryName: string
}
```

---

## GET /categories/:categoryId

```
Auth   : Public
Purpose: Get category detail
```

Response `200`:

```typescript
interface CategoryDetailResponse {
  categoryId:   number
  categoryName: string
}
```

Errors:

```
CATEGORY_NOT_FOUND  404
```

---

## GET /categories/:categoryId/criteria

```
Auth   : Public
Purpose: Get all criteria belonging to a category
```

Response `200`:

```typescript
interface CriterionItem {
  criterionId:  number
  name:         string
  description:  string | null
}
```

Errors:

```
CATEGORY_NOT_FOUND  404
```

---

# Chapter 5. Criteria APIs

Base: `/criteria`

---

## GET /criteria

```
Auth   : Public
Purpose: List all criteria
```

Response `200`:

```typescript
interface CriterionListItem {
  criterionId:  number
  name:         string
  description:  string | null
}
```

---

# Chapter 6. Review APIs

Base: `/reviews` and `/businesses/:businessId/reviews`

---

## POST /reviews

```
Auth   : User+
Purpose: Create a review for a business (starts as pending)
```

Request:

```typescript
interface CreateReviewDto {
  businessId:    number
  overallRating: number  // integer 1-5
  content:       string  // min 10 chars
  criteriaRatings: Array<{
    criterionId:  number  // must belong to business's category
    ratingValue:  number  // integer 1-5
  }>                      // min 1 entry
}
```

Response `201`:

```typescript
interface CreateReviewResponse {
  reviewId: number
  status:   'pending'
}
```

Behavior:

```
- status starts as 'pending'
- criteriaRatings must cover criteria from business's categories
```

Errors:

```
BUSINESS_NOT_FOUND      404
BUSINESS_NOT_APPROVED   400
REVIEW_ALREADY_EXISTS   409
INVALID_RATING          400
INVALID_CRITERION       400
VALIDATION_ERROR        400
```

---

## GET /businesses/:businessId/reviews

```
Auth   : Public
Purpose: List reviews for a business
```

Query params:

```typescript
interface BusinessReviewsQuery extends PaginationQuery {
  rating?:  number  // filter by overallRating (1-5)
  status?:  'approved' | 'pending' | 'rejected' | 'hidden'
}
```

Status filter rules:

```
Guest / User  → always receives approved + pending only
              → status param is IGNORED
Admin         → can filter all statuses
```

Response `200` (paginated):

```typescript
interface ReviewListItem {
  reviewId:      number
  overallRating: number
  content:       string
  status:        'pending' | 'approved' | 'rejected' | 'hidden'
  sentiment:     'positive' | 'neutral' | 'negative' | null
  author: {
    userId: number
    name:   string
  }
  criteriaRatings: Array<{
    criterionId:   number
    criterionName: string
    ratingValue:   number
  }>
  photos: Array<{           // from imageType = 'REVIEW_PHOTO'
    imageId: number
    url:     string
  }>
  reply: {
    replyId:   number
    content:   string
    createdAt: string
  } | null
  createdAt: string
}
```

Errors:

```
BUSINESS_NOT_FOUND  404
```

---

## GET /reviews/my

```
Auth   : User+
Purpose: Get all reviews written by current user
```

Notes:

```
IMPORTANT: Register this route BEFORE /reviews/:reviewId in NestJS
```

Response `200` (paginated):

```typescript
interface MyReviewListItem {
  reviewId:      number
  overallRating: number
  status:        'pending' | 'approved' | 'rejected' | 'hidden'
  business: {
    businessId: number
    name:       string
  }
  createdAt: string
}
```

---

## GET /reviews/recent

```
Auth   : Public
Purpose: Get the most recent approved reviews across all businesses (shortcut endpoint for homepage widgets)
```

Notes:

```
IMPORTANT: Register this route BEFORE /reviews/:reviewId in NestJS
Only status = 'approved' reviews are eligible. Ordered newest first.
```

Query params:

```typescript
interface RecentReviewsQuery {
  limit?: number  // default 6, max 20
}
```

Response `200`:

```typescript
interface RecentReviewItem {
  reviewId:      number
  overallRating: number
  content:       string
  author: {
    name: string
  }
  business: {
    businessId: number
    name:       string
  }
  createdAt: string
}
```

---

## GET /reviews/:reviewId

```
Auth   : Public
Purpose: Get review detail
```

Visibility:

```
approved + pending → visible to public
rejected + hidden  → visible to admin only
```

Response `200`:

```typescript
interface ReviewDetailResponse {
  reviewId:      number
  overallRating: number
  content:       string
  status:        'pending' | 'approved' | 'rejected' | 'hidden'
  sentiment:     'positive' | 'neutral' | 'negative' | null
  author: {
    userId: number
    name:   string
  }
  business: {
    businessId: number
    name:       string
  }
  criteriaRatings: Array<{
    criterionId:   number
    criterionName: string
    ratingValue:   number
  }>
  photos: Array<{           // from imageType = 'REVIEW_PHOTO'
    imageId: number
    url:     string
  }>
  reply: {
    replyId:   number
    content:   string
    createdAt: string
  } | null
  createdAt: string
  updatedAt: string
}
```

Errors:

```
REVIEW_NOT_FOUND  404
FORBIDDEN         403
```

---

## PATCH /reviews/:reviewId

```
Auth   : User+ (must own review), Admin
Purpose: Update review content
```

Request:

```typescript
interface UpdateReviewDto {
  overallRating?:  number
  content?:        string
  criteriaRatings?: Array<{
    criterionId: number
    ratingValue: number
  }>
}
```

Behavior:

```
- After update, status resets to 'pending' (requires re-moderation)
- Owner can only edit own review
- Admin can edit any review for moderation purposes
```

Response `200`:

```typescript
interface UpdateReviewResponse {
  reviewId: number
  status:   'pending'
}
```

Errors:

```
REVIEW_NOT_FOUND  404
FORBIDDEN         403
INVALID_RATING    400
INVALID_CRITERION 400
```

---

## DELETE /reviews/:reviewId

```
Auth     : User+ (must own review), Admin
Purpose  : Soft delete review
Behavior : Sets deletedAt = now()
```

Response `204`: No content

Errors:

```
REVIEW_NOT_FOUND  404
FORBIDDEN         403
```

---

## POST /reviews/:reviewId/photos

```
Auth        : User+ (must own review), Admin
Purpose     : Attach photos to a review
Content-Type: multipart/form-data
```

Request:

```
Field: photos (file[], max 5 files per request)
Allowed types: jpg, jpeg, png, webp
Max size: 10MB per file
```

Behavior: total photos per review is capped at 5 (existing + new).

Response `201`:

```typescript
interface UploadReviewPhotosResponse {
  photos: Array<{
    imageId: number
    url:     string
  }>
}
```

Errors:

```
REVIEW_NOT_FOUND      404
FORBIDDEN              403
INVALID_FILE_TYPE      400
FILE_TOO_LARGE         400
PHOTO_LIMIT_EXCEEDED   400
```

---

## DELETE /reviews/:reviewId/photos/:imageId

```
Auth   : User+ (must own review), Admin
Purpose: Remove a single photo from a review
```

Response `204`: No content

Errors:

```
REVIEW_NOT_FOUND   404
FORBIDDEN          403
IMAGE_NOT_FOUND    404  // imageId does not belong to this review
```

---

## POST /reviews/:reviewId/analyze-sentiment

```
Auth   : Admin only
Purpose: Run sentiment analysis on a review's content and persist the result
Behavior: Runs local ML inference (Transformers.js) on review.content, then
          updates sentiment, sentimentScore, and sentimentAnalyzedAt on the review
```

Response `200`:

```typescript
interface AnalyzeReviewSentimentResponse {
  sentiment:  'positive' | 'neutral' | 'negative'
  score:      number   // 0.0000-1.0000
  analyzedAt: string   // ISO 8601
}
```

Errors:

```
REVIEW_NOT_FOUND                404
SENTIMENT_ANALYSIS_UNAVAILABLE  503  // model failed to load, or inference failed
```

Notes:

```
- Also run automatically by a daily cron job over reviews where
  sentimentAnalyzedAt IS NULL (batches of 10) — this endpoint exists for
  on-demand/manual re-analysis by an admin
- Display-only: sentiment/score are not used in the ranking/fraud pipeline
  (sentimentLambda in scoring_config remains 0 per D-012 MVP)
```

---

## GET /businesses/:businessId/review-statistics

```
Auth   : Public
Purpose: Get aggregated review statistics for a business
```

Response `200`:

```typescript
interface ReviewStatisticsResponse {
  reviewCount:  number  // approved reviews only
  avgRating:    number  // approved reviews only
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}
```

Errors:

```
BUSINESS_NOT_FOUND  404
```

---

## GET /businesses/:businessId/sentiment-summary

```
Auth   : Public
Purpose: Get aggregated sentiment percentages for a business's reviews
```

Response `200`:

```typescript
interface SentimentSummaryResponse {
  positive:     number  // percentage 0-100, rounded
  neutral:      number
  negative:     number
  totalReviews: number  // approved reviews with sentiment computed (sentiment IS NOT NULL)
}
```

Notes:

```
- Computed over reviews WHERE status='approved' AND deletedAt IS NULL
  AND sentiment IS NOT NULL
- If totalReviews = 0, all percentages return 0 (no divide-by-zero error)
- Percentages are independently rounded and may not sum to exactly 100
- No BUSINESS_NOT_FOUND check — mirrors GET /businesses/:businessId/review-statistics
  (returns zeros when there is no matching data)
```

---

## GET /businesses/:businessId/criteria-scores

```
Auth   : Public
Purpose: Get average per-criterion rating for a business ("Performance Benchmarks")
```

Response `200`:

```typescript
interface CriteriaScoreItem {
  criterionId:   number
  criterionName: string
  avgRating:     number  // average ratingValue (1-5 scale, same scale as reviews), 0 if unrated
  reviewCount:   number  // number of criteriaRatings contributing to this average
}

interface CriteriaScoresResponse {
  criteria: CriteriaScoreItem[]
}
```

Notes:

```
- criteria = every criterion belonging to the business's categories (via
  category_criteria), one row per criterion — matches the same criteria set
  used when creating a review for this business (see WF-REV-001)
- avgRating/reviewCount computed over review_criteria WHERE the parent review
  has status='approved' AND deletedAt IS NULL
- Criteria with no ratings yet are still included, with avgRating=0,
  reviewCount=0 (mirrors ratingDistribution always showing all 5 buckets)
- Presented on the existing 1-5 rating scale — NOT a fabricated 0-10
  "benchmark" score
- No BUSINESS_NOT_FOUND check, same precedent as review-statistics/sentiment-summary
```

---

# Chapter 7. Reply APIs

Base: `/reviews/:reviewId/reply` and `/replies`

---

## POST /reviews/:reviewId/reply

```
Auth   : BusinessOwner+ (must own the business being reviewed)
Purpose: Create a reply to a review (one reply per review)
```

Request:

```typescript
interface CreateReplyDto {
  content: string  // min 1 char
}
```

Validation:

```
- Current user must be BUSINESS_OWNER
- The review must belong to a business owned by current user
- Review must not already have a reply
```

Response `201`:

```typescript
interface CreateReplyResponse {
  replyId: number
}
```

Errors:

```
REVIEW_NOT_FOUND     404
FORBIDDEN            403
REPLY_ALREADY_EXISTS 409
```

---

## GET /reviews/:reviewId/reply

```
Auth   : Public
Purpose: Get the reply for a review
```

Response `200`:

```typescript
interface ReplyResponse {
  replyId:   number
  content:   string
  author: {
    userId: number
    name:   string
  }
  createdAt: string
  updatedAt: string
}
```

Errors:

```
REVIEW_NOT_FOUND  404
REPLY_NOT_FOUND   404
```

---

## PATCH /replies/:replyId

```
Auth   : BusinessOwner+ (must own the reply)
Purpose: Update reply content
```

Request:

```typescript
interface UpdateReplyDto {
  content: string
}
```

Response `200`:

```typescript
interface UpdateReplyResponse {
  replyId: number
}
```

Errors:

```
REPLY_NOT_FOUND  404
FORBIDDEN        403
```

---

## DELETE /replies/:replyId

```
Auth   : BusinessOwner+ (must own the reply), Admin
Purpose: Delete a reply
```

Response `204`: No content

Errors:

```
REPLY_NOT_FOUND  404
FORBIDDEN        403
```

---

# Chapter 8. Report APIs

Base: `/reports`

---

## GET /reports/reasons

```
Auth   : User+
Purpose: List available report reasons
```

Notes:

```
IMPORTANT: Register this route BEFORE /reports/:reportId in NestJS
```

Response `200`:

```typescript
interface ReasonListItem {
  reasonId:    number
  name:        string
  description: string | null
}
```

---

## POST /reports

```
Auth   : User+
Purpose: Report a review (one report per user per review)
```

Request:

```typescript
interface CreateReportDto {
  reviewId:    number
  reasonId:    number
  description: string?  // optional additional context
}
```

Response `201`:

```typescript
interface CreateReportResponse {
  reportId: number
  status:   'pending'
}
```

Errors:

```
REVIEW_NOT_FOUND      404
REASON_NOT_FOUND      404
REPORT_ALREADY_EXISTS 409
```

---

## GET /reports/my

```
Auth   : User+
Purpose: Get all reports created by current user
```

Response `200` (paginated):

```typescript
interface MyReportListItem {
  reportId: number
  status:   'pending' | 'reviewing' | 'resolved' | 'rejected'
  reason: {
    reasonId: number
    name:     string
  }
  review: {
    reviewId: number
    content:  string
  }
  createdAt: string
}
```

---

## GET /reports/:reportId

```
Auth   : User+ (must own report), Admin
Purpose: Get report detail
```

Response `200`:

```typescript
interface ReportDetailResponse {
  reportId:    number
  description: string | null
  status:      'pending' | 'reviewing' | 'resolved' | 'rejected'
  reason: {
    reasonId: number
    name:     string
  }
  review: {
    reviewId: number
    content:  string
  }
  createdAt: string
}
```

Errors:

```
REPORT_NOT_FOUND  404
FORBIDDEN         403
```

---

## DELETE /reports/:reportId

```
Auth     : User+ (must own report)
Purpose  : Withdraw a pending report
Allowed  : Only when status = 'pending'
Behavior : Hard delete (report withdrawn)
```

Response `204`: No content

Errors:

```
REPORT_NOT_FOUND          404
FORBIDDEN                 403
REPORT_NOT_WITHDRAWABLE   400  // status is not 'pending'
```

---

# Chapter 9. Business Claim APIs

Base: `/business-claims`

---

## POST /business-claims

```
Auth   : User+
Purpose: Submit a claim of ownership on an unclaimed, approved business
```

Request:

```typescript
interface SubmitClaimDto {
  businessId: number
  message:    string  // min 20 chars, max 1000 chars
}
```

Response `201`:

```typescript
interface SubmitClaimResponse {
  claimId: number
  status:  'pending'
}
```

Errors:

```
BUSINESS_NOT_FOUND        404
BUSINESS_NOT_APPROVED     400
BUSINESS_ALREADY_CLAIMED  409
CLAIM_ALREADY_PENDING     409
VALIDATION_ERROR          400
```

---

## GET /business-claims/my

```
Auth   : User+
Purpose: Get all claims submitted by current user
```

Notes:

```
IMPORTANT: Register this route BEFORE /business-claims/:claimId in NestJS
```

Response `200` (paginated):

```typescript
interface MyClaimListItem {
  claimId:      number
  businessId:   number
  businessName: string
  status:       'pending' | 'approved' | 'rejected'
  message:      string
  createdAt:    string
}
```

---

## DELETE /business-claims/:claimId

```
Auth     : User+ (must own claim)
Purpose  : Withdraw a pending claim
Allowed  : Only when status = 'pending'
Behavior : Hard delete (claim withdrawn)
```

Response `204`: No content

Errors:

```
BUSINESS_CLAIM_NOT_FOUND  404
FORBIDDEN                 403
CLAIM_NOT_PENDING         400
```

---

# Chapter 10. Ranking APIs

Base: `/rankings`

Ranking eligibility (D-012): only businesses with at least one positive-weight
review appear in GLOBAL, CATEGORY or PROVINCE lists. With no snapshot,
`GET /rankings/businesses/:businessId` returns `data: null`.
`reviewCount` in ranking lists is the number of contributing reviews, excluding
fraud REJECTED (and any other zero-weight review); public business review counts
still count all moderation-approved reviews. `avgRating` remains the raw approved
star average. `rankingScore` is the separate [0,100] composite index.
Configuration changes take effect on the next recalculation, not immediately on
existing snapshots. Scores are sorted before rounding to two decimals.


---

## GET /rankings

```
Auth   : Public
Purpose: Get global ranking list (reads from snapshot + Redis cache)
```

Query params:

```typescript
interface RankingListQuery extends PaginationQuery {
  categoryId?: number
  province?:   string
  search?:     string
}
```

Response `200` (paginated):

```typescript
interface RankingListItem {
  rank:         number
  businessId:   number
  businessName: string
  avgRating:    number
  reviewCount:  number
  rankingScore: number
  trend: {
    period:      'DAY' | 'WEEK' | 'MONTH'  // current admin-configured lookback (see D-031)
    rankChange:  number  // positive = moved up (better), negative = moved down
    scoreChange: number  // current.rankingScore - baseline.rankingScore
  } | null  // always null when categoryId/province filters are applied, or when
            // no ranking_snapshot_history baseline exists yet (see D-031 amendment)
}
```

Notes:

```
- Data comes from ranking_snapshots table via Redis cache
- MUST NOT calculate rankings at request time
- trend is looked up fresh per request (one batched query for the returned page,
  see D-031 amendment) — this is a read against ranking_snapshot_history, not a
  ranking recalculation, so it does not violate the rule above
```

---

## GET /rankings/top

```
Auth   : Public
Purpose: Get top N businesses (shortcut endpoint for homepage widgets)
```

Notes:

```
IMPORTANT: Register this route BEFORE /rankings/:businessId in NestJS
```

Query params:

```typescript
interface TopRankingQuery {
  limit?:      number  // default 10, max 20
  categoryId?: number
  province?:   string
}
```

Response `200`:

```typescript
interface TopRankingItem {
  rank:         number
  businessId:   number
  businessName: string
  avgRating:    number
  rankingScore: number
}
```

---

## GET /rankings/metadata

```
Auth   : Public
Purpose: Get ranking engine metadata (last recalculation time, total ranked)
```

Notes:

```
IMPORTANT: Register this route BEFORE /rankings/:businessId in NestJS
```

Response `200`:

```typescript
interface RankingMetadataResponse {
  lastCalculatedAt:      string  // ISO-8601
  totalRankedBusinesses: number
}
```

---

## GET /rankings/businesses/:businessId

```
Auth   : Public
Purpose: Get ranking position of a specific business
```

Response `200`:

```typescript
interface BusinessRankingResponse {
  businessId:   number
  rank:         number | null  // null if not ranked yet
  rankingScore: number | null
  reviewCount:  number
  avgRating:    number
  lastCalculatedAt: string
  trend: {
    period:      'DAY' | 'WEEK' | 'MONTH'  // current admin-configured lookback (see D-031)
    rankChange:  number  // positive = moved up (better), negative = moved down
    scoreChange: number  // current.rankingScore - baseline.rankingScore
  } | null  // null if not enough ranking_snapshot_history yet to compute a baseline
}
```

Errors:

```
BUSINESS_NOT_FOUND  404
```

---

## GET /rankings/businesses/:businessId/competitors

```
Auth   : Public
Purpose: Suggest competing businesses in the same category, ranked close to this business
```

Notes:

```
- Category is auto-selected as the CATEGORY-scope ranking the business has its best
  (lowest/numerically smallest) rank in, unless overridden by ?categoryId=
- Competitors are other businesses in that category-scope sorted by
  abs(rank - businessRank) ascending
```

Query params:

```typescript
interface MarketCompetitorsQuery {
  categoryId?: number  // override auto-selected category
  limit?:      number  // default 5, max 20
}
```

Response `200`:

```typescript
interface CompetitorItem {
  businessId:   number
  businessName: string
  rank:         number
  rankingScore: number
  avgRating:    number
}

interface MarketCompetitorsResponse {
  categoryId:   number | null
  categoryName: string | null
  businessRank: number | null
  competitors:  CompetitorItem[]
  // categoryId/categoryName/businessRank are null and competitors=[] when the
  // business has no CATEGORY-scope ranking yet (e.g. newly approved, not yet
  // included in a ranking cron run)
}
```

Errors:

```
BUSINESS_NOT_FOUND  404
```

---

# Chapter 11. Notification APIs

Base: `/notifications`

---

## GET /notifications

```
Auth   : User+
Purpose: Get notifications for current user
```

Query params:

```typescript
interface NotificationListQuery extends PaginationQuery {
  isRead?: boolean
}
```

Response `200` (paginated):

```typescript
interface NotificationListItem {
  notificationId: number
  type:           string  // see REFERENCE.md NOTIFICATION_TYPE
  title:          string
  content:        string
  isRead:         boolean
  createdAt:      string
}
```

---

## GET /notifications/unread-count

```
Auth   : User+
Purpose: Get count of unread notifications
```

Notes:

```
IMPORTANT: Register this route BEFORE /notifications/:notificationId in NestJS
```

Response `200`:

```typescript
interface UnreadCountResponse {
  count: number
}
```

---

## GET /notifications/:notificationId

```
Auth   : User+ (must own notification)
Purpose: Get notification detail
```

Response `200`:

```typescript
interface NotificationDetailResponse {
  notificationId: number
  type:           string
  title:          string
  content:        string
  isRead:         boolean
  createdAt:      string
}
```

Errors:

```
NOTIFICATION_NOT_FOUND  404
FORBIDDEN               403
```

---

## PATCH /notifications/:notificationId/read

```
Auth   : User+ (must own notification)
Purpose: Mark a single notification as read
```

Response `200`:

```typescript
interface MarkReadResponse {
  notificationId: number
  isRead:         true
}
```

Errors:

```
NOTIFICATION_NOT_FOUND  404
FORBIDDEN               403
```

---

## PATCH /notifications/read-all

```
Auth   : User+
Purpose: Mark all notifications as read for current user
```

Notes:

```
IMPORTANT: Register this route BEFORE /notifications/:notificationId in NestJS
```

Response `200`:

```typescript
interface MarkAllReadResponse {
  updatedCount: number
}
```

---

## GET /notifications/stream

```
Auth         : User+
Purpose      : SSE stream for realtime notifications
Response-Type: text/event-stream
```

Notes:

```
IMPORTANT: Register this route BEFORE /notifications/:notificationId in NestJS
```

Authentication:

```
Authorization: Bearer <access_token>  (header)
```

SSE event types:

```
connection   → sent once on connect
heartbeat    → sent every 30 seconds
notification → sent when new notification created for user
```

Event payloads:

```typescript
// connection
{ event: 'connection', connected: true, timestamp: string }

// heartbeat
{ event: 'heartbeat', timestamp: string }

// notification
{
  event:          'notification'
  notificationId: number
  type:           string
  title:          string
  content:        string
}
```

Security:

```
- Extract userId from JWT only
- MUST NOT deliver another user's notifications
- On JWT expiry, close connection with 401
```

---

# Chapter 12. Admin APIs

Base: `/admin`

```
All endpoints in this chapter require: Admin role
```

---

## Business Moderation

### GET /admin/businesses

```
Purpose: List businesses of any status (moderation queue)
```

Query params:

```typescript
interface AdminBusinessListQuery extends PaginationQuery {
  status?: 'pending' | 'approved' | 'rejected' | 'hidden'  // default 'pending'
  search?: string  // name contains, case-insensitive
}
```

Response `200` (paginated):

```typescript
interface AdminBusinessListItem {
  businessId: number
  name:       string
  status:     'pending' | 'approved' | 'rejected' | 'hidden'
  ownerName:  string
  phone:      string
  createdAt:  string
  categories: Array<{ categoryId: number; categoryName: string }>
}
```

Notes:

```
- Unlike public GET /businesses, this returns businesses of ANY status
  (deletedAt IS NULL still applies — soft-deleted businesses never appear)
- Sorted by createdAt ascending (oldest pending request first)
```

---

### POST /admin/businesses

```
Purpose: Create a business directly with no owner (admin-added, immediately approved)
```

Request:

```typescript
interface CreateBusinessAsAdminDto {
  name:        string    // max 150 chars
  description: string?
  phone:       string    // max 20 chars, unique
  email:       string?   // valid email, unique
  categoryIds: number[]  // min 1 category (smallint IDs)
  locations: Array<{
    addressLine: string  // required
    ward:        string  // max 100 chars
    province:    string  // max 100 chars
  }>                     // min 1 location
}
```

Response `201`:

```typescript
interface CreateBusinessAsAdminResponse {
  businessId: number
  status:     'approved'
}
```

Notes:

```
- No ownerUserId field — never client-supplied. The created business has ownerUserId = null
  ("unclaimed") until a user successfully claims it — see Chapter 9. Business Claim APIs
- status is 'approved' and approvedByUserId is set immediately — no separate approval step
```

Errors:

```
VALIDATION_ERROR          400
CATEGORY_NOT_FOUND        404
PHONE_ALREADY_EXISTS      409
EMAIL_ALREADY_EXISTS      409
```

---

### POST /admin/businesses/:businessId/approve

```
Purpose: Approve a pending business
```

Request:

```typescript
interface ApproveBusinessDto {
  // no body required
}
```

Response `200`:

```typescript
interface ModerationResponse {
  businessId: number
  status:     'approved'
}
```

Side effects:

```
- Create BUSINESS_APPROVED notification for owner
- Push SSE event to owner
- Create audit log entry
```

Errors:

```
BUSINESS_NOT_FOUND        404
BUSINESS_NOT_PENDING      400
```

---

### POST /admin/businesses/:businessId/reject

```
Purpose: Reject a pending business
```

Request:

```typescript
interface RejectBusinessDto {
  reason: string  // required, min 10 chars
}
```

Response `200`:

```typescript
interface ModerationResponse {
  businessId: number
  status:     'rejected'
}
```

Side effects:

```
- Create BUSINESS_REJECTED notification for owner
- Push SSE event to owner
- Create audit log entry
```

Errors:

```
BUSINESS_NOT_FOUND    404
BUSINESS_NOT_PENDING  400
VALIDATION_ERROR      400
```

---

### POST /admin/businesses/:businessId/hide

```
Purpose: Hide an approved business from public
```

Request:

```typescript
interface HideBusinessDto {
  reason: string  // required
}
```

Response `200`:

```typescript
interface ModerationResponse {
  businessId: number
  status:     'hidden'
}
```

Errors:

```
BUSINESS_NOT_FOUND  404
```

---

## Review Moderation

### GET /admin/reviews

```
Purpose: List reviews of any status across ALL businesses (moderation queue)
```

Query params:

```typescript
interface AdminReviewListQuery extends PaginationQuery {
  status?: 'pending' | 'approved' | 'rejected' | 'hidden'  // default 'pending'
}
```

Response `200` (paginated):

```typescript
interface AdminReviewListItem {
  reviewId:      number
  overallRating: number
  content:       string
  status:        'pending' | 'approved' | 'rejected' | 'hidden'
  businessId:    number
  businessName:  string
  authorName:    string
  createdAt:     string
}
```

Notes:

```
- Unlike GET /businesses/:businessId/reviews (single-business, requires a
  businessId), this spans every business — the cross-business moderation queue
- deletedAt IS NULL applies — soft-deleted reviews never appear
- Sorted by createdAt ascending (oldest pending review first)
```

---

### POST /admin/reviews/:reviewId/approve

```
Purpose: Approve a pending review
```

Response `200`:

```typescript
interface ReviewModerationResponse {
  reviewId: number
  status:   'approved'
}
```

Side effects:

```
- Create REVIEW_APPROVED notification for author
- Push SSE event to author
- Create audit log entry
- Review becomes eligible for next ranking recalculation
```

Errors:

```
REVIEW_NOT_FOUND    404
REVIEW_NOT_PENDING  400
```

---

### POST /admin/reviews/:reviewId/reject

```
Purpose: Reject a pending review
```

Request:

```typescript
interface RejectReviewDto {
  reason: string  // required, min 10 chars
}
```

Response `200`:

```typescript
interface ReviewModerationResponse {
  reviewId: number
  status:   'rejected'
}
```

Side effects:

```
- Create REVIEW_REJECTED notification for author
- Push SSE event to author
- Create audit log entry
```

Errors:

```
REVIEW_NOT_FOUND    404
REVIEW_NOT_PENDING  400
VALIDATION_ERROR    400
```

---

### POST /admin/reviews/:reviewId/hide

```
Purpose: Hide an approved review
```

Request:

```typescript
interface HideReviewDto {
  reason: string  // required
}
```

Response `200`:

```typescript
interface ReviewModerationResponse {
  reviewId: number
  status:   'hidden'
}
```

Errors:

```
REVIEW_NOT_FOUND  404
```

---

## Report Management

### GET /admin/reports

```
Purpose: List all reports with filtering
```

Query params:

```typescript
interface AdminReportListQuery extends PaginationQuery {
  status?: 'pending' | 'reviewing' | 'resolved' | 'rejected'
}
```

Response `200` (paginated):

```typescript
interface AdminReportListItem {
  reportId: number
  status:   string
  reason: {
    reasonId: number
    name:     string
  }
  reporter: {
    userId: number
    name:   string
  }
  review: {
    reviewId: number
    content:  string
  }
  createdAt: string
}
```

---

### POST /admin/reports/:reportId/resolve

```
Purpose: Resolve a report
```

Request:

```typescript
interface ResolveReportDto {
  note: string?  // optional admin note
}
```

Response `200`:

```typescript
interface ResolveReportResponse {
  reportId: number
  status:   'resolved'
}
```

Side effects:

```
- Create REPORT_RESOLVED notification for reporter
- Push SSE event to reporter
- Create audit log entry
```

Errors:

```
REPORT_NOT_FOUND  404
```

---

### POST /admin/reports/:reportId/reject

```
Purpose: Reject a report (mark as invalid)
```

Response `200`:

```typescript
interface RejectReportResponse {
  reportId: number
  status:   'rejected'
}
```

Errors:

```
REPORT_NOT_FOUND  404
```

---

## Business Claim Management

### GET /admin/business-claims

```
Purpose: List business claims with filtering
```

Query params:

```typescript
interface AdminClaimListQuery extends PaginationQuery {
  status?: 'pending' | 'approved' | 'rejected'  // default 'pending'
}
```

Response `200` (paginated):

```typescript
interface AdminClaimListItem {
  claimId:      number
  businessId:   number
  businessName: string
  claimantName: string
  message:      string
  status:       'pending' | 'approved' | 'rejected'
  createdAt:    string
}
```

---

### POST /admin/business-claims/:claimId/approve

```
Purpose: Approve a pending business claim
```

Request:

```typescript
interface ApproveClaimDto {
  // no body required
}
```

Response `200`:

```typescript
interface ApproveClaimResponse {
  claimId: number
  status:  'approved'
}
```

Side effects:

```
- Set business.ownerUserId to the claimant
- Promote claimant's role to BUSINESS_OWNER
- Auto-reject all other pending claims on the same business
- Create CLAIM_APPROVED notification for the claimant
- Create CLAIM_REJECTED notification for each auto-rejected rival claimant
- Create audit log entry
- Push SSE event to each notified user (outside transaction, per D-017)
```

Errors:

```
BUSINESS_CLAIM_NOT_FOUND  404
CLAIM_NOT_PENDING         400
```

---

### POST /admin/business-claims/:claimId/reject

```
Purpose: Reject a pending business claim
```

Request:

```typescript
interface RejectClaimDto {
  reason: string  // required, min 10 chars
}
```

Response `200`:

```typescript
interface RejectClaimResponse {
  claimId: number
  status:  'rejected'
}
```

Side effects:

```
- Create CLAIM_REJECTED notification for the claimant
- Push SSE event to the claimant
- Create audit log entry
```

Errors:

```
BUSINESS_CLAIM_NOT_FOUND  404
CLAIM_NOT_PENDING         400
VALIDATION_ERROR          400
```

---

## User Management

### GET /admin/users

```
Purpose: List all users
```

Query params:

```typescript
interface AdminUserListQuery extends PaginationQuery {
  status?: 'active' | 'inactive' | 'banned'
  search?: string  // search by name or email
}
```

Response `200` (paginated):

```typescript
interface AdminUserListItem {
  userId:    number
  name:      string
  email:     string
  role:      string
  status:    string
  createdAt: string
}
```

---

### PATCH /admin/users/:userId/ban

```
Purpose: Ban a user account
```

Request:

```typescript
interface BanUserDto {
  reason: string  // required
}
```

Response `200`:

```typescript
interface BanUserResponse {
  userId: number
  status: 'banned'
}
```

Errors:

```
USER_NOT_FOUND        404
CANNOT_BAN_ADMIN      400
```

---

### PATCH /admin/users/:userId/unban

```
Purpose: Unban a user account
```

Response `200`:

```typescript
interface UnbanUserResponse {
  userId: number
  status: 'active'
}
```

Errors:

```
USER_NOT_FOUND    404
USER_NOT_BANNED   400
```

---

## Category & Criteria Management

### POST /admin/categories

```
Purpose: Create a new category
```

Request:

```typescript
interface CreateCategoryDto {
  categoryName: string  // max 100 chars, unique
}
```

Response `201`:

```typescript
interface CreateCategoryResponse {
  categoryId:   number
  categoryName: string
}
```

Errors:

```
CATEGORY_ALREADY_EXISTS  409
```

---

### POST /admin/criteria

```
Purpose: Create a new criterion
```

Request:

```typescript
interface CreateCriterionDto {
  name:         string   // max 100 chars, unique
  description?: string
}
```

Response `201`:

```typescript
interface CreateCriterionResponse {
  criterionId:  number
  name:         string
  description:  string | null
}
```

Errors:

```
CRITERION_ALREADY_EXISTS  409
```

---

### POST /admin/categories/:categoryId/criteria/:criterionId

```
Purpose: Assign a criterion to a category
```

Response `201`:

```typescript
interface AssignCriterionResponse {
  categoryId:  number
  criterionId: number
}
```

Errors:

```
CATEGORY_NOT_FOUND          404
CRITERION_NOT_FOUND         404
ASSIGNMENT_ALREADY_EXISTS   409
```

---

### DELETE /admin/categories/:categoryId/criteria/:criterionId

```
Purpose: Remove a criterion from a category
```

Response `204`: No content

Errors:

```
CATEGORY_NOT_FOUND   404
CRITERION_NOT_FOUND  404
ASSIGNMENT_NOT_FOUND 404
```

---

## Ranking Management

### POST /admin/rankings/recalculate

```
Purpose: Manually trigger ranking recalculation
```

Response `200`:

```typescript
interface RecalculateResponse {
  message:     string  // "Ranking recalculation started"
  triggeredAt: string  // ISO-8601
}
```

---

## Ranking Trend Config

### GET /admin/rankings/trend-config

```
Purpose: Get the current ranking trend lookback period
```

Response `200`:

```typescript
interface RankingTrendConfigResponse {
  period:    'DAY' | 'WEEK' | 'MONTH'
  updatedAt: string
}
```

---

### PATCH /admin/rankings/trend-config

```
Purpose: Change the ranking trend lookback period used by GET /rankings/businesses/:businessId
```

Request:

```typescript
interface UpdateRankingTrendConfigDto {
  period: 'DAY' | 'WEEK' | 'MONTH'
}
```

Response `200`:

```typescript
interface RankingTrendConfigResponse {
  period:    'DAY' | 'WEEK' | 'MONTH'
  updatedAt: string
}
```

Errors:

```
VALIDATION_ERROR  400  // period not one of DAY|WEEK|MONTH
```

---

## Audit Log

### GET /admin/logs

```
Purpose: Query audit logs
```

Query params:

```typescript
interface AdminLogListQuery extends PaginationQuery {
  action?:     string
  entityType?: string
  userId?:     number
}
```

Response `200` (paginated):

```typescript
interface AdminLogListItem {
  logId:      number
  action:     string
  entityType: string
  entityId:   number | null
  actor: {
    userId: number
    name:   string
  } | null
  createdAt: string
}
```

---

# Chapter 13. Bookmark APIs

Base: `/businesses/:businessId/bookmark` and `/bookmarks`

---

## POST /businesses/:businessId/bookmark

```
Auth   : User+
Purpose: Bookmark a business
```

Response `201`:

```typescript
interface CreateBookmarkResponse {
  bookmarkId: number
  businessId: number
}
```

Errors:

```
BUSINESS_NOT_FOUND        404
BOOKMARK_ALREADY_EXISTS   409
```

---

## DELETE /businesses/:businessId/bookmark

```
Auth   : User+
Purpose: Remove a bookmark
```

Response `204`: No content

Errors:

```
BOOKMARK_NOT_FOUND  404
```

---

## GET /businesses/:businessId/bookmark

```
Auth   : User+
Purpose: Check whether the current user has bookmarked this business
```

Response `200`:

```typescript
interface BookmarkStatusResponse {
  isBookmarked: boolean
}
```

---

## GET /bookmarks/my

```
Auth   : User+
Purpose: List businesses the current user has bookmarked
```

Response `200` (paginated):

```typescript
interface BookmarkListItem {
  bookmarkId: number
  business: {
    businessId: number
    name:       string
    avgRating:  number
    status:     'pending' | 'approved' | 'rejected' | 'hidden'
  }
  createdAt: string
}
```

---

## Route Registration Order (Critical for NestJS)

Register routes in this exact order to prevent param conflicts:

```
Auth:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/google
  POST   /auth/refresh
  POST   /auth/logout
  GET    /auth/me

Users:
  GET    /users/profile
  PATCH  /users/profile
  PATCH  /users/change-password
  POST   /users/avatar

Businesses:
  POST   /businesses
  GET    /businesses
  GET    /businesses/my          ← BEFORE /:businessId
  GET    /businesses/:businessId
  PATCH  /businesses/:businessId
  DELETE /businesses/:businessId
  GET    /businesses/:businessId/statistics
  GET    /businesses/:businessId/review-trend
  POST   /businesses/:businessId/locations
  PATCH  /businesses/:businessId/locations/:locationId
  DELETE /businesses/:businessId/locations/:locationId
  GET    /businesses/:businessId/reviews
  GET    /businesses/:businessId/review-statistics
  GET    /businesses/:businessId/sentiment-summary
  GET    /businesses/:businessId/criteria-scores
  POST   /businesses/:businessId/bookmark
  DELETE /businesses/:businessId/bookmark
  GET    /businesses/:businessId/bookmark

Reviews:
  POST   /reviews
  GET    /reviews/my             ← BEFORE /:reviewId
  GET    /reviews/:reviewId
  PATCH  /reviews/:reviewId
  DELETE /reviews/:reviewId
  POST   /reviews/:reviewId/analyze-sentiment
  POST   /reviews/:reviewId/reply
  GET    /reviews/:reviewId/reply

Replies:
  PATCH  /replies/:replyId
  DELETE /replies/:replyId

Reports:
  GET    /reports/reasons        ← BEFORE /:reportId
  POST   /reports
  GET    /reports/my             ← BEFORE /:reportId
  GET    /reports/:reportId
  DELETE /reports/:reportId

Rankings:
  GET    /rankings
  GET    /rankings/top           ← BEFORE /businesses/:businessId
  GET    /rankings/metadata      ← BEFORE /businesses/:businessId
  GET    /rankings/businesses/:businessId
  GET    /rankings/businesses/:businessId/competitors

Bookmarks:
  GET    /bookmarks/my

Notifications:
  GET    /notifications/unread-count  ← BEFORE /:notificationId
  GET    /notifications/read-all      ← BEFORE /:notificationId
  GET    /notifications/stream        ← BEFORE /:notificationId
  GET    /notifications
  GET    /notifications/:notificationId
  PATCH  /notifications/:notificationId/read
  PATCH  /notifications/read-all      ← BEFORE /:notificationId
```

---

End of API.md — v1.0
