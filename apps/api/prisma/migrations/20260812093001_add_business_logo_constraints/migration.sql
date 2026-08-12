-- Replace the type-aware ownership CHECK constraint to also cover BUSINESS_LOGO
ALTER TABLE "images" DROP CONSTRAINT IF EXISTS "images_type_owner_consistency";

ALTER TABLE "images" ADD CONSTRAINT "images_type_owner_consistency" CHECK (
  CASE
    WHEN "image_type" = 'AVATAR'           THEN "user_id" IS NOT NULL AND "business_id" IS NULL AND "review_id" IS NULL
    WHEN "image_type" = 'BUSINESS_COVER'   THEN "business_id" IS NOT NULL AND "user_id" IS NULL AND "review_id" IS NULL
    WHEN "image_type" = 'BUSINESS_LOGO'    THEN "business_id" IS NOT NULL AND "user_id" IS NULL AND "review_id" IS NULL
    WHEN "image_type" = 'BUSINESS_GALLERY' THEN "business_id" IS NOT NULL AND "user_id" IS NULL AND "review_id" IS NULL
    WHEN "image_type" = 'REVIEW_PHOTO'     THEN "review_id" IS NOT NULL AND "user_id" IS NULL AND "business_id" IS NULL
    ELSE false
  END
);

-- Each business can have only 1 logo
CREATE UNIQUE INDEX "uq_business_logo" ON "images"("business_id") WHERE "image_type" = 'BUSINESS_LOGO';
