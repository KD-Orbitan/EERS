# PHASE 6 CONTEXT: User Profile Feature
# EERS Frontend — Project Continuation

**Project:** Enterprise Evaluation & Ranking System (EERS)  
**Status:** Phase 1-5 complete (hoặc skip Phase 5 SSE nếu chưa làm)  
**Current Chat:** Starting Phase 6 (User Profile)  
**Monorepo:** pnpm + Turborepo  
- Backend: `apps/api` (NestJS, http://localhost:3000/api/v1)
- Frontend: `apps/web` (Next.js 16.2.12, http://localhost:3001)

---

## AVAILABLE BACKEND ENDPOINTS (From Nest Logs)

**User Endpoints:**

GET /api/v1/users/profile → Get current user profile
PATCH /api/v1/users/profile → Update user profile (name, email, etc)
PATCH /api/v1/users/change-password → Change password


**Auth Endpoints (Existing):**

GET /api/v1/auth/me → Get current user (minimal)
POST /api/v1/auth/logout → Logout


---

## PHASE 6 TASKS (HIGH-LEVEL)

### Task 6.1: Create Queries
- useUserProfileQuery (GET /users/profile)

### Task 6.2: Create Mutations
- useUpdateProfileMutation (PATCH /users/profile)
- useChangePasswordMutation (PATCH /users/change-password)

### Task 6.3: Create Schemas (Zod)
- UpdateProfileSchema (name, email)
- ChangePasswordSchema (oldPassword, newPassword, confirmPassword)

### Task 6.4: Create Components
- profile-form.tsx (display + edit name, email)
- change-password-form.tsx (current password + new password)
- profile-header.tsx (user avatar, name, email display)

### Task 6.5: Create Pages
- /profile (read-only view + links to edit)
- /profile/edit (edit form)
- /profile/change-password (change password form)

---

## API RESPONSE SHAPES

### User Profile
```json
{
  "success": true,
  "data": {
    "id": number,
    "name": string,
    "email": string,
    "avatarUrl": string | null,
    "role": "USER" | "BUSINESS_OWNER" | "ADMIN",
    "createdAt": ISO date,
    "updatedAt": ISO date
  }
}
```

### Change Password Response
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## ENTRY POINT FOR PHASE 6

Use **CLAUDE-PHASE-6-WEB.md** prompt (below).

---

Ready for Phase 6! 🚀
# CLAUDE-PHASE-6-WEB.md
# Agent Instructions: User Profile Implementation
# EERS Frontend — Phase 6

**Project:** Enterprise Evaluation & Ranking System (EERS)  
**Agent Mode:** Full autonomous  
**Phase:** 6 — User Profile (Profile view, Edit, Change Password)  

---

## OVERVIEW

Implement **User Profile** feature: view profile, edit name/email, change password.

**Phase 6 Scope:**
1. Zod schemas (2 schemas)
2. TanStack Query hooks (1 query, 2 mutations)
3. React components (3 components)
4. Pages (3 pages: /profile, /profile/edit, /profile/change-password)
5. Design tokens integration

---

## PART 1: VERIFICATION & AUDIT

### 1.1 Backend Check
```bash
# Verify endpoints live
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer <token>"

curl -X PATCH http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

curl -X PATCH http://localhost:3000/api/v1/users/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"oldPassword": "...", "newPassword": "..."}'
```

**If any endpoint returns 404**, stop and report.

### 1.2 Frontend Structure

apps/web/
├── app/
│ ├── features/
│ │ └── user/ (NEW — create this)
│ ├── (main)/
│ │ └── profile/ (NEW — create this)
└── lib/tokens/ ✅


---

## PART 2: IMPLEMENTATION TASKS

### Task 2.1: Create Zod Schemas
**File:** `apps/web/app/lib/schemas/user.schemas.ts`

**Schemas:**

1. **UpdateProfileSchema**
   - `name: string` (min 2, max 100)
   - `email: string` (valid email)

2. **ChangePasswordSchema**
   - `oldPassword: string` (min 1)
   - `newPassword: string` (min 8)
   - `confirmPassword: string` (must match newPassword)
   - Validate: newPassword !== oldPassword

**Implementation Notes:**
- Use `.refine()` for password matching
- Export types as `z.infer<typeof Schema>`

### Task 2.2: Create Query Hooks
**File:** `apps/web/app/features/user/hooks/queries.ts`

**Hooks (1 total):**

1. **useUserProfileQuery**
   - Endpoint: `GET /users/profile`
   - Returns: User profile (id, name, email, role, avatar, createdAt)
   - Used in: /profile, /profile/edit pages
   - Cache: `staleTime: 5 * 60 * 1000` (5 min)
   - Conditional: Only fetch if authenticated

**Implementation Notes:**
- Use `apiClient`
- Use query key `QUERY_KEYS.AUTH_ME` or `['user', 'profile']`
- Return `useQuery(...)` hook

### Task 2.3: Create Mutation Hooks
**File:** `apps/web/app/features/user/hooks/mutations.ts`

**Mutations (2 total):**

1. **useUpdateProfileMutation**
   - PATCH `/users/profile`
   - Payload: UpdateProfileSchema (name, email)
   - Success: Invalidate `AUTH_ME` query, show toast "Profile updated"
   - Error: Show toast with error message

2. **useChangePasswordMutation**
   - PATCH `/users/change-password`
   - Payload: ChangePasswordSchema
   - Success: Show toast "Password changed successfully", redirect to /profile, logout
   - Error: Show toast "Current password incorrect" or error message

**Implementation Notes:**
- Use `useMutation`
- `onSuccess` callback for invalidation + toasts
- `onError` callback for error toasts
- After password change, may need to re-login (depends on backend behavior)

### Task 2.4: Create Components
**File:** `apps/web/app/features/user/components/`

**Components (3 total):**

1. **profile-header.tsx**
   - Displays: User name, email, role badge
   - Props: `user: User`, `onEditClick?: () => void`
   - Features:
     - Show avatar (placeholder if not set)
     - Show name, email, role
     - Edit button (if owner/admin viewing own profile)
   - Design: Use `components.card`, `typography.heading`, `colors.text`

2. **profile-form.tsx**
   - Displays: Edit name + email form
   - Props: `user: User`, `onSubmit: (data) => Promise<void>`, `isLoading: boolean`
   - Features:
     - Text input: Name (required)
     - Text input: Email (required, valid email)
     - Submit button: "Save Changes"
     - Cancel button (link to /profile)
     - Validation: Use UpdateProfileSchema
   - Design: Use `components.input`, `spacing.md`

3. **change-password-form.tsx**
   - Displays: Password change form
   - Props: `onSubmit: (data) => Promise<void>`, `isLoading: boolean`
   - Features:
     - Password input: Current password (required)
     - Password input: New password (required, min 8)
     - Password input: Confirm new password (required, must match)
     - Submit button: "Change Password"
     - Cancel button (link to /profile)
     - Show password strength indicator (optional)
     - Validation: Use ChangePasswordSchema
   - Design: Use `components.input`, `colors.warning` for strength indicator

**Implementation Notes:**
- Presentational (no hooks)
- TypeScript: type all Props
- Use shadcn/ui components: Input, Button, Card
- Import design tokens

### Task 2.5: Create Pages
**File:** `apps/web/app/(main)/profile/`

**Pages (3 total):**

1. **apps/web/app/(main)/profile/page.tsx** (`/profile`)
   - Displays: User profile (read-only)
   - Features:
     - Load `useUserProfileQuery()`
     - Show profile-header
     - Show user stats (if available):
       - Businesses created
       - Reviews written
       - Member since
     - Link to `/profile/edit` (Edit Profile button)
     - Link to `/profile/change-password` (Change Password button)
     - Link to `/profile/logout` or button to logout
   - Page title: "My Profile"
   - Design: Use `spacing.lg`, centered layout

2. **apps/web/app/(main)/profile/edit/page.tsx** (`/profile/edit`)
   - Displays: Edit profile form
   - Features:
     - Load `useUserProfileQuery()`
     - Show profile-form with current data
     - Call `useUpdateProfileMutation()` on submit
     - On success: Redirect to /profile
   - Page title: "Edit Profile"
   - Design: Centered form, `spacing.md` padding

3. **apps/web/app/(main)/profile/change-password/page.tsx** (`/profile/change-password`)
   - Displays: Change password form
   - Features:
     - Show change-password-form
     - Call `useChangePasswordMutation()` on submit
     - On success: Show toast + redirect to /profile (user may be logged out)
   - Page title: "Change Password"
   - Design: Centered form, `spacing.md` padding

**Implementation Notes:**
- All pages protected (redirect to /login if not authenticated)
- Handle loading/error states
- Responsive layout (mobile-friendly)
- Use existing `useAuth()` hook to check authentication

### Task 2.6: Add Query Keys
**File:** `apps/web/app/lib/query-keys.ts`

**Add:**
```typescript
USER_PROFILE: ['user', 'profile'],
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
- [ ] /profile loads and shows current user
- [ ] /profile/edit form pre-fills current values
- [ ] Edit profile → name/email updated
- [ ] /profile/change-password form works
- [ ] Change password → success message + logout/redirect
- [ ] Wrong current password → error message
- [ ] Protected routes redirect to /login if not authenticated
- [ ] Mobile layout responsive

### 3.4 Design Tokens
- [ ] All colors use `colors.*`
- [ ] All typography uses `typography.*`
- [ ] All spacing uses `spacing.*`
- [ ] Form inputs styled consistently
- [ ] Buttons use `components.button`

### 3.5 API Integration
- [ ] All calls through `apiClient`
- [ ] Error messages extracted via `getErrorMessage(error)`
- [ ] Toasts show on success/error
- [ ] Query invalidation works (profile updates reflected)

---

## PART 4: CRITICAL RULES

1. **Access Token:** Memory only
2. **Refresh Token:** HttpOnly cookie
3. **API Calls:** Through `apiClient`
4. **Data Fetching:** TanStack Query only
5. **Styling:** Use tokens
6. **Error Handling:** Toast (sonner)
7. **TypeScript:** Strict mode
8. **Components:** Presentational
9. **Package Manager:** pnpm

---

## PART 5: REPORTING

When complete, report:

1. **Tasks Completed**
   - ✅ Zod Schemas
   - ✅ Queries (1 hook)
   - ✅ Mutations (2 hooks)
   - ✅ Components (3 UI pieces)
   - ✅ Pages (3 pages)
   - ✅ Query Keys

2. **Files Created** (with line counts)
   - `app/lib/schemas/user.schemas.ts` (X lines)
   - `app/features/user/hooks/queries.ts` (X lines)
   - `app/features/user/hooks/mutations.ts` (X lines)
   - `app/features/user/components/*.tsx` (X files)
   - `app/(main)/profile/page.tsx` (X lines)
   - `app/(main)/profile/edit/page.tsx` (X lines)
   - `app/(main)/profile/change-password/page.tsx` (X lines)
   - Updated: `app/lib/query-keys.ts` (X lines)

3. **Verification Results** (Part 3)
   - tsc --noEmit: ✅
   - pnpm lint: ✅
   - Manual tests: ✅ All pass
   - Design tokens: ✅

4. **Known Limitations**
   - If any

5. **Next Phase Recommendations**
   - Phase 7 Admin ready

---

## ENTRY POINT

1. **Part 1:** Verify backend + frontend
2. **Part 2:** Implement tasks 2.1–2.6 in order
3. **Part 3:** Run validation
4. **Part 4:** Report

**Start now.** 🚀