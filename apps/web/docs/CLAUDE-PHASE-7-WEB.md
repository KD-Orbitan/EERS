# PHASE 7 CONTEXT: Admin Feature
# EERS Frontend — Project Continuation

**Project:** Enterprise Evaluation & Ranking System (EERS)  
**Status:** Phase 1-6 complete  
**Current Chat:** Starting Phase 7 (Admin)  
**Monorepo:** pnpm + Turborepo  
- Backend: `apps/api` (NestJS, http://localhost:3000/api/v1)
- Frontend: `apps/web` (Next.js 16.2.12, http://localhost:3001)

---

## AVAILABLE BACKEND ENDPOINTS (From Nest Logs)

**Admin Endpoints (Only what's implemented):**

POST /api/v1/admin/businesses/:businessId/approve → Approve business
POST /api/v1/admin/businesses/:businessId/reject → Reject business
POST /api/v1/admin/reviews/:reviewId/approve → Approve review
POST /api/v1/admin/reviews/:reviewId/reject → Reject review
GET /api/v1/admin/scoring-config → Get scoring config
PATCH /api/v1/admin/scoring-config → Update scoring config
GET /api/v1/admin/criterion-weights/:categoryId → Get weights for category
PATCH /api/v1/admin/criterion-weights/:categoryId/:criterionId → Update weight
POST /api/v1/admin/rankings/recalculate → Trigger ranking recalculation


**Note:** No user ban, category management, or report queue endpoints → skip those.

---

## PHASE 7 TASKS (HIGH-LEVEL)

### Task 7.1: Create Queries
- useBusinessesForApprovalQuery (GET /businesses with filter: status=pending)
- useReviewsForApprovalQuery (GET /reviews/my with filter, or endpoint to fetch pending)
- useScoringConfigQuery (GET /admin/scoring-config)
- useCategoryWeightsQuery (GET /admin/criterion-weights/:categoryId)

### Task 7.2: Create Mutations
- useApprovBusinessMutation (POST /admin/businesses/:id/approve)
- useRejectBusinessMutation (POST /admin/businesses/:id/reject)
- useApproveReviewMutation (POST /admin/reviews/:id/approve)
- useRejectReviewMutation (POST /admin/reviews/:id/reject)
- useUpdateScoringConfigMutation (PATCH /admin/scoring-config)
- useUpdateCriterionWeightMutation (PATCH /admin/criterion-weights/:categoryId/:criterionId)
- useTriggerRankingRecalculationMutation (POST /admin/rankings/recalculate)

### Task 7.3: Create Components
- business-moderation-table.tsx (list pending businesses + approve/reject)
- review-moderation-table.tsx (list pending reviews + approve/reject)
- scoring-config-form.tsx (edit scoring config)
- criterion-weights-form.tsx (edit weights for category)
- admin-sidebar.tsx (navigation sidebar)
- reject-modal.tsx (shared reject reason modal)

### Task 7.4: Create Pages
- /admin (dashboard)
- /admin/businesses (pending businesses)
- /admin/reviews (pending reviews)
- /admin/settings/scoring (scoring config)
- /admin/settings/weights/:categoryId (criterion weights)
- /admin/layout.tsx (sidebar layout)

---

## API RESPONSE SHAPES

### Approve/Reject Business/Review
```json
{
  "success": true,
  "message": "Business approved successfully"
}
```

### Scoring Config
```json
{
  "success": true,
  "data": {
    "id": number,
    "fraudDetectionWeight": number (0-1),
    "trustScoreWeight": number (0-1),
    "reviewCountWeight": number (0-1),
    "ratingWeight": number (0-1),
    "criteriaWeight": number (0-1),
    "updatedAt": ISO date
  }
}
```

### Criterion Weights
```json
{
  "success": true,
  "data": {
    "categoryId": number,
    "criteria": [
      {
        "criterionId": number,
        "weight": number (0-1),
        "criterion": { "id": number, "name": string }
      }
    ]
  }
}
```

---

## ENTRY POINT FOR PHASE 7

Use **CLAUDE-PHASE-7-WEB.md** prompt (below).

---

Ready for Phase 7! 🚀
# CLAUDE-PHASE-7-WEB.md
# Agent Instructions: Admin Feature Implementation
# EERS Frontend — Phase 7

**Project:** Enterprise Evaluation & Ranking System (EERS)  
**Agent Mode:** Full autonomous  
**Phase:** 7 — Admin (Moderation, Scoring Config, Ranking Recalculation)  

---

## OVERVIEW

Implement **Admin** feature: moderation (approve/reject businesses & reviews), scoring config, criterion weights, ranking recalculation.

**Phase 7 Scope:**
1. Zod schemas (2 schemas: RejectReasonSchema, ScoringConfigSchema)
2. TanStack Query hooks (4 queries, 7 mutations)
3. React components (6 components)
4. Pages (5 pages + admin layout)
5. Design tokens integration
6. Role-based protection (ADMIN only)

---

## PART 1: VERIFICATION & AUDIT

### 1.1 Backend Check
```bash
# Verify admin endpoints live
curl -X GET http://localhost:3000/api/v1/admin/scoring-config \
  -H "Authorization: Bearer <admin_token>"

curl -X POST http://localhost:3000/api/v1/admin/businesses/1/approve \
  -H "Authorization: Bearer <admin_token>"

curl -X POST http://localhost:3000/api/v1/admin/rankings/recalculate \
  -H "Authorization: Bearer <admin_token>"
```

**Expected:** 200 OK or 400+ error (not 404).

**If 403 Forbidden:** Verify token is ADMIN role.

### 1.2 Frontend Structure

apps/web/
├── app/
│ ├── features/
│ │ └── admin/ (NEW — create this)
│ ├── (admin)/ (NEW — create this)
│ │ └── admin/
│ └── middleware.ts ✅ (update to protect /admin/*)
└── lib/tokens/ ✅


### 1.3 Middleware Check
```bash
cat apps/web/app/middleware.ts
```

**Must protect:** `/admin/*` routes → redirect to / if not ADMIN role.

---

## PART 2: IMPLEMENTATION TASKS

### Task 2.1: Create Zod Schemas
**File:** `apps/web/app/lib/schemas/admin.schemas.ts`

**Schemas:**

1. **RejectReasonSchema**
   - `reason: string` (min 10, max 500)
   - Used for business & review rejection

2. **ScoringConfigSchema**
   - `fraudDetectionWeight: number` (0-1)
   - `trustScoreWeight: number` (0-1)
   - `reviewCountWeight: number` (0-1)
   - `ratingWeight: number` (0-1)
   - `criteriaWeight: number` (0-1)
   - Validate: Sum of weights should equal 1 (or close, use .refine())

3. **CriterionWeightSchema**
   - `weight: number` (0-1)

**Implementation Notes:**
- Use `.refine()` for weight validation
- Export types

### Task 2.2: Create Query Hooks
**File:** `apps/web/app/features/admin/hooks/queries.ts`

**Queries (4 total):**

1. **useBusinessesForApprovalQuery**
   - Endpoint: `GET /businesses?status=pending` (or similar filter)
   - Returns: Pending businesses
   - Used in: /admin/businesses
   - Cache: `staleTime: 2 * 60 * 1000` (2 min, changes often)

2. **useReviewsForApprovalQuery**
   - Endpoint: `GET /businesses/:businessId/reviews?status=pending` or `GET /reviews?status=pending`
   - Returns: Pending reviews
   - Used in: /admin/reviews
   - Cache: `staleTime: 2 * 60 * 1000`

3. **useScoringConfigQuery**
   - Endpoint: `GET /admin/scoring-config`
   - Returns: Scoring weights
   - Used in: /admin/settings/scoring
   - Cache: `staleTime: 30 * 60 * 1000` (30 min)

4. **useCategoryWeightsQuery(categoryId: number)**
   - Endpoint: `GET /admin/criterion-weights/:categoryId`
   - Returns: Criterion weights for category
   - Used in: /admin/settings/weights/:categoryId
   - Cache: `staleTime: 30 * 60 * 1000`

**Implementation Notes:**
- Use `apiClient`
- Handle 403 error (not admin)
- Return `useQuery(...)`

### Task 2.3: Create Mutation Hooks
**File:** `apps/web/app/features/admin/hooks/mutations.ts`

**Mutations (7 total):**

1. **useApproveBusinessMutation(businessId: number)**
   - POST `/admin/businesses/:businessId/approve`
   - Success: Invalidate BUSINESSES query, show toast
   - Error: Show error toast

2. **useRejectBusinessMutation(businessId: number)**
   - POST `/admin/businesses/:businessId/reject`
   - Payload: RejectReasonSchema
   - Success: Invalidate BUSINESSES query, show toast
   - Error: Show error toast

3. **useApproveReviewMutation(reviewId: number)**
   - POST `/admin/reviews/:reviewId/approve`
   - Success: Invalidate REVIEWS query, show toast
   - Error: Show error toast

4. **useRejectReviewMutation(reviewId: number)**
   - POST `/admin/reviews/:reviewId/reject`
   - Payload: RejectReasonSchema
   - Success: Invalidate REVIEWS query, show toast
   - Error: Show error toast

5. **useUpdateScoringConfigMutation**
   - PATCH `/admin/scoring-config`
   - Payload: ScoringConfigSchema
   - Success: Invalidate scoring-config query, show toast, show confirmation (weights updated)
   - Error: Show error toast

6. **useUpdateCriterionWeightMutation(categoryId: number, criterionId: number)**
   - PATCH `/admin/criterion-weights/:categoryId/:criterionId`
   - Payload: CriterionWeightSchema
   - Success: Invalidate weights query, show toast
   - Error: Show error toast

7. **useTriggerRankingRecalculationMutation**
   - POST `/admin/rankings/recalculate`
   - Success: Show toast "Ranking recalculation triggered"
   - Error: Show error toast

**Implementation Notes:**
- Use `useMutation`
- All mutations protected (403 if not admin)
- Show loading state
- Invalidate specific queries

### Task 2.4: Create Components
**File:** `apps/web/app/features/admin/components/`

**Components (6 total):**

1. **business-moderation-table.tsx**
   - Displays: Table of pending businesses
   - Props: `businesses: Business[]`, `isLoading: boolean`, `onApprove: (id) => Promise<void>`, `onReject: (id, reason) => Promise<void>`
   - Features:
     - Columns: Name, Category, Created Date, Status (Pending badge)
     - Action buttons: Approve, Reject
     - Reject opens reject-modal (enter reason)
     - Show loading state on buttons
   - Design: Use `components.table`, `colors.warning` for pending badge

2. **review-moderation-table.tsx**
   - Displays: Table of pending reviews
   - Props: `reviews: Review[]`, `isLoading: boolean`, `onApprove: (id) => void`, `onReject: (id, reason) => void`
   - Features:
     - Columns: Author, Business, Rating, Text (truncated), Date, Status
     - Action buttons: Approve, Reject
     - Reject opens reject-modal
   - Design: Similar to business table

3. **reject-modal.tsx**
   - Displays: Modal to enter rejection reason
   - Props: `isOpen: boolean`, `onClose: () => void`, `onSubmit: (reason: string) => Promise<void>`, `isLoading: boolean`
   - Features:
     - Text area: Rejection reason (required, min 10 chars)
     - Char counter (max 500)
     - Submit button: "Reject"
     - Cancel button
   - Design: Use shadcn/ui Dialog, `components.input`

4. **scoring-config-form.tsx**
   - Displays: Form to edit scoring weights
   - Props: `config: ScoringConfig`, `onSubmit: (data) => Promise<void>`, `isLoading: boolean`
   - Features:
     - 5 number inputs (0-1 range) with sliders
     - Show weight name + description
     - Show sum of weights (should be ~1.0)
     - Submit button: "Save Config"
     - Cancel button
     - Validation: Use ScoringConfigSchema
   - Design: Use range sliders (HTML5 or shadcn), `spacing.md`

5. **criterion-weights-form.tsx**
   - Displays: Form to edit weights for criteria in category
   - Props: `categoryId: number`, `weights: CriterionWeight[]`, `onSave: (criterionId, weight) => Promise<void>`, `isLoading: boolean`
   - Features:
     - List each criterion with:
       - Name
       - Slider (0-1)
       - Current weight %
     - Submit button for each criterion (or Save All)
     - Show sum of criterion weights
   - Design: Use sliders, `spacing.md`

6. **admin-sidebar.tsx**
   - Displays: Navigation sidebar for admin panel
   - Props: `currentPath: string`
   - Features:
     - Links to:
       - /admin (Dashboard)
       - /admin/businesses (Pending Businesses)
       - /admin/reviews (Pending Reviews)
       - /admin/settings/scoring (Scoring Config)
       - /admin/settings/weights (Criterion Weights — with category selector)
     - Highlight active link
     - Show admin badge
   - Design: Vertical sidebar, `spacing.md`, `colors.primary` for active link

**Implementation Notes:**
- Presentational
- TypeScript: type all Props
- Use shadcn/ui components
- Import design tokens

### Task 2.5: Create Pages
**File:** `apps/web/app/(admin)/admin/`

**Pages (5 total):**

1. **apps/web/app/(admin)/admin/layout.tsx** (`/admin`)
   - Layout for all admin pages
   - Features:
     - Show admin-sidebar on left
     - Content area on right
     - Check auth + role (redirect to / if not ADMIN)
   - Design: Horizontal split layout

2. **apps/web/app/(admin)/admin/page.tsx** (`/admin`)
   - Displays: Admin dashboard
   - Features:
     - Stats cards:
       - Pending businesses count
       - Pending reviews count
       - Last ranking update
     - Quick links to moderation pages
     - Button: "Trigger Ranking Recalculation"
   - Call `useTriggerRankingRecalculationMutation()` on click
   - Design: Grid layout, `spacing.lg` between cards

3. **apps/web/app/(admin)/admin/businesses/page.tsx** (`/admin/businesses`)
   - Displays: Pending businesses moderation
   - Features:
     - Load `useBusinessesForApprovalQuery()`
     - Show business-moderation-table
     - Use `useApproveBusinessMutation()` + `useRejectBusinessMutation()`
     - On approve/reject: Refresh table
   - Page title: "Pending Businesses"
   - Design: Full-width table

4. **apps/web/app/(admin)/admin/reviews/page.tsx** (`/admin/reviews`)
   - Displays: Pending reviews moderation
   - Features:
     - Load `useReviewsForApprovalQuery()`
     - Show review-moderation-table
     - Use `useApproveReviewMutation()` + `useRejectReviewMutation()`
   - Page title: "Pending Reviews"
   - Design: Full-width table

5. **apps/web/app/(admin)/admin/settings/page.tsx** or split:
   - **apps/web/app/(admin)/admin/settings/scoring/page.tsx** (`/admin/settings/scoring`)
     - Displays: Scoring config form
     - Features:
       - Load `useScoringConfigQuery()`
       - Show scoring-config-form with current values
       - Call `useUpdateScoringConfigMutation()` on submit
       - On success: Show confirmation toast
     - Page title: "Scoring Configuration"

   - **apps/web/app/(admin)/admin/settings/weights/page.tsx** or `/weights/[categoryId]/page.tsx** (`/admin/settings/weights/:categoryId`)
     - Displays: Criterion weights form for selected category
     - Features:
       - Category selector (dropdown of all categories)
       - Load `useCategoryWeightsQuery(categoryId)`
       - Show criterion-weights-form
       - Call `useUpdateCriterionWeightMutation()` on save
       - On success: Show toast
     - Page title: "Criterion Weights"

**Implementation Notes:**
- All pages in `(admin)` layout group
- Route protection via middleware: redirect to / if not ADMIN
- Handle loading/error states
- Show confirmation modals for destructive actions
- Responsive: sidebar collapses on mobile

### Task 2.6: Update Middleware
**File:** `apps/web/app/middleware.ts`

**Add protection:**
```typescript
// Protect /admin/* routes
// If not authenticated → redirect to /login
// If authenticated but role !== 'ADMIN' → redirect to /
```

### Task 2.7: Add Query Keys
**File:** `apps/web/app/lib/query-keys.ts`

**Add:**
```typescript
ADMIN_BUSINESSES: ['admin', 'businesses'],
ADMIN_REVIEWS: ['admin', 'reviews'],
ADMIN_SCORING_CONFIG: ['admin', 'scoring-config'],
ADMIN_CRITERION_WEIGHTS: (categoryId: number) => ['admin', 'weights', categoryId],
```

---

## PART 3: VALIDATION CHECKLIST

### 3.1 Type Safety
```bash
cd apps/web
pnpm tsc --noEmit
# Should be 0 errors
```

### 3.2 Lint
```bash
pnpm lint
# Should pass
```

### 3.3 Functional Testing (Requires admin account)
- [ ] /admin/businesses loads pending businesses
- [ ] Approve business → status updated
- [ ] Reject business → modal opens, reason required, business rejected
- [ ] /admin/reviews loads pending reviews
- [ ] Approve/reject review works
- [ ] /admin/settings/scoring shows current config
- [ ] Update scoring weights → saved + toast
- [ ] /admin/settings/weights shows category selector + criterion weights
- [ ] Update criterion weight → saved
- [ ] /admin dashboard shows stats + trigger recalculation button
- [ ] Non-admin users redirect to / when accessing /admin/*
- [ ] Non-authenticated users redirect to /login
- [ ] Sidebar highlights active page

### 3.4 Design Tokens
- [ ] All colors use `colors.*`
- [ ] All typography uses `typography.*`
- [ ] All spacing uses `spacing.*`
- [ ] Pending badge uses `colors.warning`
- [ ] Approved badge uses `colors.success`
- [ ] Buttons use `components.button`

### 3.5 API Integration
- [ ] All calls through `apiClient`
- [ ] 403 errors handled (show "Admin access required")
- [ ] Toasts show on success/error
- [ ] Query invalidation refreshes tables

---

## PART 4: CRITICAL RULES

1. **Access Token:** Memory only
2. **Refresh Token:** HttpOnly cookie
3. **API Calls:** Through `apiClient`
4. **Data Fetching:** TanStack Query only
5. **Styling:** Use tokens
6. **Error Handling:** Toast (sonner)
7. **Role Protection:** Via middleware + route guards in components
8. **TypeScript:** Strict mode
9. **Components:** Presentational
10. **Package Manager:** pnpm

---

## PART 5: REPORTING

When complete, report:

1. **Tasks Completed**
   - ✅ Zod Schemas
   - ✅ Queries (4 hooks)
   - ✅ Mutations (7 hooks)
   - ✅ Components (6 UI pieces)
   - ✅ Pages (5 pages + layout)
   - ✅ Middleware update
   - ✅ Query Keys

2. **Files Created** (with line counts)
   - `app/lib/schemas/admin.schemas.ts` (X lines)
   - `app/features/admin/hooks/queries.ts` (X lines)
   - `app/features/admin/hooks/mutations.ts` (X lines)
   - `app/features/admin/components/*.tsx` (X files, X lines total)
   - `app/(admin)/admin/layout.tsx` (X lines)
   - `app/(admin)/admin/page.tsx` (X lines)
   - `app/(admin)/admin/businesses/page.tsx` (X lines)
   - `app/(admin)/admin/reviews/page.tsx` (X lines)
   - `app/(admin)/admin/settings/scoring/page.tsx` (X lines)
   - `app/(admin)/admin/settings/weights/page.tsx` (X lines)
   - Updated: `app/middleware.ts` (X lines)
   - Updated: `app/lib/query-keys.ts` (X lines)

3. **Verification Results** (Part 3)
   - tsc --noEmit: ✅
   - pnpm lint: ✅
   - Manual tests: ✅ All pass
   - Design tokens: ✅

4. **Known Limitations**
   - If any (e.g., "Report queue not implemented — no backend endpoint")

5. **Next Phase Recommendations**
   - Phase 8 Hardening

---

## ENTRY POINT

1. **Part 1:** Verify backend + frontend
2. **Part 2:** Implement tasks 2.1–2.7 in order
3. **Part 3:** Run validation
4. **Part 4:** Report

**Start now.** 🚀