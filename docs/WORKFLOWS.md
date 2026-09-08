# WORKFLOWS.md

# Enterprise Evaluation & Ranking System (EERS)

Version: 1.0
Status: Locked
Priority: 4th (see DECISIONS.md D-027)

---

## How to use this document

This document defines the business logic for every use case.

Rules for AI agents:

```
- Each workflow = one UseCase class
- Follow steps in exact order listed
- Do NOT skip steps
- Side effects (notifications, audit logs, cache) are mandatory, not optional
- Transactions wrap ALL multi-table writes
- When a precondition fails, throw the domain exception listed
- Do NOT add steps not listed here
```

---

## Transaction Rule

Any workflow touching more than one table MUST use a transaction:

```typescript
await this.prisma.$transaction(async (tx) => {
  // all steps here
})
```

Side effects that happen AFTER the transaction (SSE push, cache invalidation)
are called OUTSIDE the transaction block.

---

# Section 1. Auth Workflows

---

## WF-AUTH-001 — Register

**UseCase:** `RegisterUseCase`
**Trigger:** `POST /auth/register`

Preconditions:

```
- email is not already taken (users table, deletedAt IS NULL)
```

Steps:

```
1. Validate DTO (name, email, password)
2. Check email uniqueness → throw EMAIL_ALREADY_EXISTS if taken
3. Hash password with bcrypt (rounds=12)
4. Load role record WHERE roleName = 'USER'
5. Create user record:
     name, email, password=hash, roleId, status='active'
6. Return { userId, name, email, role: 'USER' }
```

Transaction: wraps step 5 only (single table write).

Side effects: none.

---

## WF-AUTH-002 — Login

**UseCase:** `LoginUseCase`
**Trigger:** `POST /auth/login`

Preconditions:

```
- User with email exists (deletedAt IS NULL)
- User is not banned (status != 'banned')
```

Steps:

```
1. Find user by email WHERE deletedAt IS NULL
2. If not found → throw INVALID_CREDENTIALS (do NOT reveal which field is wrong)
3. Compare password with bcrypt.compare()
4. If mismatch → throw INVALID_CREDENTIALS
5. If user.status = 'banned' → throw USER_BANNED
6. Generate accessToken (JWT, sub=userId, role=roleName, exp=15min)
7. Generate refreshToken (JWT, sub=userId, exp=7days)
8. Persist refreshToken to refresh_tokens table:
     userId, token=hash(refreshToken), expiresAt=now()+7days
9. Return { accessToken, expiresIn: 900, user }
   Set-Cookie: refreshToken (HttpOnly, see API.md)
```

Transaction: wraps step 8 only.

Side effects:

```
- Audit log: action='LOGIN_SUCCESS', entityType='User', entityId=userId
```

---

## WF-AUTH-003 — Google OAuth

**UseCase:** `GoogleAuthUseCase`
**Trigger:** `POST /auth/google`

Steps:

```
1. Verify idToken with Google OAuth2 client library
2. If verification fails → throw INVALID_GOOGLE_TOKEN
3. Extract { email, name, picture } from Google payload
4. Find user by email WHERE deletedAt IS NULL
5a. If user exists AND status = 'banned' → throw USER_BANNED
5b. If user exists → proceed to step 7
6.  If user not exists → create new user:
      name=googleName, email, password=randomSecureString (unusable),
      roleId=USER, status='active'
7. Generate accessToken + refreshToken (same as WF-AUTH-002 steps 6-8)
8. Return { accessToken, expiresIn: 900, user }
   Set-Cookie: refreshToken
```

Transaction: wraps step 6 (if new user created).

---

## WF-AUTH-004 — Refresh Token

**UseCase:** `RefreshTokenUseCase`
**Trigger:** `POST /auth/refresh`

Steps:

```
1. Read refreshToken from HttpOnly Cookie
2. If missing → throw INVALID_REFRESH_TOKEN
3. Verify JWT signature
4. If invalid → throw INVALID_REFRESH_TOKEN
5. If expired → throw TOKEN_EXPIRED
6. Find token record WHERE token=hash(refreshToken)
   AND expiresAt > now() AND revokedAt IS NULL
7. If not found → throw INVALID_REFRESH_TOKEN
8. Load user WHERE userId=sub AND deletedAt IS NULL
9. If user.status = 'banned' → throw USER_BANNED
10. Generate new accessToken (JWT, 15min)
11. Return { accessToken, expiresIn: 900 }
```

Transaction: none (read-only).

---

## WF-AUTH-005 — Logout

**UseCase:** `LogoutUseCase`
**Trigger:** `POST /auth/logout`

Steps:

```
1. Read refreshToken from HttpOnly Cookie
2. If present → set revokedAt=now() on refresh_tokens record
3. Clear Set-Cookie: refreshToken
4. Return { message: 'Logged out successfully' }
```

Transaction: wraps step 2 only.

Note: Step 2 is best-effort. If token not found, still return success.

---

# Section 2. User Workflows

---

## WF-USER-001 — Update Profile

**UseCase:** `UpdateProfileUseCase`
**Trigger:** `PATCH /users/profile`

Steps:

```
1. Load current user by userId from JWT
2. Update name field
3. Return { userId, name }
```

Transaction: single table write, no explicit transaction needed.

---

## WF-USER-002 — Change Password

**UseCase:** `ChangePasswordUseCase`
**Trigger:** `PATCH /users/change-password`

Steps:

```
1. Load current user by userId from JWT
2. Compare currentPassword with stored hash via bcrypt.compare()
3. If mismatch → throw INVALID_PASSWORD
4. Hash newPassword with bcrypt (rounds=12)
5. Update user.password = newHash
6. Revoke all existing refresh tokens for this user:
     UPDATE refresh_tokens SET revokedAt=now()
     WHERE userId=userId AND revokedAt IS NULL
```

Transaction: wraps steps 5-6.

Side effects:

```
- Audit log: action='PASSWORD_CHANGED', entityType='User', entityId=userId
```

---

## WF-USER-003 — Upload Avatar

**UseCase:** `UploadAvatarUseCase`
**Trigger:** `POST /users/avatar`

Steps:

```
1. Validate file type (jpg/jpeg/png/webp) and size (max 10MB)
2. If existing avatar (imageType='AVATAR') → delete old image from Cloudinary using publicId
   AND delete old images record WHERE userId=currentUserId AND imageType='AVATAR'
3. Upload new file to Cloudinary
4. Create images record:
     userId=currentUserId, reviewId=NULL, businessId=NULL,
     imageType='AVATAR',
     cloudinaryPublicId, secureUrl, width, height, format
5. Return { avatarUrl: secureUrl }
```

Transaction: wraps step 4 only (Cloudinary upload is outside transaction).

---

# Section 3. Business Workflows

---

## WF-BUS-001 — Create Business

**UseCase:** `CreateBusinessUseCase`
**Trigger:** `POST /businesses`

Preconditions:

```
- phone is unique across businesses (deletedAt IS NULL)
- email is unique across businesses if provided (deletedAt IS NULL)
- all categoryIds exist in categories table
- at least 1 location provided
- at least 1 categoryId provided
```

Steps:

```
1. Validate all categoryIds exist → throw CATEGORY_NOT_FOUND if any missing
2. Check phone uniqueness → throw PHONE_ALREADY_EXISTS if taken
3. Check email uniqueness if provided → throw EMAIL_ALREADY_EXISTS if taken
4. BEGIN TRANSACTION:
   a. Create business record:
        name, description, phone, email,
        ownerUserId=currentUserId, status='pending', avgRating=0
   b. Create location records for each location in request
   c. Create business_locations join records
   d. Create business_categories join records for each categoryId
5. Return { businessId, status: 'pending' }
```

Transaction: wraps step 4a-4d.

Side effects: none (admin will be notified via admin dashboard, no push needed).

---

## WF-BUS-002 — Update Business

**UseCase:** `UpdateBusinessUseCase`
**Trigger:** `PATCH /businesses/:businessId`

Preconditions:

```
- Business exists (deletedAt IS NULL)
- Current user is owner OR admin
```

Steps:

```
1. Load business by businessId WHERE deletedAt IS NULL
2. If not found → throw BUSINESS_NOT_FOUND
3. If currentUser.role != 'ADMIN' AND business.ownerUserId != currentUserId
   → throw FORBIDDEN
4. If phone provided → check uniqueness (excluding this business)
   → throw PHONE_ALREADY_EXISTS if taken
5. If email provided → check uniqueness (excluding this business)
   → throw EMAIL_ALREADY_EXISTS if taken
6. Update fields provided (partial update)
7. Return { businessId }
```

Transaction: wraps step 6 only.

---

## WF-BUS-003 — Delete Business

**UseCase:** `DeleteBusinessUseCase`
**Trigger:** `DELETE /businesses/:businessId`

Preconditions:

```
- Business exists (deletedAt IS NULL)
- Current user is owner OR admin
```

Steps:

```
1. Load business WHERE deletedAt IS NULL
2. If not found → throw BUSINESS_NOT_FOUND
3. If currentUser.role != 'ADMIN' AND business.ownerUserId != currentUserId
   → throw FORBIDDEN
4. Set business.deletedAt = now()
```

Transaction: wraps step 4 only.

Side effects:

```
- Audit log: action='BUSINESS_DELETED', entityType='Business', entityId=businessId
```

---

## WF-BUS-004 — Add Location

**UseCase:** `AddLocationUseCase`
**Trigger:** `POST /businesses/:businessId/locations`

Preconditions:

```
- Business exists (deletedAt IS NULL)
- Current user is owner OR admin
```

Steps:

```
1. Load business WHERE deletedAt IS NULL
2. If not found → throw BUSINESS_NOT_FOUND
3. Check ownership → throw FORBIDDEN if not owner or admin
4. BEGIN TRANSACTION:
   a. Create location record
   b. Create business_locations join record
5. Return { locationId }
```

---

## WF-BUS-005 — Remove Location

**UseCase:** `RemoveLocationUseCase`
**Trigger:** `DELETE /businesses/:businessId/locations/:locationId`

Preconditions:

```
- Business exists and user has access
- Location exists and belongs to this business
- Business has more than 1 location
```

Steps:

```
1. Load business WHERE deletedAt IS NULL → throw BUSINESS_NOT_FOUND
2. Check ownership → throw FORBIDDEN
3. Count current locations for this business
4. If count = 1 → throw LAST_LOCATION_ERROR
5. Load business_locations WHERE businessId AND locationId
   → throw LOCATION_NOT_FOUND if missing
6. BEGIN TRANSACTION:
   a. Delete business_locations record
   b. Delete location record
```

---

## WF-BUS-006 — Admin Create Business

**UseCase:** `CreateBusinessAsAdminUseCase`
**Trigger:** `POST /admin/businesses`

Preconditions:

```
- Current user is admin
- phone is unique across businesses (deletedAt IS NULL)
- email is unique across businesses if provided (deletedAt IS NULL)
- all categoryIds exist in categories table
- at least 1 location provided
- at least 1 categoryId provided
```

Steps:

```
1. Validate all categoryIds exist → throw CATEGORY_NOT_FOUND if any missing
2. Check phone uniqueness → throw PHONE_ALREADY_EXISTS if taken
3. Check email uniqueness if provided → throw EMAIL_ALREADY_EXISTS if taken
4. BEGIN TRANSACTION:
   a. Create business record:
        name, description, phone, email,
        ownerUserId=null, status='approved', approvedByUserId=currentUserId, avgRating=0
   b. Create location records for each location in request
   c. Create business_locations join records
   d. Create business_categories join records for each categoryId
5. Return { businessId, status: 'approved' }
```

Transaction: wraps step 4a-4d.

Side effects: none (business is immediately public and unclaimed — no owner to notify).

---

## WF-BUS-007 — Upload Business Cover

**UseCase:** `UploadCoverUseCase`
**Trigger:** `POST /businesses/:businessId/cover`

Steps:

```
1. Validate file type (jpg/jpeg/png/webp) and size (max 10MB)
2. Verify business exists (deletedAt IS NULL) and user is owner or admin
   → throw BUSINESS_NOT_FOUND / FORBIDDEN
3. If existing cover (imageType='BUSINESS_COVER') → delete old image from Cloudinary
   using publicId AND delete old images record
4. Upload new file to Cloudinary
5. Create images record:
     businessId=currentBusinessId, userId=NULL, reviewId=NULL,
     imageType='BUSINESS_COVER',
     cloudinaryPublicId, secureUrl, width, height, format
6. Return { coverUrl: secureUrl }
```

Transaction: wraps step 5 only (Cloudinary upload is outside transaction).

---

## WF-BUS-008 — Upload Business Gallery Images

**UseCase:** `UploadGalleryUseCase`
**Trigger:** `POST /businesses/:businessId/gallery`

Steps:

```
1. Validate each file (type + size), max 5 files per request
2. Verify business exists (deletedAt IS NULL) and user is owner or admin
   → throw BUSINESS_NOT_FOUND / FORBIDDEN
3. Count existing gallery images (imageType='BUSINESS_GALLERY') for this business
4. If existing + new > 20 → throw GALLERY_LIMIT_EXCEEDED
5. Upload each file to Cloudinary
6. Create images records with:
     businessId=currentBusinessId, imageType='BUSINESS_GALLERY',
     displayOrder = max(existing displayOrder) + 1, +2, +3...
7. Return array of created images
```

---

## WF-BUS-009 — Reorder Business Gallery

**UseCase:** `ReorderGalleryUseCase`
**Trigger:** `PATCH /businesses/:businessId/gallery/reorder`

Steps:

```
1. Verify business exists (deletedAt IS NULL) and user is owner or admin
   → throw BUSINESS_NOT_FOUND / FORBIDDEN
2. Verify all imageIds belong to this business with imageType='BUSINESS_GALLERY'
   → throw IMAGE_NOT_FOUND if any do not
3. Update displayOrder for each image based on array index (1-based)
4. Return { message: 'Gallery reordered successfully' }
```

---

## WF-BUS-010 — Upload Business Logo

**UseCase:** `UploadLogoUseCase`
**Trigger:** `POST /businesses/:businessId/logo`

Steps:

```
1. Validate file type (jpg/jpeg/png/webp) and size (max 10MB)
2. Verify business exists (deletedAt IS NULL) and user is owner or admin
   → throw BUSINESS_NOT_FOUND / FORBIDDEN
3. If existing logo (imageType='BUSINESS_LOGO') → delete old image from Cloudinary
   using publicId AND delete old images record
4. Upload new file to Cloudinary
5. Create images record:
     businessId=currentBusinessId, userId=NULL, reviewId=NULL,
     imageType='BUSINESS_LOGO',
     cloudinaryPublicId, secureUrl, width, height, format
6. Return { logoUrl: secureUrl }
```

Transaction: wraps step 5 only (Cloudinary upload is outside transaction).

---

# Section 4. Review Workflows

---

## WF-REV-001 — Create Review

**UseCase:** `CreateReviewUseCase`
**Trigger:** `POST /reviews`

Preconditions:

```
- Business exists (deletedAt IS NULL) AND status = 'approved'
- Current user has NOT reviewed this business before
- overallRating is integer 1-5
- all criterionIds exist AND belong to business's categories
- criteriaRatings values are integer 1-5
```

Steps:

```
1. Load business by businessId WHERE deletedAt IS NULL
2. If not found → throw BUSINESS_NOT_FOUND
3. If business.status != 'approved' → throw BUSINESS_NOT_APPROVED
4. Check UNIQUE(writerUserId, businessId) in reviews (deletedAt IS NULL)
   → throw REVIEW_ALREADY_EXISTS if exists
5. Validate overallRating 1-5 → throw INVALID_RATING
6. Load criteria for this business via category_criteria join
7. Validate each criterionId in criteriaRatings belongs to business criteria
   → throw INVALID_CRITERION if any invalid
8. Validate each ratingValue 1-5 → throw INVALID_RATING
9. BEGIN TRANSACTION:
   a. Create review record:
        writerUserId=currentUserId, businessId,
        overallRating, content, status='pending',
        sentiment=NULL
   b. Create review_criteria records for each criteriaRating entry
10. Return { reviewId, status: 'pending' }
```

Transaction: wraps step 9a-9b.

Side effects: create `NEW_REVIEW` notification for `business.ownerUserId` (see
WF-NOTI-001), sent after the transaction commits. Notifications for the review's
own approval/rejection are still triggered later, at admin decision time.

---

## WF-REV-002 — Update Review

**UseCase:** `UpdateReviewUseCase`
**Trigger:** `PATCH /reviews/:reviewId`

Preconditions:

```
- Review exists (deletedAt IS NULL)
- Current user is review author OR admin
```

Steps:

```
1. Load review WHERE deletedAt IS NULL
2. If not found → throw REVIEW_NOT_FOUND
3. If currentUser.role != 'ADMIN' AND review.writerUserId != currentUserId
   → throw FORBIDDEN
4. If overallRating provided → validate 1-5 → throw INVALID_RATING
5. If criteriaRatings provided:
   a. Validate each criterionId belongs to business criteria
      → throw INVALID_CRITERION
   b. Validate each ratingValue 1-5 → throw INVALID_RATING
6. BEGIN TRANSACTION:
   a. Update review: overallRating?, content?, status='pending'
   b. If criteriaRatings provided:
      - Delete existing review_criteria for this reviewId
      - Insert new review_criteria records
7. Return { reviewId, status: 'pending' }
```

Transaction: wraps step 6a-6b.

Note: status ALWAYS resets to 'pending' after any edit, regardless of who edits.

---

## WF-REV-003 — Delete Review

**UseCase:** `DeleteReviewUseCase`
**Trigger:** `DELETE /reviews/:reviewId`

Preconditions:

```
- Review exists (deletedAt IS NULL)
- Current user is review author OR admin
```

Steps:

```
1. Load review WHERE deletedAt IS NULL
2. If not found → throw REVIEW_NOT_FOUND
3. Check ownership → throw FORBIDDEN
4. Set review.deletedAt = now()
```

Side effects:

```
- Audit log: action='REVIEW_DELETED', entityType='Review', entityId=reviewId
```

---

## WF-REV-004 — Upload Review Photos

**UseCase:** `UploadReviewPhotosUseCase`
**Trigger:** `POST /reviews/:reviewId/photos`

Preconditions:

```
- Review exists (deletedAt IS NULL)
- Current user is review author OR admin
```

Steps:

```
1. Load review WHERE deletedAt IS NULL → throw REVIEW_NOT_FOUND
2. Check ownership → throw FORBIDDEN
3. Validate each file (type + size), max 5 files per request
4. Count existing photos (imageType='REVIEW_PHOTO') for this review
5. If existing + new > 5 → throw PHOTO_LIMIT_EXCEEDED
6. Upload each file to Cloudinary
7. Create images records: reviewId=currentReviewId, imageType='REVIEW_PHOTO'
8. Return array of created photos
```

---

## WF-REV-005 — Delete Review Photo

**UseCase:** `DeleteReviewPhotoUseCase`
**Trigger:** `DELETE /reviews/:reviewId/photos/:imageId`

Preconditions:

```
- Review exists (deletedAt IS NULL)
- Current user is review author OR admin
```

Steps:

```
1. Load review WHERE deletedAt IS NULL → throw REVIEW_NOT_FOUND
2. Check ownership → throw FORBIDDEN
3. Find image record WHERE imageId AND reviewId AND imageType='REVIEW_PHOTO'
   → throw IMAGE_NOT_FOUND if missing
4. Delete from Cloudinary
5. Delete record from DB
```

---

# Section 5. Reply Workflows

---

## WF-REPLY-001 — Create Reply

**UseCase:** `CreateReplyUseCase`
**Trigger:** `POST /reviews/:reviewId/reply`

Preconditions:

```
- Review exists (deletedAt IS NULL)
- Current user role = BUSINESS_OWNER
- The review's business is owned by current user
- No existing reply for this review (UNIQUE constraint)
```

Steps:

```
1. Load review WHERE deletedAt IS NULL
2. If not found → throw REVIEW_NOT_FOUND
3. Load business by review.businessId
4. If business.ownerUserId != currentUserId → throw FORBIDDEN
5. Check if reply already exists for this reviewId
   → throw REPLY_ALREADY_EXISTS if exists
6. Create reply record:
     reviewId, userId=currentUserId, content
7. Return { replyId }
```

Transaction: wraps step 6 only.

Side effects: create `NEW_REPLY` notification for `review.writerUserId` (see
WF-NOTI-001), sent after the transaction commits.

---

## WF-REPLY-002 — Update Reply

**UseCase:** `UpdateReplyUseCase`
**Trigger:** `PATCH /replies/:replyId`

Steps:

```
1. Load reply by replyId
2. If not found → throw REPLY_NOT_FOUND
3. If reply.userId != currentUserId → throw FORBIDDEN
4. Update reply.content
5. Return { replyId }
```

---

## WF-REPLY-003 — Delete Reply

**UseCase:** `DeleteReplyUseCase`
**Trigger:** `DELETE /replies/:replyId`

Steps:

```
1. Load reply by replyId
2. If not found → throw REPLY_NOT_FOUND
3. If currentUser.role != 'ADMIN' AND reply.userId != currentUserId
   → throw FORBIDDEN
4. Delete reply record (hard delete — replies have no soft delete)
```

---

# Section 6. Business Claim Workflows

---

## WF-CLAIM-001 — Submit Claim

**UseCase:** `SubmitClaimUseCase`
**Trigger:** `POST /business-claims`

Preconditions:

```
- Business exists (deletedAt IS NULL)
- Business status = 'approved'
- Business.ownerUserId IS NULL (unclaimed)
- Current user has NO existing pending claim for this business
```

Steps:

```
1. Load business WHERE deletedAt IS NULL
2. If not found → throw BUSINESS_NOT_FOUND
3. If business.status != 'approved' → throw BUSINESS_NOT_APPROVED
4. If business.ownerUserId IS NOT NULL → throw BUSINESS_ALREADY_CLAIMED
5. Check for existing pending claim by currentUserId for this businessId
   → throw CLAIM_ALREADY_PENDING if exists
6. Create business_claims record:
     businessId, userId=currentUserId, message, status='pending'
7. Return { claimId, status: 'pending' }
```

Transaction: wraps step 6 only.

Side effects: create `CLAIM_SUBMITTED` notification for every user with the ADMIN
role (see WF-NOTI-001), sent after the transaction commits.

---

## WF-CLAIM-002 — Withdraw Claim

**UseCase:** `WithdrawClaimUseCase`
**Trigger:** `DELETE /business-claims/:claimId`

Steps:

```
1. Load claim by claimId
2. If not found → throw BUSINESS_CLAIM_NOT_FOUND
3. If claim.userId != currentUserId → throw FORBIDDEN
4. If claim.status != 'pending' → throw CLAIM_NOT_PENDING
5. Delete business_claims record (hard delete)
```

---

# Section 7. Report Workflows

---

## WF-RPT-001 — Create Report

**UseCase:** `CreateReportUseCase`
**Trigger:** `POST /reports`

Preconditions:

```
- Review exists (deletedAt IS NULL)
- Reason exists
- Current user has NOT reported this review before
```

Steps:

```
1. Load review WHERE deletedAt IS NULL
2. If not found → throw REVIEW_NOT_FOUND
3. Load reason by reasonId → throw REASON_NOT_FOUND if missing
4. Check UNIQUE(userId, reviewId) in reports
   → throw REPORT_ALREADY_EXISTS if exists
5. Create report record:
     userId=currentUserId, reviewId, reasonId,
     description, status='pending'
6. Return { reportId, status: 'pending' }
```

Transaction: wraps step 5 only.

Side effects: create `REPORT_CREATED` notification for every user with the ADMIN
role (see WF-NOTI-001), sent after the transaction commits.

---

## WF-RPT-002 — Withdraw Report

**UseCase:** `WithdrawReportUseCase`
**Trigger:** `DELETE /reports/:reportId`

Steps:

```
1. Load report by reportId
2. If not found → throw REPORT_NOT_FOUND
3. If report.userId != currentUserId → throw FORBIDDEN
4. If report.status != 'pending' → throw REPORT_NOT_WITHDRAWABLE
5. Delete report record (hard delete)
```

---

# Section 8. Admin Moderation Workflows

---

## WF-ADMIN-001 — Approve Business

**UseCase:** `ApproveBusinessUseCase`
**Trigger:** `POST /admin/businesses/:businessId/approve`

Preconditions:

```
- Business exists (deletedAt IS NULL)
- Business status = 'pending'
```

Steps:

```
1. Load business WHERE deletedAt IS NULL
2. If not found → throw BUSINESS_NOT_FOUND
3. If business.status != 'pending' → throw BUSINESS_NOT_PENDING
4. BEGIN TRANSACTION:
   a. Update business:
        status='approved', approvedByUserId=currentUserId
   b. Create notification record:
        userId=business.ownerUserId,
        type='BUSINESS_APPROVED',
        title='Business Approved',
        content='Your business "{name}" has been approved.'
   c. Create audit log:
        action='BUSINESS_APPROVED', entityType='Business',
        entityId=businessId, userId=currentUserId,
        newData={ status: 'approved' }
5. Push SSE event to business.ownerUserId:
     { event: 'notification', type: 'BUSINESS_APPROVED', ... }
6. Return { businessId, status: 'approved' }
```

Transaction: wraps steps 4a-4c.
SSE push (step 5): OUTSIDE transaction, after commit.

---

## WF-ADMIN-002 — Reject Business

**UseCase:** `RejectBusinessUseCase`
**Trigger:** `POST /admin/businesses/:businessId/reject`

Steps:

```
1. Load business WHERE deletedAt IS NULL → throw BUSINESS_NOT_FOUND
2. If business.status != 'pending' → throw BUSINESS_NOT_PENDING
3. BEGIN TRANSACTION:
   a. Update business.status = 'rejected'
   b. Create notification:
        userId=business.ownerUserId,
        type='BUSINESS_REJECTED',
        title='Business Rejected',
        content='Your business "{name}" was rejected. Reason: {reason}'
   c. Create audit log:
        action='BUSINESS_REJECTED', entityType='Business',
        entityId=businessId, userId=currentUserId
4. Push SSE event to business.ownerUserId
5. Return { businessId, status: 'rejected' }
```

Transaction: wraps step 3a-3c.

---

## WF-ADMIN-003 — Approve Review

**UseCase:** `ApproveReviewUseCase`
**Trigger:** `POST /admin/reviews/:reviewId/approve`

Preconditions:

```
- Review exists (deletedAt IS NULL)
- Review status = 'pending'
```

Steps:

```
1. Load review WHERE deletedAt IS NULL → throw REVIEW_NOT_FOUND
2. If review.status != 'pending' → throw REVIEW_NOT_PENDING
3. BEGIN TRANSACTION:
   a. Update review:
        status='approved', managedByUserId=currentUserId
   b. Create notification:
        userId=review.writerUserId,
        type='REVIEW_APPROVED',
        title='Review Approved',
        content='Your review has been approved.'
   c. Create audit log:
        action='REVIEW_APPROVED', entityType='Review',
        entityId=reviewId, userId=currentUserId
4. Push SSE event to review.writerUserId
5. Return { reviewId, status: 'approved' }
```

Transaction: wraps step 3a-3c.

Note: Review becomes eligible for ranking in the NEXT cron run.
Do NOT trigger immediate ranking recalculation here.

---

## WF-ADMIN-004 — Reject Review

**UseCase:** `RejectReviewUseCase`
**Trigger:** `POST /admin/reviews/:reviewId/reject`

Steps:

```
1. Load review WHERE deletedAt IS NULL → throw REVIEW_NOT_FOUND
2. If review.status != 'pending' → throw REVIEW_NOT_PENDING
3. BEGIN TRANSACTION:
   a. Update review:
        status='rejected', managedByUserId=currentUserId
   b. Create notification:
        userId=review.writerUserId,
        type='REVIEW_REJECTED',
        title='Review Rejected',
        content='Your review has been rejected. Reason: {reason}'
   c. Create audit log:
        action='REVIEW_REJECTED', entityType='Review',
        entityId=reviewId, userId=currentUserId
4. Push SSE event to review.writerUserId
5. Return { reviewId, status: 'rejected' }
```

Transaction: wraps step 3a-3c.

---

## WF-ADMIN-005 — Resolve Report

**UseCase:** `ResolveReportUseCase`
**Trigger:** `POST /admin/reports/:reportId/resolve`

Steps:

```
1. Load report by reportId → throw REPORT_NOT_FOUND
2. BEGIN TRANSACTION:
   a. Update report.status = 'resolved'
   b. Create notification:
        userId=report.userId,
        type='REPORT_RESOLVED',
        title='Report Resolved',
        content='Your report has been reviewed and resolved.'
   c. Create audit log:
        action='REPORT_RESOLVED', entityType='Report',
        entityId=reportId, userId=currentUserId
3. Push SSE event to report.userId
4. Return { reportId, status: 'resolved' }
```

Transaction: wraps step 2a-2c.

---

## WF-ADMIN-006 — Ban User

**UseCase:** `BanUserUseCase`
**Trigger:** `PATCH /admin/users/:userId/ban`

Preconditions:

```
- User exists (deletedAt IS NULL)
- Target user role != 'ADMIN'
```

Steps:

```
1. Load user WHERE deletedAt IS NULL → throw USER_NOT_FOUND
2. If user.role = 'ADMIN' → throw CANNOT_BAN_ADMIN
3. BEGIN TRANSACTION:
   a. Update user.status = 'banned'
   b. Revoke all refresh tokens:
        UPDATE refresh_tokens SET revokedAt=now()
        WHERE userId=userId AND revokedAt IS NULL
   c. Create audit log:
        action='USER_BANNED', entityType='User',
        entityId=userId, userId=currentUserId,
        newData={ reason }
4. Return { userId, status: 'banned' }
```

Transaction: wraps step 3a-3c.

---

## WF-ADMIN-007 — Unban User

**UseCase:** `UnbanUserUseCase`
**Trigger:** `PATCH /admin/users/:userId/unban`

Preconditions:

```
- User exists (deletedAt IS NULL)
- User is currently banned (status = 'banned')
```

Steps:

```
1. Load user WHERE deletedAt IS NULL → throw USER_NOT_FOUND
2. If user.status != 'banned' → throw USER_NOT_BANNED
3. Update user.status = 'active'
4. Return { userId, status: 'active' }
```

Transaction: single table write, no explicit transaction needed.

---

## WF-ADMIN-008 — Approve Claim

**UseCase:** `ApproveClaimUseCase`
**Trigger:** `POST /admin/business-claims/:claimId/approve`

Preconditions:

```
- Claim exists
- Claim status = 'pending'
```

Steps:

```
1. Load claim by claimId
2. If not found → throw BUSINESS_CLAIM_NOT_FOUND
3. If claim.status != 'pending' → throw CLAIM_NOT_PENDING
4. BEGIN TRANSACTION:
   a. Update claim:
        status='approved', reviewedByUserId=currentUserId
   b. Update business:
        ownerUserId=claim.userId
   c. Look up roleId for BUSINESS_OWNER
   d. Update claimant user:
        UPDATE users SET roleId=businessOwnerRoleId WHERE userId=claim.userId
   e. Find all OTHER pending claims WHERE businessId=claim.businessId
      AND claimId != claim.claimId AND status='pending'
   f. Bulk-update those rival claims: status='rejected'
   g. Create audit log:
        action='BUSINESS_CLAIM_APPROVED', entityType='BusinessClaim',
        entityId=claimId, userId=currentUserId,
        newData={ status: 'approved', businessId, ownerUserId: claim.userId }
5. (OUTSIDE transaction, per D-017 Realtime Transport):
   a. Create notification + push SSE event to claim.userId:
        type='CLAIM_APPROVED',
        title='Claim Approved',
        content='Your claim on "{name}" has been approved. You are now the owner of this business.'
   b. For each auto-rejected rival claimant, create notification + push SSE event:
        type='CLAIM_REJECTED',
        title='Claim Rejected',
        content='Your claim on "{name}" was rejected. Reason: Another user's claim for this business was approved.'
6. Return { claimId, status: 'approved' }
```

Transaction: wraps steps 4a-4g.
SSE push (step 5): OUTSIDE transaction, after commit — per D-017.

---

## WF-ADMIN-009 — Reject Claim

**UseCase:** `RejectClaimUseCase`
**Trigger:** `POST /admin/business-claims/:claimId/reject`

Steps:

```
1. Load claim by claimId → throw BUSINESS_CLAIM_NOT_FOUND
2. If claim.status != 'pending' → throw CLAIM_NOT_PENDING
3. BEGIN TRANSACTION:
   a. Update claim:
        status='rejected', reviewedByUserId=currentUserId
   b. Create notification:
        userId=claim.userId,
        type='CLAIM_REJECTED',
        title='Claim Rejected',
        content='Your claim on "{name}" was rejected. Reason: {reason}'
   c. Create audit log:
        action='BUSINESS_CLAIM_REJECTED', entityType='BusinessClaim',
        entityId=claimId, userId=currentUserId
4. Push SSE event to claim.userId
5. Return { claimId, status: 'rejected' }
```

Transaction: wraps step 3a-3c.

---

# Section 9. Ranking Workflow

---

## WF-RANK-001 — Recalculate Rankings

**UseCase:** `RankingRecalculationJob`
**Trigger:** Cron `0 * * * *` OR `POST /admin/rankings/recalculate`

Steps:

```
1. Load all businesses WHERE status='approved' AND deletedAt IS NULL

2. For each business:
   a. Load all reviews WHERE businessId=id
                        AND status='approved'
                        AND deletedAt IS NULL
   b. Use the fresh configuration loaded once for this run (D-012/D-014).
      Recompute trust from moderation-approved/rejected counts, then fraud signals.
   c. Compute avgRating from all approved reviews (raw public star statistic).
   d. Compute normalized multi-criteria score S_i and gated review weight W_i.
      Fraud REJECTED has W_i=0; SUSPICIOUS scales the whole weight by delta.
   e. Compute v = count of reviews with W_i>0, R = sum(W_i*S_i)/sum(W_i).
      If v=0, omit this business from ALL ranking scopes and new history rows.
   f. Compute rankingScore = 100 * (v*R + m*C)/(v+m), C=0.63 and m=10 by default.
      Keep full precision until sorting; persist scores rounded to two decimals.
      (see DECISIONS.md D-012 for the authoritative pipeline)

3. Sort by score DESC, v DESC, R DESC, businessId ASC → assign rank (1 = highest)

4. BEGIN TRANSACTION:
   a. Delete all existing ranking_snapshots (full replace strategy)
   b. Insert new ranking_snapshots for each business:
        - scope='GLOBAL', scopeId=NULL, rank, rankingScore=score,
          avgRating, reviewCount=v, businessId
   c. Insert category-scoped snapshots:
        - For each category, re-rank businesses in that category only
        - scope='CATEGORY', scopeId=categoryId
   d. Insert province-scoped snapshots:
        - For each unique province (from locations), re-rank businesses
        - scope='PROVINCE', scopeId=NULL (filter by province name via join)
   e. Update businesses.avgRating for each business
   f. Insert ranking_snapshot_history rows from the GLOBAL snapshots computed in
      step 4b (one row per business: rank, rankingScore, businessId) — see
      DECISIONS.md D-031. This is append-only, unlike step 4a/4b.
   g. Delete ranking_snapshot_history rows WHERE calculatedAt < now() - 40 days
      (retention purge, see D-031)

5. Invalidate Redis ranking cache:
     DELETE ranking:global
     DELETE ranking:category:*
     DELETE ranking:province:*

6. Log completion:
     action='RANKING_RECALCULATED', entityType='System', userId=NULL,
     newData={ totalBusinesses, calculatedAt }
```

Transaction: wraps step 4a-4g.
Cache invalidation (step 5): OUTSIDE transaction, after commit.

Performance note:

```
- Load all data in batches, not one by one (avoid N+1)
- Use a single query with aggregation where possible:
    SELECT businessId, COUNT(*) as n, AVG(overallRating) as avgRating
    FROM reviews
    WHERE status='approved' AND deletedAt IS NULL
    GROUP BY businessId
```

---

## WF-RANK-002 — Update Ranking Trend Config

**UseCase:** `RankingTrendConfigUseCase` (updateConfig)
**Trigger:** `PATCH /admin/rankings/trend-config`

Preconditions:

```
- Current user role = ADMIN
- period is one of 'DAY' | 'WEEK' | 'MONTH'
```

Steps:

```
1. Validate period is one of DAY|WEEK|MONTH → throw VALIDATION_ERROR if not
2. Update ranking_trend_config singleton row: period=dto.period
3. Return { period, updatedAt }
```

Transaction: single table write, no explicit transaction needed.

Side effects: none. Takes effect immediately on the next
`GET /rankings/businesses/:businessId` call (no cache to invalidate — trend is
computed on read, not cached).

---

# Section 10. Notification Workflow

---

## WF-NOTI-001 — Create and Push Notification

**UseCase:** `CreateNotificationUseCase`
**Called by:** All moderation workflows (not a direct API endpoint)

Steps:

```
1. Create notification record in PostgreSQL:
     userId, type, title, content, isRead=false
2. Return saved notification (with notificationId)
3. Attempt SSE push to userId via NotificationSseService
   - If user has no active SSE connection → skip silently
   - If push fails → log warning, do NOT throw
```

Critical rule:

```
Step 1 (persist) MUST succeed before step 3 (push).
SSE failure MUST NOT roll back the notification record.
This means SSE push happens OUTSIDE any transaction.
```

---

# Section 11. Search Workflow

---

## WF-SEARCH-001 — Search Businesses

**UseCase:** Called inside `GetBusinessListUseCase`
**Trigger:** `GET /businesses?search=...`

Steps:

```
1. If search param provided:
   Build FTS query:
     WHERE to_tsvector('simple', name || ' ' || coalesce(description, ''))
           @@ plainto_tsquery('simple', :searchTerm)
     AND status = 'approved'
     AND deletedAt IS NULL

2. Apply additional filters:
     categoryId → JOIN business_categories WHERE categoryId=:id
     province   → JOIN business_locations → JOIN locations WHERE province=:province

3. Apply sorting:
     avgRating   → ORDER BY avg_rating DESC
     reviewCount → ORDER BY review_count DESC (from ranking_snapshots)
     createdAt   → ORDER BY created_at DESC

4. Apply pagination (LIMIT/OFFSET)

5. Return paginated results
```

---

# Section 12. Bookmark Workflows

---

## WF-BOOKMARK-001 — Add Bookmark

**UseCase:** `AddBookmarkUseCase`
**Trigger:** `POST /businesses/:businessId/bookmark`

Preconditions:

```
- Business exists (deletedAt IS NULL)
- Current user has NOT bookmarked this business before
```

Steps:

```
1. Load business by businessId WHERE deletedAt IS NULL
2. If not found → throw BUSINESS_NOT_FOUND
3. Check UNIQUE(userId, businessId) in bookmarks
   → throw BOOKMARK_ALREADY_EXISTS if exists
4. Create bookmark record: userId=currentUserId, businessId
5. Return { bookmarkId, businessId }
```

Transaction: wraps step 4 only.

Side effects: none.

---

## WF-BOOKMARK-002 — Remove Bookmark

**UseCase:** `RemoveBookmarkUseCase`
**Trigger:** `DELETE /businesses/:businessId/bookmark`

Steps:

```
1. Find bookmark WHERE userId=currentUserId AND businessId
2. If not found → throw BOOKMARK_NOT_FOUND
3. Delete bookmark record (hard delete — bookmarks have no soft delete)
```

---

# Section 13. State Transition Reference

## Business Status

```
ALLOWED transitions:
  pending  → approved  (WF-ADMIN-001)
  pending  → rejected  (WF-ADMIN-002)
  approved → hidden    (WF-ADMIN, hide action)
  hidden   → approved  (admin manual, not a separate workflow)

FORBIDDEN transitions:
  approved → pending
  rejected → pending
  rejected → approved (must create new business)
```

## Business Claim Status

```
ALLOWED transitions:
  pending  → approved   (WF-ADMIN-008)
  pending  → rejected   (WF-ADMIN-009)
  pending  → [deleted]  (WF-CLAIM-002, user withdraws)

FORBIDDEN transitions:
  approved → pending
  rejected → pending
  rejected → approved (must submit a new claim)
```

## Review Status

```
ALLOWED transitions:
  pending  → approved  (WF-ADMIN-003)
  pending  → rejected  (WF-ADMIN-004)
  approved → hidden    (WF-ADMIN, hide action)
  any      → pending   (WF-REV-002, after edit)

FORBIDDEN transitions:
  rejected → approved  (must create new review)
  hidden   → approved
```

## Report Status

```
ALLOWED transitions:
  pending  → reviewing  (admin picks up)
  pending  → resolved   (WF-ADMIN-005)
  reviewing → resolved  (WF-ADMIN-005)
  pending  → rejected   (WF-ADMIN reject report)
  pending  → [deleted]  (WF-RPT-002, user withdraws)

FORBIDDEN transitions:
  resolved → any
  rejected → any
```

---

# Section 14. Domain Exceptions Reference

Every exception below maps to an HTTP status code in REFERENCE.md.
Throw the domain exception by name — the global filter handles HTTP mapping.

```
Auth:
  INVALID_CREDENTIALS
  INVALID_REFRESH_TOKEN
  TOKEN_EXPIRED
  INVALID_GOOGLE_TOKEN
  USER_BANNED

User:
  USER_NOT_FOUND
  INVALID_PASSWORD
  CANNOT_BAN_ADMIN

Business:
  BUSINESS_NOT_FOUND
  BUSINESS_NOT_APPROVED
  BUSINESS_NOT_PENDING
  PHONE_ALREADY_EXISTS
  EMAIL_ALREADY_EXISTS
  LAST_LOCATION_ERROR

Review:
  REVIEW_NOT_FOUND
  REVIEW_ALREADY_EXISTS
  REVIEW_NOT_PENDING
  INVALID_RATING
  INVALID_CRITERION

Reply:
  REPLY_NOT_FOUND
  REPLY_ALREADY_EXISTS

Report:
  REPORT_NOT_FOUND
  REPORT_ALREADY_EXISTS
  REPORT_NOT_WITHDRAWABLE
  REASON_NOT_FOUND

Business Claim:
  BUSINESS_CLAIM_NOT_FOUND
  BUSINESS_ALREADY_CLAIMED
  CLAIM_ALREADY_PENDING
  CLAIM_NOT_PENDING

Bookmark:
  BOOKMARK_NOT_FOUND
  BOOKMARK_ALREADY_EXISTS

Category / Criteria:
  CATEGORY_NOT_FOUND
  CATEGORY_ALREADY_EXISTS
  CRITERION_NOT_FOUND
  CRITERION_ALREADY_EXISTS
  ASSIGNMENT_ALREADY_EXISTS
  ASSIGNMENT_NOT_FOUND
  LOCATION_NOT_FOUND

Notification:
  NOTIFICATION_NOT_FOUND

General:
  FORBIDDEN
  VALIDATION_ERROR
  INTERNAL_SERVER_ERROR
```

---

End of WORKFLOWS.md — v1.0
