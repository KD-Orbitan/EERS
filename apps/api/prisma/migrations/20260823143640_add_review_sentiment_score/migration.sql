-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "sentiment_analyzed_at" TIMESTAMPTZ,
ADD COLUMN     "sentiment_score" DECIMAL(5,4);
