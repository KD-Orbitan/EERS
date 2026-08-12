-- Add the new enum label first, in its own transaction. Postgres forbids
-- using a newly added enum value (in a CHECK constraint or index predicate)
-- within the same transaction that adds it, hence the follow-up migration.
ALTER TYPE "ImageType" ADD VALUE 'BUSINESS_LOGO';
