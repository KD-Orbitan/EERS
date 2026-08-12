-- DropIndex
DROP INDEX "idx_reviews_content_trgm";

-- CreateTable
CREATE TABLE "bookmarks" (
    "bookmark_id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" BIGINT NOT NULL,
    "business_id" BIGINT NOT NULL,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("bookmark_id")
);

-- CreateTable
CREATE TABLE "ranking_snapshot_history" (
    "history_id" BIGSERIAL NOT NULL,
    "rank" INTEGER NOT NULL,
    "ranking_score" DECIMAL(10,4) NOT NULL,
    "calculated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "business_id" BIGINT NOT NULL,

    CONSTRAINT "ranking_snapshot_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "ranking_trend_config" (
    "config_id" SMALLSERIAL NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT 'WEEK',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ranking_trend_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateIndex
CREATE INDEX "bookmarks_user_id_idx" ON "bookmarks"("user_id");

-- CreateIndex
CREATE INDEX "bookmarks_business_id_idx" ON "bookmarks"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_business_id_key" ON "bookmarks"("user_id", "business_id");

-- CreateIndex
CREATE INDEX "ranking_snapshot_history_business_id_calculated_at_idx" ON "ranking_snapshot_history"("business_id", "calculated_at");

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshot_history" ADD CONSTRAINT "ranking_snapshot_history_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;
