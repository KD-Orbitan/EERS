-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('AVATAR', 'BUSINESS_COVER', 'BUSINESS_GALLERY', 'REVIEW_PHOTO');

-- AlterTable: add columns nullable first so existing rows can be backfilled
ALTER TABLE "images" ADD COLUMN "image_type" "ImageType";
ALTER TABLE "images" ADD COLUMN "display_order" SMALLINT;

-- Backfill imageType for any pre-existing rows
UPDATE "images" SET "image_type" = 'AVATAR' WHERE "user_id" IS NOT NULL AND "image_type" IS NULL;
UPDATE "images" SET "image_type" = 'BUSINESS_GALLERY' WHERE "business_id" IS NOT NULL AND "image_type" IS NULL;
UPDATE "images" SET "image_type" = 'REVIEW_PHOTO' WHERE "review_id" IS NOT NULL AND "image_type" IS NULL;

-- Enforce NOT NULL now that all existing rows are backfilled
ALTER TABLE "images" ALTER COLUMN "image_type" SET NOT NULL;

-- Drop the old single-owner CHECK constraint if present
ALTER TABLE "images" DROP CONSTRAINT IF EXISTS "images_single_owner_check";

-- Replace with a stricter, type-aware ownership constraint
ALTER TABLE "images" ADD CONSTRAINT "images_type_owner_consistency" CHECK (
  CASE
    WHEN "image_type" = 'AVATAR'           THEN "user_id" IS NOT NULL AND "business_id" IS NULL AND "review_id" IS NULL
    WHEN "image_type" = 'BUSINESS_COVER'   THEN "business_id" IS NOT NULL AND "user_id" IS NULL AND "review_id" IS NULL
    WHEN "image_type" = 'BUSINESS_GALLERY' THEN "business_id" IS NOT NULL AND "user_id" IS NULL AND "review_id" IS NULL
    WHEN "image_type" = 'REVIEW_PHOTO'     THEN "review_id" IS NOT NULL AND "user_id" IS NULL AND "business_id" IS NULL
    ELSE false
  END
);

-- Each user can have only 1 avatar
CREATE UNIQUE INDEX "uq_user_avatar" ON "images"("user_id") WHERE "image_type" = 'AVATAR';

-- Each business can have only 1 cover photo
CREATE UNIQUE INDEX "uq_business_cover" ON "images"("business_id") WHERE "image_type" = 'BUSINESS_COVER';

-- Composite index for gallery ordering
CREATE INDEX "idx_business_gallery_order" ON "images"("business_id", "display_order") WHERE "image_type" = 'BUSINESS_GALLERY';
