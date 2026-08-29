-- CreateEnum
CREATE TYPE "BusinessClaimStatus" AS ENUM ('pending', 'approved', 'rejected');

-- DropForeignKey
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_owner_user_id_fkey";

-- AlterTable
ALTER TABLE "businesses" ALTER COLUMN "owner_user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "business_claims" (
    "claim_id" BIGSERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "status" "BusinessClaimStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "business_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "reviewed_by_user_id" BIGINT,

    CONSTRAINT "business_claims_pkey" PRIMARY KEY ("claim_id")
);

-- CreateIndex
CREATE INDEX "business_claims_business_id_idx" ON "business_claims"("business_id");

-- CreateIndex
CREATE INDEX "business_claims_status_idx" ON "business_claims"("status");

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claims" ADD CONSTRAINT "business_claims_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claims" ADD CONSTRAINT "business_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claims" ADD CONSTRAINT "business_claims_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
