# PLAYBOOK-WEB.md

# Enterprise Evaluation & Ranking System (EERS)
# Frontend Implementation Playbook

Version: 1.0
Status: Locked
Priority: 5th (see DECISIONS.md D-027)
Applies to: Next.js frontend at apps/web
Depends on: PLAYBOOK-API.md fully complete

---

## How to use this document

Rules:

```
- Backend (PLAYBOOK-API.md) must be complete before starting this playbook
- All API shapes come from API.md — do NOT hardcode response structures
- All business rules stay in backend — frontend only renders what API returns
- Complete phases in order
- After each feature: verify UI works end-to-end, then report
```

Checkpoint format after each feature:

```
✓ Pages created: [list]
✓ API calls working: yes/no
✓ Auth guard working: yes/no
✓ Ready for next feature: yes/no
```

---

## Repository Structure

```
apps/web/
├── src/
│   ├── app/                  ← Next.js App Router pages
│   ├── features/             ← feature-specific code
│   ├── shared/               ← reusable code
│   └── widgets/              ← reusable page sections
├── public/
├── .env.local.example
└── package.json
```

---

## Feature Structure Template

Every feature follows this structure:

```
features/<name>/
├── components/       ← UI components for this feature
├── hooks/            ← custom hooks
├── queries/          ← TanStack Query read hooks
├── mutations/        ← TanStack Query write hooks
├── schemas/          ← Zod validation schemas
└── types/            ← feature-specific TypeScript types
```

---

## Shared Structure

```
shared/
├── ui/               ← shadcn/ui components + custom base components
├── lib/
│   └── api/
│       ├── api-client.ts     ← axios/fetch base instance
│       ├── auth.api.ts
│       ├── business.api.ts
│       ├── review.api.ts
│       ├── ranking.api.ts
│       ├── notification.api.ts
│       └── report.api.ts
├── hooks/
│   ├── use-auth.ts
│   └── use-sse.ts
├── constants/
│   └── query-keys.ts
└── types/
    └── api-response.type.ts
```

---

# Phase 0 — Frontend Bootstrap

**Goal:** Working Next.js app connected to backend.

---

## Task 0.1 — Init Next.js app

```bash
cd apps
npx create-next-app@latest web \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
mv web/src . 2>/dev/null || true
```

Install dependencies:

```bash
cd web
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm add axios
pnpm add react-hook-form @hookform/resolvers zod
pnpm add lucide-react
pnpm add sonner                    # toast notifications
pnpm add @radix-ui/react-dialog    # shadcn base
pnpm add js-cookie
pnpm add @types/js-cookie -D
```

Init shadcn/ui:

```bash
npx shadcn-ui@latest init
```

Add components as needed per phase.

---

## Task 0.2 — Environment config

Create `apps/web/.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

---

## Task 0.3 — API client

Create `shared/lib/api/api-client.ts`:

```typescript
// Base axios instance
// - Attaches Authorization: Bearer <accessToken> from memory
// - On 401: attempts refresh via POST /auth/refresh
// - On refresh failure: clears session, redirects to /login
```

Rules:

```
- Access token stored in memory (module-level variable or React context)
- Refresh token sent automatically via HttpOnly Cookie
- NEVER store access token in localStorage or sessionStorage
```

---

## Task 0.4 — Query keys

Create `shared/constants/query-keys.ts`:

```typescript
export const QUERY_KEYS = {
  AUTH_ME:              ['auth', 'me'],
  BUSINESSES:           ['businesses'],
  BUSINESS_DETAIL:      (id: number) => ['businesses', id],
  BUSINESS_REVIEWS:     (id: number) => ['businesses', id, 'reviews'],
  BUSINESS_STATS:       (id: number) => ['businesses', id, 'stats'],
  MY_BUSINESSES:        ['businesses', 'my'],
  REVIEWS:              ['reviews'],
  REVIEW_DETAIL:        (id: number) => ['reviews', id],
  MY_REVIEWS:           ['reviews', 'my'],
  RANKINGS:             ['rankings'],
  RANKINGS_TOP:         ['rankings', 'top'],
  CATEGORIES:           ['categories'],
  CRITERIA:             ['criteria'],
  NOTIFICATIONS:        ['notifications'],
  UNREAD_COUNT:         ['notifications', 'unread-count'],
  REPORTS:              ['reports'],
  MY_REPORTS:           ['reports', 'my'],
  REPORT_REASONS:       ['reports', 'reasons'],
} as const
```

---

## Task 0.5 — TanStack Query setup

Create `app/providers.tsx`:

```typescript
'use client'
// QueryClient with defaults:
// staleTime: 60 * 1000
// retry: 1
```

Wrap `app/layout.tsx` with `<Providers>`.

---

## Task 0.6 — Auth context

Create `shared/hooks/use-auth.ts`:

```typescript
// Returns: { user, isLoading, isAuthenticated }
// Uses useQuery(QUERY_KEYS.AUTH_ME, GET /auth/me)
// Access token managed in module-level ref
```

---

## Task 0.7 — Route protection middleware

Create `middleware.ts` at project root:

```typescript
// Protect routes:
// /profile, /businesses/create, /reviews/* (write)
// /notifications, /admin/*
// Redirect to /login if no session
// Redirect /admin/* to / if not ADMIN role
```

---

## Phase 0 — Definition of Done

```
✓ pnpm dev starts without errors
✓ API client connects to backend at NEXT_PUBLIC_API_URL
✓ GET /auth/me works when logged in
✓ Route protection redirects unauthenticated users
✓ TanStack Query devtools visible in development
```

---

# Phase 1 — Auth Feature

---

## Task 1.1 — Pages

```
app/(auth)/login/page.tsx
app/(auth)/register/page.tsx
app/(auth)/layout.tsx        ← centered card layout
```

---

## Task 1.2 — Zod schemas

```
features/auth/schemas/login.schema.ts
features/auth/schemas/register.schema.ts
```

---

## Task 1.3 — Mutations

```
features/auth/mutations/use-login.mutation.ts
features/auth/mutations/use-register.mutation.ts
features/auth/mutations/use-logout.mutation.ts
features/auth/mutations/use-google-auth.mutation.ts
```

After login mutation success:

```
1. Store accessToken in memory
2. Invalidate QUERY_KEYS.AUTH_ME
3. Redirect to /
```

After logout mutation success:

```
1. Clear accessToken from memory
2. Clear all queries: queryClient.clear()
3. Redirect to /login
```

---

## Task 1.4 — Components

```
features/auth/components/login-form.tsx
features/auth/components/register-form.tsx
features/auth/components/google-auth-button.tsx
```

Google auth button:

```
1. Load Google Identity Services script
2. On click → google.accounts.id.prompt()
3. On credential response → call useGoogleAuthMutation with idToken
```

---

## Phase 1 — Definition of Done

```
✓ /login page works with email + password
✓ /register page creates account
✓ Google Sign-In button works
✓ After login, redirected to home
✓ After logout, redirected to /login
✓ Protected routes redirect to /login when not authenticated
```

---

# Phase 2 — Business Feature

---

## Task 2.1 — Pages

```
app/(main)/businesses/page.tsx                  ← list + search
app/(main)/businesses/[id]/page.tsx             ← detail
app/(main)/businesses/create/page.tsx           ← create form
app/(main)/businesses/[id]/edit/page.tsx        ← edit form
app/(main)/businesses/my/page.tsx               ← my businesses
```

---

## Task 2.2 — Queries

```
features/business/queries/use-businesses.query.ts
features/business/queries/use-business-detail.query.ts
features/business/queries/use-my-businesses.query.ts
features/business/queries/use-business-statistics.query.ts
```

---

## Task 2.3 — Mutations

```
features/business/mutations/use-create-business.mutation.ts
features/business/mutations/use-update-business.mutation.ts
features/business/mutations/use-delete-business.mutation.ts
features/business/mutations/use-add-location.mutation.ts
features/business/mutations/use-remove-location.mutation.ts
```

After create mutation success:

```
Invalidate QUERY_KEYS.MY_BUSINESSES
Redirect to /businesses/my
```

---

## Task 2.4 — Components

```
features/business/components/business-card.tsx
features/business/components/business-list.tsx
features/business/components/business-detail.tsx
features/business/components/create-business-form.tsx
features/business/components/business-search-bar.tsx
features/business/components/location-list.tsx
```

---

## Task 2.5 — Schemas

```
features/business/schemas/create-business.schema.ts
features/business/schemas/update-business.schema.ts
```

---

## Phase 2 — Definition of Done

```
✓ /businesses lists approved businesses with search + filter
✓ /businesses/[id] shows detail with reviews
✓ /businesses/create creates business (status pending shown)
✓ /businesses/my shows owner's businesses with status badges
✓ Edit and delete work with ownership enforcement
```

---

# Phase 3 — Review Feature

---

## Task 3.1 — Pages

```
app/(main)/businesses/[id]/reviews/page.tsx       ← review list
app/(main)/businesses/[id]/reviews/write/page.tsx ← write review
app/(main)/reviews/my/page.tsx                    ← my reviews
```

---

## Task 3.2 — Queries

```
features/review/queries/use-business-reviews.query.ts
features/review/queries/use-review-detail.query.ts
features/review/queries/use-my-reviews.query.ts
features/review/queries/use-review-statistics.query.ts
```

---

## Task 3.3 — Mutations

```
features/review/mutations/use-create-review.mutation.ts
features/review/mutations/use-update-review.mutation.ts
features/review/mutations/use-delete-review.mutation.ts
features/review/mutations/use-create-reply.mutation.ts
features/review/mutations/use-create-report.mutation.ts
```

After create review success:

```
Invalidate QUERY_KEYS.BUSINESS_REVIEWS(businessId)
Invalidate QUERY_KEYS.BUSINESS_DETAIL(businessId)
```

---

## Task 3.4 — Components

```
features/review/components/review-card.tsx
features/review/components/review-list.tsx
features/review/components/write-review-form.tsx
features/review/components/criteria-rating-input.tsx
features/review/components/reply-form.tsx
features/review/components/report-modal.tsx
features/review/components/star-rating.tsx
```

`write-review-form.tsx`:

```
1. Load criteria for business via GET /categories/:id/criteria
2. Render overall rating input (1-5 stars)
3. Render criteria ratings (one per criterion)
4. Submit via useCreateReviewMutation
```

`report-modal.tsx`:

```
1. Load reasons via GET /reports/reasons
2. Select reason + optional description
3. Submit via useCreateReportMutation
```

---

## Task 3.5 — Schemas

```
features/review/schemas/create-review.schema.ts
features/review/schemas/update-review.schema.ts
```

---

## Phase 3 — Definition of Done

```
✓ Review list shows approved + pending for guests
✓ Write review form loads correct criteria for business
✓ Star rating UI works for overall + per criterion
✓ After submit, status 'pending' badge shown
✓ Business owner can reply to reviews
✓ Report modal works
✓ /reviews/my shows user's own reviews
```

---

# Phase 4 — Ranking Feature

---

## Task 4.1 — Pages

```
app/(main)/rankings/page.tsx    ← global ranking
```

---

## Task 4.2 — Queries

```
features/ranking/queries/use-rankings.query.ts
features/ranking/queries/use-top-businesses.query.ts
```

---

## Task 4.3 — Components

```
features/ranking/components/ranking-table.tsx
features/ranking/components/ranking-filters.tsx
```

Filters:

```
- Category select (from GET /categories)
- Province input (free text)
```

---

## Task 4.4 — Widget

```
widgets/top-businesses-widget.tsx
```

Used on homepage. Calls `useTopBusinessesQuery({ limit: 10 })`.

---

## Phase 4 — Definition of Done

```
✓ /rankings shows paginated ranking list
✓ Category + province filters work
✓ Top businesses widget renders on homepage
✓ Ranking score and review count displayed
```

---

# Phase 5 — Notification Feature

---

## Task 5.1 — Pages

```
app/(main)/notifications/page.tsx
```

---

## Task 5.2 — Queries + Mutations

```
features/notification/queries/use-notifications.query.ts
features/notification/queries/use-unread-count.query.ts
features/notification/mutations/use-mark-read.mutation.ts
features/notification/mutations/use-mark-all-read.mutation.ts
```

---

## Task 5.3 — SSE hook

Create `shared/hooks/use-sse.ts`:

```typescript
// Connects to GET /notifications/stream
// On 'notification' event → invalidate QUERY_KEYS.NOTIFICATIONS
//                         → invalidate QUERY_KEYS.UNREAD_COUNT
// On 'heartbeat' event   → no action
// Reconnect on close with 5 second delay
// Disconnect on logout
// Single connection per session
```

Mount this hook in the root layout (authenticated only).

---

## Task 5.4 — Components

```
features/notification/components/notification-list.tsx
features/notification/components/notification-item.tsx
features/notification/components/notification-bell.tsx
```

`notification-bell.tsx`:

```
- Shows unread count badge (from useUnreadCountQuery)
- Placed in top navigation bar
- On click → dropdown or redirect to /notifications
```

---

## Phase 5 — Definition of Done

```
✓ /notifications page shows list with read/unread state
✓ Bell icon shows unread count in nav
✓ SSE connection established after login
✓ New notification appears without page refresh
✓ Mark as read + mark all read work
✓ SSE disconnects on logout
```

---

# Phase 6 — User Profile Feature

---

## Task 6.1 — Pages

```
app/(main)/profile/page.tsx
app/(main)/profile/edit/page.tsx
app/(main)/profile/change-password/page.tsx
```

---

## Task 6.2 — Mutations

```
features/user/mutations/use-update-profile.mutation.ts
features/user/mutations/use-change-password.mutation.ts
features/user/mutations/use-upload-avatar.mutation.ts
```

---

## Task 6.3 — Components

```
features/user/components/profile-form.tsx
features/user/components/change-password-form.tsx
features/user/components/avatar-upload.tsx
```

---

## Phase 6 — Definition of Done

```
✓ /profile shows current user info
✓ Edit name works
✓ Change password works + logs out other sessions
✓ Avatar upload previews and saves
```

---

# Phase 7 — Admin Feature

**Depends on:** All previous phases

---

## Task 7.1 — Pages

```
app/(admin)/admin/page.tsx                          ← dashboard
app/(admin)/admin/businesses/page.tsx               ← pending businesses
app/(admin)/admin/reviews/page.tsx                  ← pending reviews
app/(admin)/admin/reports/page.tsx                  ← report queue
app/(admin)/admin/users/page.tsx                    ← user management
app/(admin)/admin/categories/page.tsx               ← category management
app/(admin)/admin/layout.tsx                        ← admin sidebar layout
```

---

## Task 7.2 — Mutations

```
features/admin/mutations/use-approve-business.mutation.ts
features/admin/mutations/use-reject-business.mutation.ts
features/admin/mutations/use-approve-review.mutation.ts
features/admin/mutations/use-reject-review.mutation.ts
features/admin/mutations/use-resolve-report.mutation.ts
features/admin/mutations/use-ban-user.mutation.ts
features/admin/mutations/use-create-category.mutation.ts
features/admin/mutations/use-assign-criterion.mutation.ts
features/admin/mutations/use-trigger-ranking.mutation.ts
```

---

## Task 7.3 — Components

```
features/admin/components/business-moderation-table.tsx
features/admin/components/review-moderation-table.tsx
features/admin/components/report-queue-table.tsx
features/admin/components/user-management-table.tsx
features/admin/components/reject-modal.tsx          ← shared reject reason input
features/admin/components/admin-sidebar.tsx
```

`reject-modal.tsx`:

```
Required for: reject business, reject review
Input: reason (string, min 10 chars)
Shared between business and review rejection flows
```

---

## Phase 7 — Definition of Done

```
✓ /admin/* redirects non-admin to home
✓ Pending businesses list + approve/reject works
✓ Pending reviews list + approve/reject works
✓ Report queue + resolve works
✓ User list + ban/unban works
✓ Category + criteria management works
✓ Trigger ranking recalculation button works
```

---

# Phase 8 — Hardening

---

## Task 8.1 — Loading states

Every data-fetching page MUST handle:

```
loading  → skeleton or spinner
error    → error message + retry button
empty    → empty state illustration
success  → data
```

Use consistent patterns across all pages.

---

## Task 8.2 — Error handling

All API errors flow through the API client.

Map common error codes to user-facing messages:

```
EMAIL_ALREADY_EXISTS    → "This email is already registered"
INVALID_CREDENTIALS     → "Invalid email or password"
REVIEW_ALREADY_EXISTS   → "You have already reviewed this business"
REPORT_ALREADY_EXISTS   → "You have already reported this review"
FORBIDDEN               → "You don't have permission to do this"
```

---

## Task 8.3 — Responsive layout

All pages MUST work on:

```
Mobile  : 375px+
Tablet  : 768px+
Desktop : 1280px+
```

---

## Task 8.4 — Token refresh edge case

Verify access token refresh works during:

```
✓ Expired token on page load
✓ Token expiry mid-session (during API call)
✓ Concurrent requests during refresh (only one refresh call fires)
```

---

## Phase 8 — Definition of Done (= Frontend Complete)

```
✓ All pages from phases 1-7 implemented
✓ Loading/error/empty states on all data pages
✓ SSE notification working end-to-end
✓ Admin panel fully functional
✓ Token refresh transparent to user
✓ Responsive on mobile + desktop
✓ No hardcoded API URLs (use NEXT_PUBLIC_API_URL)
✓ No business logic in components
✓ No fetch() calls directly in components (use TanStack Query)
```

---

End of PLAYBOOK-WEB.md — v1.0
