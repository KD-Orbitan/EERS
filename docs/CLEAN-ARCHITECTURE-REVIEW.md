# Clean Architecture review

## Scope and outcome

Reviewed backend source against D-020 and D-021 in `DECISIONS.md`. This change
repairs application boundaries in Auth, Business, User, Review and Notification;
it does **not** establish whole-project compliance. Existing scoring changes and
frontend changes in the workspace are preserved.

## Fixed

- Application image use cases depend on `ImageStorage`; Cloudinary implements it
  and maps its SDK response to `StoredImage`. Application code no longer imports
  Cloudinary or casts SDK upload responses.
- Geocoding, sentiment analysis and notification delivery use `Geocoder`,
  `SentimentAnalyzer` and `NotificationPublisher`. Nest module bindings use
  `useExisting`, including SSE so publishing and subscriptions share one manager.
- Auth and Review use cases no longer depend on Prisma. Unused injection and
  transaction wrappers around repository calls were removed.
- Login stores the refresh token and LOGIN_SUCCESS audit record using the same
  transaction client. Review deletion likewise updates the review and writes
  REVIEW_DELETED in the same transaction. Previously the repository write ran
  outside the transaction wrapping the log, so rollback could leave partial work.
- CreateReview and CreateReply read businesses through the already exported
  `GetBusinessSummaryUseCase`, instead of importing BusinessRepository.

## Verification

- TypeScript: `pnpm.cmd --filter api exec tsc --noEmit`.
- Tests: `pnpm.cmd --filter api exec jest --runInBand`.
- Added authorization tests for deletion, transaction-client and error-propagation
  tests, module dependency-injection coverage, and architecture boundary tests.
- Transaction tests use mocked clients; no live database rollback test was run.
- Architecture tests cover all domain layers and controllers, and application
  boundaries outside Admin/Ranking. Those two exceptions are explicit below;
  passing the tests does not imply the entire backend complies with D-020/D-021.

## Remaining findings

### D-020: Admin and Ranking application persistence dependencies

These need repository/query contracts that express business operations, with
queries and transaction clients implemented in Infrastructure. Merely wrapping
Prisma in a generic port would preserve the ORM coupling and is not a repair.

- `apps/api/src/modules/admin/application/use-cases/approve-business.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/approve-review.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/assign-criterion.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/ban-user.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/create-category.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/create-criterion.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/criterion-weight.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/list-admin-businesses.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/list-admin-reviews.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/list-admin-users.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/manage-taxonomy.use-case.ts`
  - `@prisma/client`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/ranking-trend-config.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/reject-business.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/reject-review.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/remove-criterion.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/scoring-config.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/admin/application/use-cases/unban-user.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/ranking/application/services/fraud-detection.service.ts`
  - `../../../../infrastructure/database/prisma.service`
  - `../../infrastructure/services/scoring-config.service`
  - `../../infrastructure/services/ranking-db.service`
  - `../../infrastructure/services/similarity.service`
- `apps/api/src/modules/ranking/application/services/multi-criteria-scoring.service.ts`
  - `../../infrastructure/services/ranking-db.service`
- `apps/api/src/modules/ranking/application/services/ranking-calculation.service.ts`
  - `../../../../infrastructure/database/prisma.service`
  - `../../infrastructure/services/scoring-config.service`
  - `../../infrastructure/services/ranking-db.service`
  - `../../infrastructure/services/ranking-cache.service`
  - `../../infrastructure/services/ranking-trend-config.service`
- `apps/api/src/modules/ranking/application/services/review-weighting.service.ts`
  - `../../infrastructure/services/ranking-db.service`
  - `../../infrastructure/services/scoring-config.service`
- `apps/api/src/modules/ranking/application/services/trust-score.service.ts`
  - `../../../../infrastructure/database/prisma.service`
  - `../../infrastructure/services/scoring-config.service`
- `apps/api/src/modules/ranking/application/use-cases/get-business-ranking.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
  - `../../infrastructure/services/ranking-trend-config.service`
- `apps/api/src/modules/ranking/application/use-cases/get-global-ranking.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
  - `../../infrastructure/services/ranking-cache.service`
  - `../../infrastructure/services/ranking-trend-config.service`
- `apps/api/src/modules/ranking/application/use-cases/get-market-competitors.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/ranking/application/use-cases/get-ranking-metadata.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
- `apps/api/src/modules/ranking/application/use-cases/get-top-businesses.use-case.ts`
  - `../../../../infrastructure/database/prisma.service`
  - `../../infrastructure/services/ranking-cache.service`

### D-021: module ownership

Cross-module repository imports remain in Auth (`google-auth`, `login`,
`refresh-token`, `register`), Bookmark (`add-bookmark`), Business Claim
(`submit-claim`), and Report (`create-report`). Owner-module public services
should replace these imports. Auth/User also split user and refresh-token
persistence across both modules, which requires reconciling ownership with D-021.

Infrastructure repositories still make cross-table reads/writes, including
review/business lookup and audit records. Moving a query out of an application
use case alone does not resolve module ownership. Atomic cross-module writes
need an explicit unit-of-work design before separating their persistence.

The frontend was not refactored in this change: D-022 specifies feature-based
architecture there, rather than the backend layering in D-020.
