-- AlterTable
ALTER TABLE "scoring_config" ALTER COLUMN "bayesian_c" SET DEFAULT 0.63;

-- Data fix: bayesian_c was seeded as 3.5, a prior mean for the old raw
-- avgRating (1-5) formula. The active ranking pipeline (DECISIONS.md D-012)
-- blends this prior with R_j, which is a weighted average of criterion
-- scores normalized to [0, 1] (see MultiCriteriaScoringService.normalizeRating).
-- Leaving bayesian_c at 3.5 pulls any business under the review threshold
-- toward a score far outside the [0, 1] range R_j can ever reach, inverting
-- the intended effect. Only touches rows still at the stale default, so an
-- admin-customized value is left untouched.
UPDATE "scoring_config" SET "bayesian_c" = 0.63 WHERE "bayesian_c" = 3.5;
