ALTER TABLE "reviews"
ADD COLUMN "moderated_at" TIMESTAMPTZ,
ADD COLUMN "moderation_reason" TEXT;
