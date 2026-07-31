CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateTable
CREATE TABLE "criterion_weights" (
    "weight_id" SMALLSERIAL NOT NULL,
    "category_id" SMALLINT NOT NULL,
    "criterion_id" SMALLINT NOT NULL,
    "weight" DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "criterion_weights_pkey" PRIMARY KEY ("weight_id")
);

-- CreateTable
CREATE TABLE "scoring_config" (
    "config_id" SMALLSERIAL NOT NULL,
    "bayesian_c" DECIMAL(4,2) NOT NULL DEFAULT 3.5,
    "bayesian_m" INTEGER NOT NULL DEFAULT 10,
    "fraud_lambda_1" DECIMAL(4,3) NOT NULL DEFAULT 0.4,
    "fraud_lambda_2" DECIMAL(4,3) NOT NULL DEFAULT 0.4,
    "fraud_lambda_3" DECIMAL(4,3) NOT NULL DEFAULT 0.2,
    "theta_dup" DECIMAL(4,3) NOT NULL DEFAULT 0.85,
    "l_dup" INTEGER NOT NULL DEFAULT 20,
    "theta_spam" INTEGER NOT NULL DEFAULT 5,
    "spam_window_hours" INTEGER NOT NULL DEFAULT 24,
    "theta_sus" DECIMAL(4,3) NOT NULL DEFAULT 0.3,
    "theta_reject" DECIMAL(4,3) NOT NULL DEFAULT 0.7,
    "trust_alpha" DECIMAL(4,3) NOT NULL DEFAULT 0.5,
    "trust_beta" DECIMAL(4,3) NOT NULL DEFAULT 0.3,
    "trust_gamma" DECIMAL(4,3) NOT NULL DEFAULT 0.2,
    "suspicious_delta" DECIMAL(4,3) NOT NULL DEFAULT 0.3,
    "time_decay_lambda" DECIMAL(6,4) NOT NULL DEFAULT 0.01,
    "sentiment_lambda" DECIMAL(4,3) NOT NULL DEFAULT 0.0,
    "weight_alpha" DECIMAL(4,3) NOT NULL DEFAULT 0.4,
    "weight_beta" DECIMAL(4,3) NOT NULL DEFAULT 0.4,
    "weight_gamma" DECIMAL(4,3) NOT NULL DEFAULT 0.2,
    "l_min" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "scoring_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "review_fraud_scores" (
    "fraud_score_id" BIGSERIAL NOT NULL,
    "review_id" BIGINT NOT NULL,
    "fraud_score" DECIMAL(5,4) NOT NULL,
    "duplicate_signal" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "spam_signal" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "trust_signal" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "fraud_status" VARCHAR(20) NOT NULL DEFAULT 'VALID',
    "calculated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_fraud_scores_pkey" PRIMARY KEY ("fraud_score_id")
);

-- CreateTable
CREATE TABLE "user_trust_scores" (
    "trust_score_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "trust_score" DECIMAL(5,4) NOT NULL,
    "valid_reviews" INTEGER NOT NULL DEFAULT 0,
    "account_age_days" INTEGER NOT NULL DEFAULT 0,
    "flagged_count" INTEGER NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_trust_scores_pkey" PRIMARY KEY ("trust_score_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "criterion_weights_category_id_criterion_id_key" ON "criterion_weights"("category_id", "criterion_id");

CREATE INDEX "idx_reviews_content_trgm"
ON "reviews"
USING gin("content" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "review_fraud_scores_review_id_key" ON "review_fraud_scores"("review_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_trust_scores_user_id_key" ON "user_trust_scores"("user_id");

-- AddForeignKey
ALTER TABLE "criterion_weights" ADD CONSTRAINT "criterion_weights_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterion_weights" ADD CONSTRAINT "criterion_weights_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "criteria"("criterion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_fraud_scores" ADD CONSTRAINT "review_fraud_scores_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("review_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_trust_scores" ADD CONSTRAINT "user_trust_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
