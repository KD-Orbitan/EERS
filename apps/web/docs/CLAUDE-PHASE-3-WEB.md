# CLAUDE-PHASE-3-WEB.md
# Agent Instructions: Review Feature Implementation
# EERS Frontend — Phase 3

**Project:** Enterprise Evaluation & Ranking System (EERS)  
**Agent Mode:** Full autonomous (vibe coding with requirements guidance)  
**Phase:** 3 — Review Feature (Write, View, Reply, Report)  
**Monorepo:** pnpm + Turborepo  

---

## OVERVIEW

You are implementing the **Review Feature** for EERS frontend. This is a **requirements-only guide** — you will implement independently, not from copy-paste code.

**Phase 3 Scope:**
1. Zod schemas for reviews, replies, reports
2. TanStack Query hooks (4 queries, 7 mutations)
3. React components (7 UI pieces)
4. Pages (/reviews/my, embed in /businesses/:id)
5. Design tokens integration (colors, typography, spacing, components)

**Critical:** All implementations use the existing `apiClient` (axios + JWT interceptors), TanStack Query v5, and design tokens from `app/lib/tokens/`.

---

## PART 1: VERIFICATION & AUDIT (BEFORE YOU START)

### 1.1 Backend Status Check
Before writing any frontend code, verify backend readiness:

```bash
# In apps/api directory:
curl -X GET http://localhost:3000/api/v1/businesses \
  -H "Authorization: Bearer <valid_token>"

# Expected: 200 OK with businesses array
```

**Endpoints to verify exist:**
- `POST /reviews` (create review)
- `GET /reviews/my` (user's reviews)
- `GET /reviews/:reviewId` (single review)
- `PATCH /reviews/:reviewId` (update review)
- `DELETE /reviews/:reviewId` (delete review)
- `POST /reviews/:reviewId/reply` (business owner reply)
- `GET /reviews/:reviewId/reply` (get reply)
- `PATCH /replies/:replyId` (update reply)
- `DELETE /replies/:replyId` (delete reply)
- `GET /businesses/:businessId/reviews` (paginated reviews)
- `GET /businesses/:businessId/review-statistics` (stats)
- `POST /reports` (report review)

**If any endpoint is missing**, stop and inform Orbitan — do NOT mock responses.

### 1.2 Frontend Structure Audit
Verify these files/folders exist:
apps/web/
├── app/
│ ├── lib/
│ │ ├── api-client.ts ✅ (axios instance)
│ │ ├── query-keys.ts ✅ (TanStack Query keys)
│ │ ├── get-error-message.ts ✅ (error handler)
│ │ ├── tokens/ ✅ (design tokens)
│ │ └── hooks/
│ │ ├── use-auth.ts ✅ (get current user)
│ │ └── index.ts
│ ├── features/
│ │ ├── auth/ ✅
│ │ ├── business/ ✅
│ │ └── review/ (NEW — create this)
│ ├── (main)/ (main layout)
│ └── middleware.ts ✅ (route protection)
├── components/
│ └── ui/ ✅ (shadcn/ui)
└── package.json ✅
**Action:** If any critical file is missing, stop and report.

### 1.3 Dependencies Check
Verify installed:
```bash
cd apps/web
pnpm ls | grep -E "react-query|@tanstack/react-query|zod|axios|sonner"
```

**Required:**
- `@tanstack/react-query@^5.x`
- `zod@^3.x`
- `axios@^1.x`
- `sonner@^1.x`

If missing, run:
```bash
pnpm add zod@latest sonner@latest
```

---

## PART 2: IMPLEMENTATION TASKS

### Task 2.1: Create Zod Schemas
**File:** `apps/web/app/lib/schemas/review.schemas.ts`

**Requirements:**
- `CreateReviewSchema`
  - `businessId: number` (required, positive)
  - `rating: number` (required, 1-5)
  - `criteria_ratings: Array<{ criterionId: number, rating: number }>` (optional, each rating 1-5)
  - `text: string` (optional, max 2000 chars)

- `UpdateReviewSchema`
  - All fields from CreateReviewSchema, all optional

- `ReplySchema`
  - `text: string` (required, non-empty, max 1000 chars)

- `ReportSchema`
  - `reviewId: number` (required)
  - `reason: string` (required, one of: 'spam', 'abuse', 'fake', 'inappropriate')
  - `description: string` (optional, max 500 chars)

**Implementation Notes:**
- Use `.refine()` for complex validation (e.g., rating must be 1-5)
- Export types as `z.infer<typeof Schema>`
- No copy-paste — use Zod documentation patterns you know

### Task 2.2: Create Query Hooks
**File:** `apps/web/app/features/review/hooks/queries.ts`

**Hooks to create (4 total):**

1. **useReviewsQuery**
   - Endpoint: `GET /reviews/my`
   - Returns: User's reviews (paginated)
   - Used in: `/reviews/my` page
   - Error handling: Show toast on failure

2. **useBusinessReviewsQuery(businessId: number, page?: number, limit?: number)**
   - Endpoint: `GET /businesses/:businessId/reviews?page=X&limit=Y`
   - Returns: Paginated reviews for a business
   - Used in: Business detail page review section
   - Pagination support: page & limit params

3. **useReviewDetailQuery(reviewId: number)**
   - Endpoint: `GET /reviews/:reviewId`
   - Returns: Single review with user, reply (if exists)
   - Used in: Review modal/detail view
   - Conditional: Only fetch if `reviewId` is truthy

4. **useBusinessReviewStatisticsQuery(businessId: number)**
   - Endpoint: `GET /businesses/:businessId/review-statistics`
   - Returns: `{ count: number, averageRating: number, ratings: {...} }`
   - Used in: Business detail header (show avg rating)
   - Conditional: Only fetch if `businessId` is truthy

**Implementation Notes:**
- Use `apiClient` (from `app/lib/api-client.ts`)
- Use query keys from `app/lib/query-keys.ts` (add missing keys if needed)
- `enabled` option for conditional queries
- `staleTime: 5 * 60 * 1000` (5 min cache)
- Return `useQuery(...)` hook, not raw data

### Task 2.3: Create Mutation Hooks
**File:** `apps/web/app/features/review/hooks/mutations.ts`

**Mutations to create (7 total):**

1. **useCreateReviewMutation(businessId: number)**
   - POST `/reviews`
   - Payload: CreateReviewSchema data
   - Success: Show toast "Review posted", invalidate `BUSINESS_REVIEWS(businessId)` + `MY_REVIEWS`
   - Error: Show toast with error message

2. **useUpdateReviewMutation(reviewId: number)**
   - PATCH `/reviews/:reviewId`
   - Payload: UpdateReviewSchema data (partial)
   - Success: Invalidate `REVIEW_DETAIL(reviewId)` + `MY_REVIEWS`
   - Error: Show toast

3. **useDeleteReviewMutation(reviewId: number, businessId: number)**
   - DELETE `/reviews/:reviewId`
   - No payload
   - Success: Invalidate `MY_REVIEWS` + `BUSINESS_REVIEWS(businessId)`
   - Error: Show toast

4. **useCreateReplyMutation(reviewId: number)**
   - POST `/reviews/:reviewId/reply`
   - Payload: ReplySchema (businessId from auth context or route)
   - Success: Invalidate `REVIEW_DETAIL(reviewId)`
   - Error: Show toast "Only business owners can reply"

5. **useUpdateReplyMutation(replyId: number, reviewId: number)**
   - PATCH `/replies/:replyId`
   - Payload: `{ text: string }`
   - Success: Invalidate `REVIEW_DETAIL(reviewId)`
   - Error: Show toast

6. **useDeleteReplyMutation(replyId: number, reviewId: number)**
   - DELETE `/replies/:replyId`
   - No payload
   - Success: Invalidate `REVIEW_DETAIL(reviewId)`
   - Error: Show toast

7. **useReportReviewMutation**
   - POST `/reports`
   - Payload: ReportSchema
   - Success: Show toast "Report submitted, thank you"
   - Error: Show toast

**Implementation Notes:**
- Use `useMutation` from TanStack Query
- `onSuccess` callback for invalidation + toasts
- `onError` callback for error toasts
- Extract error message via `getErrorMessage(error)`
- Return `{ mutate, isPending, error }` (or full hook object)

### Task 2.4: Create Components
**File:** `apps/web/app/features/review/components/`

**Components to create (7 total):**

1. **review-card.tsx**
   - Displays: Author avatar, name, rating (stars), text, date, reply badge (if exists)
   - Props: `review: Review`, `onEdit?: () => void`, `onDelete?: () => void`, `onReport?: () => void`
   - Features:
     - Clickable author name (link to user profile, if available)
     - Star rating display (1-5 filled stars)
     - Truncate text with "Read more" expand (max 3 lines initially)
     - Show blue "Company Response" badge if reply exists
     - Action buttons (Edit/Delete for owner, Report for others)
   - Design: Use `components.card` token, `colors.text`, `spacing.md`

2. **review-list.tsx**
   - Displays: List of review cards
   - Props: `reviews: Review[]`, `onReviewClick?: (reviewId) => void`, `isLoading: boolean`, `pagination?: { page, total, pages }`
   - Features:
     - Map reviews to review-card
     - Show "No reviews" message if empty
     - Pagination controls if `pagination` provided
     - Loading skeleton if `isLoading`
   - Design: Use `spacing.lg` between cards

3. **write-review-form.tsx**
   - Displays: Form with overall rating, criteria ratings (if available), text area
   - Props: `businessId: number`, `onSubmit: (data) => Promise<void>`, `initialValues?: Review`, `isLoading: boolean`
   - Features:
     - Overall rating: 5-star input (1-5, interactive)
     - Criteria ratings: Multiple 5-star inputs (one per criterion from business)
     - Text area: Max 2000 chars, char counter
     - Submit button: "Post Review" (or "Save" if editing)
     - Cancel button
   - Validation: Use CreateReviewSchema with `onSubmit`
   - Design: Use `components.input`, `colors.primary`, `spacing.md`

4. **criteria-rating-input.tsx**
   - Displays: Single criterion name + 5-star input
   - Props: `criterionName: string`, `value: number`, `onChange: (rating) => void`, `disabled: boolean`
   - Features:
     - Show criterion name
     - Interactive 5 stars (hover effect, click to select)
     - Display selected rating (e.g., "4/5")
   - Design: Use `colors.warning` for stars, `typography.caption` for name

5. **reply-form.tsx**
   - Displays: Text area for business owner reply
   - Props: `reviewId: number`, `onSubmit: (text) => Promise<void>`, `isLoading: boolean`, `initialText?: string`
   - Features:
     - Text area: Max 1000 chars, char counter
     - Submit button: "Post Reply"
     - Cancel button
   - Validation: Use ReplySchema
   - Design: Use `components.input`, `colors.secondary`

6. **report-modal.tsx**
   - Displays: Modal with reason selector + description text area
   - Props: `isOpen: boolean`, `reviewId: number`, `onClose: () => void`, `onSubmit: (reason, desc) => Promise<void>`, `isLoading: boolean`
   - Features:
     - Dropdown/radio: Reason (spam, abuse, fake, inappropriate)
     - Text area: Description (optional, max 500 chars)
     - Submit button: "Submit Report"
     - Cancel button
   - Design: Use shadcn/ui Dialog, `components.input`

7. **star-rating.tsx** (Reusable)
   - Displays: 1-5 interactive stars
   - Props: `value: number`, `onChange: (rating) => void`, `readOnly?: boolean`, `size?: 'sm' | 'md' | 'lg'`
   - Features:
     - Hover effect (highlight stars)
     - Click to set rating
     - Display current rating value
   - Design: Use `colors.warning` (yellow stars), `spacing.xs` between stars

**Implementation Notes:**
- Import design tokens: `import { colors, typography, spacing, components } from '@/app/lib/tokens'`
- Use shadcn/ui components: Button, Dialog, Input, Textarea (if available)
- All components are **presentational** (no hooks, only Props + JSX)
- Use TypeScript: type all Props as `interface ReviewCardProps { ... }`
- No hardcoded strings: Extract to constants if repeated

### Task 2.5: Create Pages
**File:** `apps/web/app/(main)/reviews/` and embed in business detail

**Pages to create (2 total):**

1. **apps/web/app/(main)/reviews/my/page.tsx** (`/reviews/my`)
   - Displays: User's reviews
   - Features:
     - Load `useReviewsQuery()`
     - Show loading state
     - List reviews with `review-list.tsx`
     - Each review card has Edit/Delete buttons (owner only)
     - Edit button: Open modal/navigate to edit page (TODO: Phase 3.5+)
     - Delete button: Show confirmation + call `useDeleteReviewMutation()`
     - Click review: Show detail modal (TODO: Phase 3.5+)
   - Page title: "My Reviews"
   - No reviews message: "You haven't written any reviews yet"
   - Design: Use `components.card`, `spacing.lg` for layout

2. **Embed in business detail** (`/businesses/:id`)
   - Displays: "Verified Reviews" section (from Figma)
   - Features:
     - Load `useBusinessReviewsQuery(businessId, 1, 5)` (first 5 reviews)
     - Load `useBusinessReviewStatisticsQuery(businessId)` for avg rating
     - Show stats: "4.5★ (23 reviews)"
     - List reviews with `review-list.tsx`
     - "View all reviews" link to dedicated reviews page (TODO: Phase 3.5+)
     - Write review button: Link to `/businesses/:id/write-review` (TODO: Phase 3.5+)
   - Design: Place below business info, use `spacing.xl` margin
   - **Note:** Embed section in existing `/businesses/:id` page, do NOT create new page yet

**Implementation Notes:**
- Use `useRouter()` and `useParams()` from Next.js
- Auth check: If not logged in, show "Sign in to write a review"
- Error handling: Show error toast, not error page
- Type imports: Use review types from `@eers/shared-types` (or define locally if needed)

### Task 2.6: Add Query Keys
**File:** `apps/web/app/lib/query-keys.ts`

**Add these keys:**
```typescript
REVIEWS: ['reviews'],
REVIEW_DETAIL: (id: number) => ['reviews', id],
MY_REVIEWS: ['reviews', 'my'],
// Update existing BUSINESS_REVIEWS if not already there
BUSINESS_REVIEWS: (id: number) => ['businesses', id, 'reviews'],
BUSINESS_STATS: (id: number) => ['businesses', id, 'stats'],
REPORTS: ['reports'],
```

---

## PART 3: VALIDATION CHECKLIST (BEFORE COMPLETION)

After implementing all components/hooks, verify:

### 3.1 Type Safety
```bash
cd apps/web
pnpm tsc --noEmit
# Should have 0 errors
```

### 3.2 Lint
```bash
pnpm lint
# Should pass
```

### 3.3 Functional Testing
- [ ] Login → Create review → Check /reviews/my displays it
- [ ] Edit review → Verify changes appear
- [ ] Delete review → Verify it's removed from list
- [ ] Business detail → Review section shows latest reviews
- [ ] Report review → Modal opens, submit works
- [ ] Create reply (as business owner) → Badge appears on review
- [ ] Delete reply → Badge disappears
- [ ] Pagination → Navigate between pages in review list

### 3.4 Design Tokens
- [ ] All colors use `colors.*` from tokens
- [ ] All typography uses `typography.*`
- [ ] All spacing uses `spacing.*`
- [ ] Star rating component uses `colors.warning`
- [ ] Response badge uses `colors.secondary` or `colors.success`
- [ ] Error messages use `colors.error`

### 3.5 API Integration
- [ ] All endpoints called through `apiClient` (not direct fetch/axios)
- [ ] Refresh token logic works (test by refreshing page)
- [ ] Error messages extracted via `getErrorMessage(error)`
- [ ] Toasts show on success/error

---

## PART 4: CRITICAL RULES (NON-NEGOTIABLE)

1. **Access Token:** Memory only, never localStorage
2. **Refresh Token:** HttpOnly cookie (withCredentials: true in apiClient)
3. **API Calls:** Through `apiClient` (app/lib/api-client.ts)
4. **Data Fetching:** TanStack Query (useQuery/useMutation)
5. **Styling:** Use tokens from `app/lib/tokens/`, NOT hardcoded colors/sizes
6. **Error Handling:** Show toast (sonner), don't log sensitive data
7. **Query Invalidation:** Precise key targets, not blanket invalidations
8. **TypeScript:** All Props have interfaces, strict mode enabled
9. **Component Design:** Presentational (no hooks except custom hooks from features/)
10. **Package Manager:** Use pnpm, not npm

---

## PART 5: REPORTING

When complete, report:

1. **Tasks Completed** (2.1–2.6)
   - List each task: ✅ Zod Schemas, ✅ Queries, etc.

2. **Files Created** (with line counts)
   - `app/lib/schemas/review.schemas.ts` (X lines)
   - `app/features/review/hooks/queries.ts` (X lines)
   - `app/features/review/hooks/mutations.ts` (X lines)
   - `app/features/review/components/*.tsx` (X files, X total lines)
   - `app/(main)/reviews/my/page.tsx` (X lines)
   - Updated: `app/lib/query-keys.ts` (X lines)

3. **Verification Results** (Part 3)
   - tsc --noEmit: ✅ Pass
   - pnpm lint: ✅ Pass
   - Manual tests: ✅ All pass
   - Design tokens: ✅ All applied

4. **Known Limitations** (if any)
   - E.g., "Edit review form not yet created (Phase 3.5+)"
   - "Review detail modal deferred (Phase 3.5+)"

5. **Next Phase Recommendations**
   - E.g., "Create /businesses/:id/write-review page"
   - "Implement review filtering (approved/pending/rejected)"

---

## ENTRY POINT

You are ready to start. Begin with:

1. **Part 1:** Verify backend + frontend structure
2. **Part 2:** Implement tasks 2.1–2.6 in order
3. **Part 3:** Run validation checklist
4. **Part 4:** Report completion

Do NOT skip verification. Do NOT hardcode values. Do NOT copy-paste code from web search.

**Start now.** 🚀

---

## REFERENCE FILES (copy path into view tool if needed)
- `/mnt/project/API.md` — Review endpoints
- `/mnt/project/PLAYBOOK-WEB.md` — Phase 3 spec (~430-506 lines)
- `/mnt/project/SCHEMA.md` — Database schema
- `/mnt/project/DECISIONS.md` — Business rules

Good luck! 💪