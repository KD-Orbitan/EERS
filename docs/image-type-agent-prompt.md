# Agent Task: Add ImageType Support to Images Table

## Context

The `images` table currently uses a polymorphic pattern (CHECK constraint ensures exactly one of `userId`, `reviewId`, `businessId` is non-null) but has NO way to distinguish the **purpose** of an image. A user's avatar and a hypothetical user profile banner would look identical in the DB. We need to add an `imageType` discriminator so the system can support:

- **User avatar** (1 per user — already implemented, but without explicit type)
- **Business cover photo** (1 per business — NEW)
- **Business gallery** (many per business — NEW)
- **Review photos** (many per review — already implemented, but without explicit type)

---

## Phase 1 — Audit & Impact Analysis

**DO NOT write any code yet.** First, audit the codebase and produce a report.

### 1.1 — Find all references to the Image model

Search the entire `apps/api/src` directory for:

```
- Prisma queries that read/write the `images` table (findFirst, findMany, create, delete, etc.)
- Any repository or service that touches Image records
- The existing UploadAvatarUseCase (WF-USER-003) and how it currently creates/queries avatar images
- Any place where images are included via Prisma `include: { images: true }` or selected
- The existing CHECK constraint in migration files
- CloudinaryService usage
```

### 1.2 — Produce the audit report

Format:

```
File: <path>
Usage: <what it does with images>
Impact: <what changes when imageType is added>
```

### 1.3 — Check for blockers

Verify:

```
- Does the current migration have the `images_single_owner_check` constraint? (it will be replaced)
- Are there any existing image records in seed data that would need a type?
- Does any API response shape include image data that would need to change?
```

**STOP after Phase 1. Report findings before proceeding.**

---

## Phase 2 — Schema Changes

### 2.1 — Add ImageType enum to Prisma schema

```prisma
enum ImageType {
  AVATAR
  BUSINESS_COVER
  BUSINESS_GALLERY
  REVIEW_PHOTO
}
```

### 2.2 — Update Image model in Prisma schema

Add two new columns:

```prisma
imageType    ImageType @map("image_type")
displayOrder Int?      @map("display_order") @db.SmallInt  // for gallery ordering
```

### 2.3 — Create migration

Generate a new Prisma migration. The migration SQL must:

1. Add the `ImageType` enum type
2. Add the `image_type` column (NOT NULL) — if existing data exists, backfill:
   - Records where `user_id IS NOT NULL` → `'AVATAR'`
   - Records where `business_id IS NOT NULL` → `'BUSINESS_GALLERY'` (safe default)
   - Records where `review_id IS NOT NULL` → `'REVIEW_PHOTO'`
3. Add the `display_order` column (nullable)
4. **DROP** the old `images_single_owner_check` constraint
5. **ADD** a new, stricter CHECK constraint:

```sql
ALTER TABLE images ADD CONSTRAINT images_type_owner_consistency CHECK (
  CASE
    WHEN image_type = 'AVATAR'           THEN user_id IS NOT NULL AND business_id IS NULL AND review_id IS NULL
    WHEN image_type = 'BUSINESS_COVER'   THEN business_id IS NOT NULL AND user_id IS NULL AND review_id IS NULL
    WHEN image_type = 'BUSINESS_GALLERY' THEN business_id IS NOT NULL AND user_id IS NULL AND review_id IS NULL
    WHEN image_type = 'REVIEW_PHOTO'     THEN review_id IS NOT NULL AND user_id IS NULL AND business_id IS NULL
    ELSE false
  END
);
```

6. **ADD** partial unique indexes:

```sql
-- Each user can have only 1 avatar
CREATE UNIQUE INDEX uq_user_avatar ON images (user_id) WHERE image_type = 'AVATAR';

-- Each business can have only 1 cover photo
CREATE UNIQUE INDEX uq_business_cover ON images (business_id) WHERE image_type = 'BUSINESS_COVER';
```

7. **ADD** a composite index for gallery ordering:

```sql
CREATE INDEX idx_business_gallery_order ON images (business_id, display_order) WHERE image_type = 'BUSINESS_GALLERY';
```

### 2.4 — Regenerate Prisma client

```bash
pnpm --filter api exec prisma generate
```

### 2.5 — Verify migration

```bash
pnpm --filter api exec prisma migrate dev
```

Ensure no errors. If seed data exists, ensure the backfill in step 2 handles it.

---

## Phase 3 — Update Existing Code

### 3.1 — Update UploadAvatarUseCase

The existing `UploadAvatarUseCase` (WF-USER-003) must now:

- Set `imageType: 'AVATAR'` when creating the image record
- Query for existing avatar using `{ userId, imageType: 'AVATAR' }` instead of just `{ userId }`
- No changes to the API contract (POST /users/avatar response stays the same)

### 3.2 — Update any existing image queries

Anywhere images are included/queried for a specific purpose, add the `imageType` filter:

- User profile query that fetches avatar → filter `imageType: 'AVATAR'`
- Business detail query that fetches images → decide which types to include based on context
- Review detail query that fetches images → filter `imageType: 'REVIEW_PHOTO'`

### 3.3 — Update GET /users/profile

The `avatarUrl` field should be populated by querying:

```typescript
prisma.image.findFirst({
  where: { userId, imageType: 'AVATAR' }
})
```

### 3.4 — Update GET /businesses/:businessId response

If the business detail response currently includes images, it should now distinguish:

```typescript
{
  coverUrl: string | null,       // from imageType = 'BUSINESS_COVER'
  gallery: Array<{               // from imageType = 'BUSINESS_GALLERY'
    imageId: number,
    url: string,
    displayOrder: number | null
  }>
}
```

### 3.5 — Update review responses

If review responses include images, add explicit filtering:

```typescript
where: { reviewId, imageType: 'REVIEW_PHOTO' }
```

---

## Phase 4 — New API Endpoints

### 4.1 — Business Cover Photo

```
POST /businesses/:businessId/cover
Auth: BusinessOwner+ (must own business), Admin
Content-Type: multipart/form-data
Field: cover (file)
```

Workflow (similar to WF-USER-003 pattern):

```
1. Validate file type (jpg/jpeg/png/webp) and size (max 10MB)
2. Verify business exists (deletedAt IS NULL) and user is owner or admin
3. If existing cover → delete old image from Cloudinary + delete old record
4. Upload new file to Cloudinary
5. Create image record:
     businessId, userId=NULL, reviewId=NULL,
     imageType='BUSINESS_COVER',
     cloudinaryPublicId, secureUrl, width, height, format
6. Return { coverUrl: secureUrl }
```

Response `200`:

```typescript
interface UploadCoverResponse {
  coverUrl: string
}
```

Errors: `BUSINESS_NOT_FOUND 404`, `FORBIDDEN 403`, `INVALID_FILE_TYPE 400`, `FILE_TOO_LARGE 400`

```
DELETE /businesses/:businessId/cover
Auth: BusinessOwner+ (must own business), Admin
```

Workflow:

```
1. Verify business exists and user is owner or admin
2. Find cover image record
3. Delete from Cloudinary
4. Delete record from DB
```

Response `204`: No content

---

### 4.2 — Business Gallery

```
POST /businesses/:businessId/gallery
Auth: BusinessOwner+ (must own business), Admin
Content-Type: multipart/form-data
Field: images (file[], max 5 files per request)
```

Workflow:

```
1. Validate each file (type + size)
2. Verify business exists and user is owner or admin
3. Count existing gallery images for this business
4. If existing + new > 20 → throw GALLERY_LIMIT_EXCEEDED
5. Upload each file to Cloudinary
6. Create image records with:
     businessId, imageType='BUSINESS_GALLERY',
     displayOrder = max(existing displayOrder) + 1, +2, +3...
7. Return array of created images
```

Response `201`:

```typescript
interface UploadGalleryResponse {
  images: Array<{
    imageId: number
    url: string
    displayOrder: number
  }>
}
```

Errors: `BUSINESS_NOT_FOUND 404`, `FORBIDDEN 403`, `INVALID_FILE_TYPE 400`, `FILE_TOO_LARGE 400`, `GALLERY_LIMIT_EXCEEDED 400`

```
DELETE /businesses/:businessId/gallery/:imageId
Auth: BusinessOwner+ (must own business), Admin
```

Workflow:

```
1. Verify business exists and user is owner or admin
2. Find image record WHERE imageId AND businessId AND imageType='BUSINESS_GALLERY'
3. Delete from Cloudinary
4. Delete record from DB
```

Response `204`: No content

```
PATCH /businesses/:businessId/gallery/reorder
Auth: BusinessOwner+ (must own business), Admin
```

Request:

```typescript
interface ReorderGalleryDto {
  imageIds: number[]  // ordered array of imageIds — new display order
}
```

Workflow:

```
1. Verify business exists and user is owner or admin
2. Verify all imageIds belong to this business with imageType='BUSINESS_GALLERY'
3. Update displayOrder for each image based on array index (1-based)
```

Response `200`:

```typescript
interface ReorderGalleryResponse {
  message: string  // "Gallery reordered successfully"
}
```

---

## Phase 5 — Add Error Codes

Add to the appropriate exception/error-code files (follow existing patterns from REFERENCE.md):

```
GALLERY_LIMIT_EXCEEDED  400  "Maximum gallery images (20) reached"
IMAGE_NOT_FOUND         404  "Image not found"
```

---

## Phase 6 — Update Documentation Files

After all code changes are complete, update the following docs to stay in sync:

### 6.1 — SCHEMA.md

- Update the Image model definition to include `imageType` and `displayOrder`
- Update the CHECK constraint section
- Update the Notes section explaining how each image type works
- Add the new partial unique indexes and composite index

### 6.2 — API.md

- Add the new endpoints under Chapter 3 (Business APIs):
  - `POST /businesses/:businessId/cover`
  - `DELETE /businesses/:businessId/cover`
  - `POST /businesses/:businessId/gallery`
  - `DELETE /businesses/:businessId/gallery/:imageId`
  - `PATCH /businesses/:businessId/gallery/reorder`
- Update `GET /businesses/:businessId` response shape if it now includes `coverUrl` and `gallery`

### 6.3 — WORKFLOWS.md

- Add `WF-BUS-006 — Upload Business Cover`
- Add `WF-BUS-007 — Upload Business Gallery Images`
- Add `WF-BUS-008 — Reorder Business Gallery`
- Update `WF-USER-003 — Upload Avatar` to note `imageType: 'AVATAR'`

### 6.4 — REFERENCE.md

- Add `ImageType` enum values to Section 1
- Add new error codes (`GALLERY_LIMIT_EXCEEDED`, `IMAGE_NOT_FOUND`) to Section 13
- Add gallery limits to File Upload Rules:

```
| Rule              | Value |
|-------------------|-------|
| Max gallery images| 20 per business |
| Max upload batch  | 5 files per request |
```

---

## Phase 7 — Tests

### 7.1 — Update existing tests

```
upload-avatar:
  ✓ saves image record with imageType='AVATAR'
  ✓ queries existing avatar by imageType='AVATAR' before delete
  ✓ partial unique index prevents duplicate avatars (DB-level)
```

### 7.2 — New tests for business cover

```
upload-cover:
  ✓ saves image with imageType='BUSINESS_COVER' and correct businessId
  ✓ replaces existing cover (deletes old from Cloudinary + DB)
  ✓ partial unique index prevents duplicate covers
  ✓ throws FORBIDDEN if user is not owner
  ✓ throws BUSINESS_NOT_FOUND for invalid businessId
  ✓ throws INVALID_FILE_TYPE for wrong format

delete-cover:
  ✓ deletes cover from Cloudinary and DB
  ✓ returns 204
  ✓ throws FORBIDDEN if user is not owner
```

### 7.3 — New tests for business gallery

```
upload-gallery:
  ✓ creates multiple image records with imageType='BUSINESS_GALLERY'
  ✓ assigns sequential displayOrder
  ✓ throws GALLERY_LIMIT_EXCEEDED when limit reached
  ✓ throws FORBIDDEN if user is not owner

delete-gallery-image:
  ✓ deletes specific gallery image
  ✓ only deletes if imageType='BUSINESS_GALLERY' (not cover or other)
  ✓ throws IMAGE_NOT_FOUND if imageId doesn't belong to business

reorder-gallery:
  ✓ updates displayOrder for all specified images
  ✓ throws error if imageIds don't all belong to business
```

---

## Definition of Done

```
✓ ImageType enum exists in Prisma schema
✓ Image model has imageType (required) and displayOrder (optional) columns
✓ Migration runs cleanly (including backfill of existing data)
✓ Old CHECK constraint replaced with new type-aware constraint
✓ Partial unique indexes created for AVATAR and BUSINESS_COVER
✓ Existing UploadAvatarUseCase uses imageType='AVATAR'
✓ Existing image queries filter by imageType where appropriate
✓ POST /businesses/:businessId/cover works (upload + replace)
✓ DELETE /businesses/:businessId/cover works
✓ POST /businesses/:businessId/gallery works (batch upload, respects limit)
✓ DELETE /businesses/:businessId/gallery/:imageId works
✓ PATCH /businesses/:businessId/gallery/reorder works
✓ GET /businesses/:businessId includes coverUrl and gallery in response
✓ All new error codes registered
✓ All documentation files updated (SCHEMA.md, API.md, WORKFLOWS.md, REFERENCE.md)
✓ All tests pass
✓ pnpm --filter api build succeeds
```

---

## Rules Reminder

```
- Use pnpm, NOT npm
- Follow existing module structure (application/domain/infrastructure/presentation)
- Use CloudinaryService from infrastructure — do NOT create a new upload service
- All new endpoints use the response envelope from DECISIONS.md D-024
- File validation rules from REFERENCE.md Section 9 apply to all new upload endpoints
- Cross-module access via exported use cases only, never import repositories directly
- JWT payload uses `sub` not `userId` — account for this in ownership checks
```
