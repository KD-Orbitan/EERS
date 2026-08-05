# PHASE 4 CONTEXT: Ranking & Discovery Features
# EERS Frontend — Project Continuation

**Project:** Enterprise Evaluation & Ranking System (EERS)  
**Status:** Phase 1 (Auth) + Phase 2 (Business) + Phase 3 (Review) complete  
**Current Chat:** Starting Phase 4 (Ranking & Discovery)  
**Monorepo:** pnpm + Turborepo  
- Backend: `apps/api` (NestJS, http://localhost:3000/api/v1)
- Frontend: `apps/web` (Next.js 16.2.12, http://localhost:3001)

---

## PHASES 1-3 COMPLETED ✅

### Phase 1: Authentication
- Login/register/logout working
- Access token: memory only
- Refresh token: HttpOnly cookie
- Route protection via middleware.ts

### Phase 2: Business Feature
- Pages: /businesses, /businesses/:id, /businesses/create, /businesses/:id/edit, /businesses/my
- Full CRUD + location management
- Design tokens fully applied

### Phase 3: Review Feature
- Pages: /businesses/:id/reviews, /businesses/:id/reviews/write, /reviews/my
- Write/edit/delete reviews, reply to reviews
- Review summary embedded in business detail
- All queries/mutations working

---

## PHASE 4: RANKING & DISCOVERY

### Goal
Implement ranking system and business discovery features: view rankings, filter by category, search, sort by criteria.

### Available Backend Endpoints (Per Nest Logs)

**Ranking Endpoints:**
GET /api/v1/rankings → List all rankings (paginated)
GET /api/v1/rankings/top → Top businesses by rank
GET /api/v1/rankings/metadata → Ranking metadata (update time, etc)
GET /api/v1/rankings/businesses/:businessId → Single business ranking + position


**Business Endpoints (Already Used):**

GET /api/v1/businesses → List businesses (paginated, searchable)
GET /api/v1/businesses/:businessId → Business detail
GET /api/v1/businesses/my → User's businesses
GET /api/v1/businesses/:businessId/statistics → Business stats


**Category & Criteria Endpoints:**

GET /api/v1/categories → All categories
GET /api/v1/categories/:categoryId → Single category
GET /api/v1/categories/:categoryId/criteria → Criteria for category
GET /api/v1/criteria → All criteria


**Review Stats:**

GET /api/v1/businesses/:businessId/reviews → Business reviews (paginated)
GET /api/v1/businesses/:businessId/review-statistics → Review count + avg rating


---

## PHASE 4 TASKS (HIGH-LEVEL)

### Task 4.1: Create Zod Schemas
- RankingFilterSchema (categoryId?, sortBy?, order?)
- SearchBusinessSchema (query, categoryId?, page?, limit?)

### Task 4.2: Create Queries
- useRankingsQuery (GET /rankings, paginated list)
- useTopRankingsQuery (GET /rankings/top, top 10-20 businesses)
- useBusinessRankingQuery (GET /rankings/businesses/:id, single ranking + position)
- useCategoriesQuery (GET /categories, all categories)
- useCategoryDetailsQuery (GET /categories/:id/criteria, category + criteria list)
- useBusinessSearchQuery (GET /businesses, searchable/filterable)

### Task 4.3: Create Components
- ranking-table.tsx (table: rank, business name, category, overall score, avg rating, review count)
- ranking-card.tsx (card layout for mobile, alt to table)
- category-filter.tsx (dropdown/pills to select category)
- sort-selector.tsx (sort by: overall score, avg rating, review count, newest)
- search-bar.tsx (search businesses by name)
- top-businesses-carousel.tsx (horizontal scroll of top 5 businesses)
- business-ranking-badge.tsx (show rank position + score on business card)
- criteria-breakdown.tsx (show score breakdown by criterion)

### Task 4.4: Create Pages
- /rankings (main ranking list with filters)
- /rankings/[businessId] (redirect to /businesses/:id, or detail view if separate)
- / (homepage with top businesses carousel + featured section)

### Task 4.5: Apply Design Tokens
- All components use tokens from `app/lib/tokens/`
- Table styling, badges, cards consistent with Phase 2-3

---

## API RESPONSE SHAPES (Inferred from Nest Routes)

### Ranking List Response
```json
{
  "success": true,
  "data": [
    {
      "id": number,
      "businessId": number,
      "rank": number,
      "overallScore": number (0-100),
      "categoryId": number,
      "trustScore": number,
      "fraudRisk": number,
      "reviewCount": number,
      "averageRating": number,
      "business": {
        "id": number,
        "name": string,
        "category": { "id": number, "name": string },
        "averageRating": number,
        "reviewCount": number
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "pages": number
    }
  }
}
```

### Single Business Ranking
```json
{
  "success": true,
  "data": {
    "rank": number,
    "overallScore": number,
    "trustScore": number,
    "fraudRisk": number,
    "position": number (rank in category),
    "totalInCategory": number
  }
}
```

### Categories List
```json
{
  "success": true,
  "data": [
    {
      "id": number,
      "name": string,
      "description": string
    }
  ]
}
```

### Category with Criteria
```json
{
  "success": true,
  "data": {
    "id": number,
    "name": string,
    "criteria": [
      {
        "id": number,
        "name": string,
        "description": string,
        "weight": number
      }
    ]
  }
}
```

---

## CRITICAL RULES (FROM PHASES 1-3, STILL ACTIVE)

1. **Access Token:** Memory only (never localStorage)
2. **Refresh Token:** HttpOnly cookie (withCredentials: true)
3. **API Calls:** Through `apiClient` (shared/lib/api-client.ts)
4. **Data Fetching:** TanStack Query (useQuery/useMutation)
5. **No Hardcoded URLs:** Use env vars
6. **Component Structure:** Feature-based (`features/ranking/`)
7. **Styling:** Use tokens from `app/lib/tokens/`
8. **Error Handling:** Show toast, don't log sensitive data
9. **Cache Invalidation:** Precise query key targets

---

## QUERY KEYS (TO ADD)

```typescript
export const QUERY_KEYS = {
  // ... existing keys ...
  
  // Phase 4
  RANKINGS: ['rankings'],
  RANKING_LIST: (filters?: object) => ['rankings', 'list', filters],
  TOP_RANKINGS: ['rankings', 'top'],
  BUSINESS_RANKING: (businessId: number) => ['rankings', 'business', businessId],
  
  CATEGORIES: ['categories'],
  CATEGORY_DETAIL: (categoryId: number) => ['categories', categoryId],
  CATEGORY_CRITERIA: (categoryId: number) => ['categories', categoryId, 'criteria'],
  
  BUSINESS_SEARCH: (query?: string, filters?: object) => ['businesses', 'search', { query, filters }],
}
```

---

## EXISTING INTEGRATIONS

- **use-auth.ts** — get current user
- **business-card.tsx** — may need ranking badge overlay
- **business-detail.tsx** — show ranking position + score breakdown
- **design tokens** — colors, typography, spacing, components
- **middleware.ts** — no new protection needed (rankings are public)

---

## ENVIRONMENT

**Commands:**
```bash
# Start backend
cd apps/api && pnpm dev

# Start frontend
cd apps/web && pnpm dev

# Type check
cd apps/web && pnpm tsc --noEmit

# Lint
cd apps/web && pnpm lint
```

---

## ENTRY POINT FOR PHASE 4

Start with **CLAUDE-PHASE-4-WEB.md** prompt (below).

---

## FILES TO REFERENCE

- `/mnt/project/API.md` — ranking endpoint details
- `/mnt/project/PLAYBOOK-WEB.md` — Phase 4 requirements
- `/mnt/project/SCHEMA.md` — database schema (rankings table)
- `/mnt/project/DECISIONS.md` — ranking algorithm, scoring rules

---

Ready for Phase 4! 🚀
# CLAUDE-PHASE-4-WEB.md
# Agent Instructions: Ranking & Discovery Implementation
# EERS Frontend — Phase 4

**Project:** Enterprise Evaluation & Ranking System (EERS)  
**Agent Mode:** Full autonomous (vibe coding with requirements guidance)  
**Phase:** 4 — Ranking & Discovery (Rankings, Filters, Search, Homepage)  
**Monorepo:** pnpm + Turborepo  

---

## OVERVIEW

You are implementing the **Ranking & Discovery** features for EERS frontend. This is a **requirements-only guide** — you will implement independently.

**Phase 4 Scope:**
1. Zod schemas for ranking filters and search
2. TanStack Query hooks (6 queries)
3. React components (8 UI pieces)
4. Pages (/rankings, homepage with ranking features)
5. Design tokens integration

**Critical:** All implementations use existing `apiClient`, TanStack Query v5, and design tokens.

---

## PART 1: VERIFICATION & AUDIT (BEFORE YOU START)

### 1.1 Backend Status Check
Verify ranking endpoints exist and respond:

```bash
# Verify endpoints live
curl -X GET http://localhost:3000/api/v1/rankings \
  -H "Authorization: Bearer <valid_token>"

curl -X GET http://localhost:3000/api/v1/rankings/top

curl -X GET http://localhost:3000/api/v1/categories

curl -X GET http://localhost:3000/api/v1/businesses
```

**Expected:** 200 OK with valid JSON responses (not 404).

**If any endpoint returns 404 or error**, stop and inform Orbitan.

### 1.2 Frontend Structure Audit
Verify these exist:

apps/web/
├── app/
│ ├── lib/
│ │ ├── query-keys.ts ✅
│ │ ├── tokens/ ✅
│ │ └── api-client.ts ✅
│ ├── features/
│ │ ├── auth/ ✅
│ │ ├── business/ ✅
│ │ ├── review/ ✅
│ │ └── ranking/ (NEW — create this)
│ ├── (main)/
│ │ ├── businesses/ ✅
│ │ ├── reviews/ ✅
│ │ └── rankings/ (NEW — create this)
│ └── middleware.ts ✅
└── components/ui/ ✅


**Action:** If critical files missing, stop and report.

### 1.3 Dependencies Check
```bash
cd apps/web && pnpm ls | grep -E "@tanstack/react-query|zod|axios"
```

**Required:** All should be present from Phases 1-3.

---

## PART 2: IMPLEMENTATION TASKS

### Task 2.1: Create Zod Schemas
**File:** `apps/web/app/lib/schemas/ranking.schemas.ts`

**Schemas to create:**

1. **RankingFilterSchema**
   - `categoryId?: number` (optional, filter by category)
   - `sortBy?: 'overallScore' | 'averageRating' | 'reviewCount' | 'trustScore'` (optional)
   - `order?: 'asc' | 'desc'` (default: 'desc')
   - `page?: number` (default: 1)
   - `limit?: number` (default: 20)

2. **SearchBusinessSchema**
   - `query?: string` (search term)
   - `categoryId?: number` (optional filter)
   - `page?: number` (default: 1)
   - `limit?: number` (default: 10)

**Implementation Notes:**
- Validate `sortBy` is one of allowed values
- Validate `order` is 'asc' or 'desc'
- Validate `page >= 1`, `limit >= 5`
- Export types as `z.infer<typeof Schema>`

### Task 2.2: Create Query Hooks
**File:** `apps/web/app/features/ranking/hooks/queries.ts`

**Hooks to create (6 total):**

1. **useRankingsQuery(filters?: RankingFilterSchema)**
   - Endpoint: `GET /rankings?categoryId=X&sortBy=Y&order=Z&page=P&limit=L`
   - Returns: Paginated rankings with business info
   - Used in: `/rankings` page
   - Default page size: 20
   - Cache: `staleTime: 10 * 60 * 1000` (10 min, rankings don't change often)

2. **useTopRankingsQuery(limit?: number)**
   - Endpoint: `GET /rankings/top?limit=10` (or param if supported)
   - Returns: Top 10-20 businesses by overall score
   - Used in: Homepage carousel, sidebar
   - No pagination (fixed result set)
   - Cache: `staleTime: 15 * 60 * 1000`

3. **useBusinessRankingQuery(businessId: number)**
   - Endpoint: `GET /rankings/businesses/:businessId`
   - Returns: Business ranking, position, score
   - Used in: Business detail page (show rank badge)
   - Conditional: Only fetch if `businessId` truthy
   - Cache: `staleTime: 10 * 60 * 1000`

4. **useCategoriesQuery**
   - Endpoint: `GET /categories`
   - Returns: All categories (list)
   - Used in: Filter dropdown, category pills
   - No pagination
   - Cache: `staleTime: 60 * 60 * 1000` (1 hour, categories are static)

5. **useCategoryDetailsQuery(categoryId: number)**
   - Endpoint: `GET /categories/:categoryId/criteria`
   - Returns: Category with criteria list + weights
   - Used in: Category detail page, criteria breakdown
   - Conditional: Only fetch if `categoryId` truthy
   - Cache: `staleTime: 60 * 60 * 1000`

6. **useBusinessSearchQuery(filters?: SearchBusinessSchema)**
   - Endpoint: `GET /businesses?search=query&categoryId=X&page=P&limit=L`
   - Returns: Paginated businesses matching search
   - Used in: Search results page (or integrated in rankings)
   - Default page size: 10
   - Cache: `staleTime: 5 * 60 * 1000`

**Implementation Notes:**
- Use `apiClient` from `app/lib/api-client.ts`
- Use query keys from `app/lib/query-keys.ts`
- `enabled` option for conditional queries
- Handle pagination params properly
- Return `useQuery(...)` hook

### Task 2.3: Create Components
**File:** `apps/web/app/features/ranking/components/`

**Components to create (8 total):**

1. **ranking-table.tsx**
   - Displays: Table with columns: Rank, Business Name, Category, Overall Score, Avg Rating, Review Count
   - Props: `rankings: Ranking[]`, `isLoading: boolean`, `onBusinessClick?: (businessId) => void`
   - Features:
     - Sort columns clickable (emit sortBy event)
     - Show rank # with medal emoji (🥇🥈🥉 for top 3)
     - Business name clickable → navigate to `/businesses/:id`
     - Score shown as number + bar (0-100)
     - Rating shown as stars + count
   - Design: Use `components.table` or standard HTML table styled with tokens
   - Mobile: Collapse to card layout if narrow

2. **ranking-card.tsx**
   - Displays: Card for single ranking (mobile-friendly alternative to table)
   - Props: `ranking: Ranking`, `onClick?: () => void`
   - Features:
     - Show rank # + medal emoji
     - Business name, category
     - Overall score + bar
     - Avg rating + review count
   - Design: Use `components.card` token

3. **category-filter.tsx**
   - Displays: Dropdown or pill buttons to select category
   - Props: `categories: Category[]`, `selected?: number`, `onChange: (categoryId?) => void`, `isLoading: boolean`
   - Features:
     - "All Categories" option (categoryId = null)
     - Show category names
     - Highlight selected
     - Loading state
   - Design: Use `components.button` as pills or shadcn/ui Select

4. **sort-selector.tsx**
   - Displays: Dropdown to select sort field + order (asc/desc)
   - Props: `sortBy: string`, `order: 'asc' | 'desc'`, `onSortChange: (sortBy, order) => void`
   - Features:
     - Options: Overall Score, Avg Rating, Review Count, Trust Score
     - Order toggle: Asc ↑ / Desc ↓
   - Design: Use `components.select` or shadcn/ui

5. **search-bar.tsx**
   - Displays: Input field to search businesses
   - Props: `onSearch: (query: string) => void`, `isLoading: boolean`, `placeholder?: string`
   - Features:
     - Debounce input (300ms before firing onSearch)
     - Clear button (X icon)
     - Search icon
   - Design: Use `components.input` token

6. **top-businesses-carousel.tsx**
   - Displays: Horizontal scrollable list of top 5 businesses
   - Props: `businesses: Ranking[]`, `isLoading: boolean`
   - Features:
     - Cards showing: Rank, business name, score, rating
     - Medal emoji for top 3
     - Left/right scroll arrows
     - Click to navigate to business detail
   - Design: Use `spacing.lg` between cards, mobile-friendly swipe

7. **business-ranking-badge.tsx**
   - Displays: Small badge showing rank + score
   - Props: `ranking: Ranking`
   - Features:
     - Show: "#2 • 87/100" (rank + score)
     - Medal emoji if top 3
     - Tooltips on hover (show category, trustScore)
   - Design: Use `colors.primary`, `typography.caption`

8. **criteria-breakdown.tsx**
   - Displays: Score breakdown by criterion
   - Props: `businessId: number`, `categoryId: number`, `isLoading: boolean`
   - Features:
     - Load category criteria
     - Show each criterion + score (0-100) + bar
     - Show weight %
     - Explain how overall score calculated (weighted avg)
   - Design: Use `spacing.md`, `colors.secondary`

**Implementation Notes:**
- Import design tokens: `import { colors, typography, spacing, components } from '@/app/lib/tokens'`
- All presentational (no hooks, only Props)
- TypeScript: type all Props
- Responsive: work on mobile + desktop

### Task 2.4: Create Pages
**File:** `apps/web/app/(main)/rankings/` and homepage update

**Pages to create (2 total):**

1. **apps/web/app/(main)/rankings/page.tsx** (`/rankings`)
   - Displays: Ranking list with filters
   - Features:
     - Search bar at top
     - Category filter (dropdown/pills)
     - Sort selector (Overall Score, Avg Rating, etc)
     - Load `useRankingsQuery(filters)`
     - Display as table (desktop) or cards (mobile)
     - Pagination controls
     - Show loading state
     - Show error/no results message
   - Layout:
 [Search Bar]
 [Filters: Category | Sort]
 [Table/Cards with rankings]
 [Pagination]
   - Page title: "Business Rankings"
   - Design: Use `spacing.lg` for layout

2. **Update Homepage** (`apps/web/app/(main)/page.tsx`)
   - Add sections:
     - Hero section (if not exists)
     - "Top Businesses" carousel using `useTopRankingsQuery()`
     - Featured categories grid
     - Search bar (link to `/rankings?query=...`)
   - Features:
     - Load top rankings + display carousel
     - Category pills (click to filter rankings)
     - Trending businesses (top 5)
   - Design: Hero-to-carousel flow, use design tokens

**Implementation Notes:**
- Auth: Rankings page is PUBLIC (no login required)
- Query params: `/rankings?categoryId=2&sortBy=averageRating&page=1`
- Pagination: Implement via query params (not state)
- Mobile: Responsive table → card layout

### Task 2.5: Add Query Keys
**File:** `apps/web/app/lib/query-keys.ts`

**Add these keys:**
```typescript
RANKINGS: ['rankings'],
RANKING_LIST: (filters?: object) => ['rankings', 'list', filters],
TOP_RANKINGS: ['rankings', 'top'],
BUSINESS_RANKING: (businessId: number) => ['rankings', 'business', businessId],

CATEGORIES: ['categories'],
CATEGORY_DETAIL: (categoryId: number) => ['categories', categoryId],
CATEGORY_CRITERIA: (categoryId: number) => ['categories', categoryId, 'criteria'],

BUSINESS_SEARCH: (query?: string, filters?: object) => ['businesses', 'search', { query, filters }],
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

### 3.3 Functional Testing
- [ ] `/rankings` loads with default rankings
- [ ] Category filter works (load rankings for category)
- [ ] Sort selector works (sort by score, rating, etc)
- [ ] Search bar filters businesses
- [ ] Pagination works (navigate between pages)
- [ ] Homepage carousel shows top 5 businesses
- [ ] Business detail shows ranking badge
- [ ] Click business name in ranking → navigate to detail
- [ ] Mobile layout responsive (cards on small screens)

### 3.4 Design Tokens
- [ ] All colors use `colors.*`
- [ ] All typography uses `typography.*`
- [ ] All spacing uses `spacing.*`
- [ ] Rank medal emoji styled correctly
- [ ] Score bars use `colors.primary`
- [ ] Rating stars use `colors.warning`

### 3.5 API Integration
- [ ] All endpoints called through `apiClient`
- [ ] Pagination params sent correctly
- [ ] Filter params in URL
- [ ] Error handling (show toast)
- [ ] Loading states working

---

## PART 4: CRITICAL RULES

1. **Access Token:** Memory only
2. **Refresh Token:** HttpOnly cookie
3. **API Calls:** Through `apiClient`
4. **Data Fetching:** TanStack Query only
5. **Styling:** Use tokens
6. **Error Handling:** Toast (sonner)
7. **Query Invalidation:** Precise targets
8. **TypeScript:** Strict mode
9. **Components:** Presentational
10. **Package Manager:** pnpm

---

## PART 5: REPORTING

When complete, report:

1. **Tasks Completed**
   - ✅ Zod Schemas
   - ✅ Queries (6 hooks)
   - ✅ Components (8 UI pieces)
   - ✅ Pages (2 pages)
   - ✅ Query Keys

2. **Files Created** (with line counts)
   - `app/lib/schemas/ranking.schemas.ts` (X lines)
   - `app/features/ranking/hooks/queries.ts` (X lines)
   - `app/features/ranking/components/*.tsx` (X files)
   - `app/(main)/rankings/page.tsx` (X lines)
   - Updated: `app/(main)/page.tsx` (X lines)
   - Updated: `app/lib/query-keys.ts` (X lines)

3. **Verification Results** (Part 3)
   - tsc --noEmit: ✅
   - pnpm lint: ✅
   - Manual tests: ✅ All pass
   - Design tokens: ✅

4. **Known Limitations**
   - E.g., "Criteria breakdown deferred if backend doesn't have weights"

5. **Next Phase Recommendations**
   - E.g., "Admin ranking config UI"
   - "Advanced filters (price range, location)"

---

## ENTRY POINT

1. **Part 1:** Verify backend + frontend
2. **Part 2:** Implement tasks 2.1–2.5 in order
3. **Part 3:** Run validation
4. **Part 4:** Report

**Start now.** 🚀