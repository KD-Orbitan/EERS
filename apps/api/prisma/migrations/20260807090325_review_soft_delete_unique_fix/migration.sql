-- Fix: the plain UNIQUE(writer_user_id, business_id) constraint blocked a
-- user from writing a new review for a business after their previous review
-- for that business was soft-deleted, since the old (deleted) row still
-- occupied the unique slot. Replace it with a partial unique index that only
-- applies to active (non-deleted) reviews.

DROP INDEX "reviews_writer_user_id_business_id_key";

CREATE UNIQUE INDEX "uq_review_writer_business_active" ON "reviews"("writer_user_id", "business_id") WHERE "deleted_at" IS NULL;
