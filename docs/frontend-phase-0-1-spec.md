# EERS Frontend — Phase 0 & Phase 1 Implementation

**Scope:** MVP Authentication Flow (Login/Register/Logout)
**Framework:** Next.js 16.2.12 (App Router, TypeScript)
**Port:** 3001 (backend on 3000)
**Status:** Starting from fresh Next.js app

---

## Critical Architecture Rules

These are NON-NEGOTIABLE. Do not deviate.

1. Access Token: MEMORY ONLY (never localStorage/sessionStorage)
2. Refresh Token: HttpOnly Cookie (automatic via withCredentials)
3. All API calls: MUST go through centralized apiClient
4. All data fetching: MUST use TanStack Query (useQuery/useMutation)
5. No hardcoded API URLs: use process.env.NEXT_PUBLIC_API_URL
6. API responses: follow { success, data, meta?, error? } envelope
7. Component structure: Feature-based organization
8. No passwords logged, returned, or visible in responses

---

# PHASE 0: Frontend Bootstrap

**Goal:** Working Next.js app with API client connected to backend

**Deliverables after Phase 0:**
✓ pnpm dev runs on port 3001 without errors
✓ No hydration mismatch warnings in console
✓ GET /auth/me returns 401 (not authenticated yet)
✓ TanStack Query DevTools visible at bottom-right
✓ Home page shows "Welcome to EERS" + login/register buttons
---

## Task P0.1: Environment Configuration

**Requirement:** Setup environment variables for frontend

**Must create file:** `apps/web/.env.local`

**Must define:**
- `NEXT_PUBLIC_API_URL` → Backend base URL (http://localhost:3000/api/v1)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → Google OAuth client ID (can be placeholder for now)

**Verification:**
- File exists at correct path
- Variables accessible via `process.env.NEXT_PUBLIC_*`
- No hardcoded values in source code

---

## Task P0.2: Install Dependencies

**Requirement:** Install all required packages for frontend development

**Must run:**
```bash
cd apps/web
pnpm add @tanstack/react-query@5 @tanstack/react-query-devtools axios react-hook-form @hookform/resolvers zod lucide-react sonner js-cookie @radix-ui/react-dialog
pnpm add -D @types/js-cookie
```

**Purpose of each package:**
- `@tanstack/react-query`: Server state management (data fetching/caching)
- `axios`: HTTP client
- `react-hook-form` + `@hookform/resolvers` + `zod`: Form validation
- `lucide-react`: Icon library
- `sonner`: Toast notifications
- `js-cookie`: Cookie management
- `@radix-ui/react-dialog`: Dialog component primitives

**Verification:**
- All packages in `package.json` dependencies
- No peer dependency warnings
- `pnpm install` completes successfully

---

## Task P0.3: Initialize shadcn/ui

**Requirement:** Setup shadcn/ui component library

**Must run:**
```bash
cd apps/web
npx shadcn-ui@latest init -d
```

**Configuration:**
- Select "Default" style
- Select "Slate" color scheme
- Enable "CSS variables"

**Verification:**
- `app/components/ui/` folder created
- `components.json` exists at web root
- Can run `npx shadcn-ui@latest add button` successfully

---

## Task P0.4: Create Project Structure

**Requirement:** Organize folder structure for scalability

**Must create folders:**
app/
├── lib/
│ ├── api-client.ts
│ ├── query-keys.ts
│ └── constants.ts
├── hooks/
│ └── use-auth.ts
├── features/
│ └── auth/
│ ├── components/
│ ├── hooks/
│ ├── mutations/
│ └── schemas/
├── middleware.ts
├── providers.tsx
├── layout.tsx
└── page.tsx
**Purpose:**
- `lib/`: Shared utilities (API client, query keys)
- `hooks/`: Custom React hooks
- `features/auth/`: Auth-specific code (components, mutations, schemas)

---

## Task P0.5: API Client with JWT Interceptors

**Requirement:** Create centralized HTTP client that:
- Attaches access token to all requests
- Automatically refreshes expired tokens
- Handles 401 responses
- Uses HttpOnly cookies for refresh tokens

**Must implement:** `app/lib/api-client.ts`

**Requirements:**
1. Create axios instance with baseURL from `NEXT_PUBLIC_API_URL`
2. Store access token in **memory only** (module-level variable)
3. Request interceptor:
   - If accessToken exists → attach `Authorization: Bearer {token}` header
   - Pass request through
4. Response interceptor:
   - On success → return response
   - On 401 error (and not already retried):
     - Attempt POST to `/auth/refresh` with `withCredentials: true`
     - Extract new accessToken from response
     - Update token in memory
     - Retry original request with new token
     - If refresh fails → clear token, reject error
   - On other errors → reject error
5. Export functions:
   - `setAccessToken(token)` → sets token in memory
   - `getAccessToken()` → returns current token
   - Default export → axios instance

**Verification:**
- File compiles without TypeScript errors
- All exports present
- Interceptors properly structured
- No secrets hardcoded

---

## Task P0.6: Query Keys Factory

**Requirement:** Create centralized query key management

**Must implement:** `app/lib/query-keys.ts`

**Requirements:**
1. Export `QUERY_KEYS` object with all query keys
2. Structure:
   - Static keys (arrays): `AUTH_ME: ['auth', 'me']`
   - Dynamic keys (functions): `BUSINESS_DETAIL: (id: number) => ['businesses', id]`
3. Cover all endpoints needed in Phase 0+1:
   - Auth: AUTH_ME
   - Businesses: BUSINESSES, BUSINESS_DETAIL, MY_BUSINESSES
   - Reviews: REVIEWS, MY_REVIEWS
   - Rankings: RANKINGS, RANKINGS_TOP
   - Categories: CATEGORIES, CRITERIA
   - Notifications: NOTIFICATIONS, UNREAD_COUNT
   - Reports: REPORTS, MY_REPORTS, REPORT_REASONS
4. Make all keys readonly (`as const`)

**Verification:**
- Keys follow naming convention (UPPER_SNAKE_CASE)
- Dynamic keys are functions
- All keys exported

---

## Task P0.7: TanStack Query Setup

**Requirement:** Configure QueryClient with sensible defaults

**Must implement:** `app/providers.tsx`

**Requirements:**
1. Create single global QueryClient instance
2. Configure defaultOptions:
   - queries: staleTime=60s, gcTime=5min, retry=1, refetchOnWindowFocus=false
   - mutations: retry=0
3. Create `<Providers>` component that wraps children with:
   - `<QueryClientProvider>`
   - `<ReactQueryDevtools>` (initialIsOpen=false, buttonPosition=bottom-right)
4. Must be Client Component (`'use client'`)
5. Export default from component

**Verification:**
- Component is Client Component
- QueryClient properly configured
- Devtools included for debugging
- Properly exports Providers

---

## Task P0.8: Root Layout with Providers

**Requirement:** Setup root layout that wraps entire app with providers

**Must update:** `app/layout.tsx`

**Requirements:**
1. Import Providers from `providers.tsx`
2. Wrap `{children}` with `<Providers>`
3. Keep existing metadata and fonts (Geist)
4. Add `suppressHydrationWarning` to `<html>` tag (prevents hydration mismatch warnings)
5. Maintain existing styling

**Verification:**
- Layout properly wraps children with Providers
- No hydration warnings on page refresh
- Metadata preserved

---

## Task P0.9: Auth Hook

**Requirement:** Create custom hook to access authenticated user and auth state

**Must implement:** `app/hooks/use-auth.ts`

**Requirements:**
1. Must be Client Hook (`'use client'`)
2. Define `User` interface with fields:
   - userId, name, email, avatarUrl, role, status, createdAt
3. Implement `useAuth()` hook that:
   - Uses `useQuery` with key `QUERY_KEYS.AUTH_ME`
   - Fetches from GET `/auth/me` using apiClient
   - Has retry: false (no retry on 401)
   - Returns object with:
     - `user`: User data (or undefined if not authenticated)
     - `isLoading`: boolean
     - `isAuthenticated`: boolean (true if user exists and no error)
     - `error`: error object (or null)
     - `logout()`: function that clears token + queries
     - `setAccessToken()`: function to set token
     - `getAccessToken()`: function to get token
4. Parse API response envelope: response.data.data contains user

**Verification:**
- Hook is Client Hook
- Properly extracts user from response
- isAuthenticated boolean logic correct
- logout clears useQueryClient

---

## Task P0.10: Home Page

**Requirement:** Create landing page that:
- Shows "Welcome to EERS" when not authenticated
- Shows user greeting when authenticated
- Provides login/register links
- Shows loading state while checking auth

**Must implement:** `app/page.tsx`

**Requirements:**
1. Must be Client Component
2. Use `useAuth()` hook
3. Show loading spinner while `isLoading`
4. If NOT authenticated:
   - Show "Welcome to EERS" heading
   - Show subtitle
   - Show "Login" and "Register" buttons (as `<Link>` to `/login` and `/register`)
   - Style with gradient background (blue/indigo)
5. If authenticated:
   - Show "Welcome back, {user.name}!" heading
   - Show "Role: {user.role}"
   - Show grid of navigation cards (Businesses, Rankings, Profile)
   - These are just placeholders for now (actual functionality in Phase 2+)

**Styling:**
- Use Tailwind classes
- Keep it simple and clean
- Responsive grid layout

**Verification:**
- Unauthenticated users see login/register buttons
- Authenticated users see user name and role
- Loading state visible while fetching
- No errors in console

---

## ✅ Phase 0 Checkpoint

After completing P0.1 through P0.10:

```bash
cd apps/web
pnpm dev
```

**Expected output:**
▲ Next.js 16.2.12

Local: http://localhost:3001
✓ Ready in ~1000ms
**Manual verification checklist:**
- [ ] http://localhost:3001 opens in browser
- [ ] See "Welcome to EERS" + Login/Register buttons
- [ ] No hydration mismatch errors in console
- [ ] No TypeScript errors in terminal
- [ ] TanStack Query DevTools visible (bottom right)
- [ ] Open DevTools → Network → see GET /auth/me request (401 response)
- [ ] Refresh page → still works, no errors

**If all ✓ → Phase 0 complete, proceed to Phase 1**

---

# PHASE 1: Authentication

**Goal:** Implement login, register, logout flows with proper token handling

**Deliverables after Phase 1:**
✓ User can register with email/password
✓ New account created in database
✓ User can login with credentials
✓ Access token stored in memory
✓ Refresh token stored in HttpOnly cookie
✓ After login, user data visible on home page
✓ Logout clears session + redirects to /login
✓ Protected routes redirect unauthenticated users
✓ No console errors or warnings
---

## Task P1.1: Auth Validation Schemas

**Requirement:** Create Zod schemas for login and register form validation

**Must implement:** `app/features/auth/schemas/auth.schema.ts`

**Requirements:**
1. Create `loginSchema` with fields:
   - `email`: valid email format
   - `password`: min 8 characters
2. Create `registerSchema` with fields:
   - `name`: required, max 100 chars
   - `email`: valid email format
   - `password`: min 8 characters
   - `confirmPassword`: must match password
3. Export TypeScript types:
   - `LoginInput` (inferred from loginSchema)
   - `RegisterInput` (inferred from registerSchema)
4. Use appropriate Zod methods: `.email()`, `.min()`, `.max()`, `.refine()` for password matching

**Verification:**
- Schemas compile without errors
- Types can be imported and used
- Validation error messages are user-friendly

---

## Task P1.2: Login Mutation

**Requirement:** Create mutation hook for login API call

**Must implement:** `app/features/auth/mutations/use-login.mutation.ts`

**Requirements:**
1. Must be Client Hook (`'use client'`)
2. Define `LoginResponse` interface:
   - `accessToken`: string
   - `expiresIn`: number
   - `user`: { userId, name, role }
3. Implement `useLoginMutation()` hook that:
   - Uses `useMutation` from TanStack Query
   - `mutationFn`: POST `/auth/login` with LoginInput
   - Parses response: `response.data.data` contains LoginResponse
   - `onSuccess`: Call `setAccessToken(data.accessToken)`
   - Returns mutation object with isPending, mutateAsync, etc.

**Verification:**
- Hook compiles without errors
- Properly types input/output
- setAccessToken called on success
- HTTP method and endpoint correct

---

## Task P1.3: Register Mutation

**Requirement:** Create mutation hook for registration API call

**Must implement:** `app/features/auth/mutations/use-register.mutation.ts`

**Requirements:**
1. Must be Client Hook (`'use client'`)
2. Define `RegisterResponse` interface:
   - `userId`: number
   - `name`: string
   - `email`: string
   - `role`: 'USER'
3. Implement `useRegisterMutation()` hook that:
   - Uses `useMutation` from TanStack Query
   - `mutationFn`: POST `/auth/register` with register input (omit confirmPassword)
   - Parses response: `response.data.data` contains RegisterResponse
   - Returns mutation object

**Note:** Do NOT call setAccessToken on register (user must login after)

**Verification:**
- Hook compiles without errors
- Input excludes confirmPassword
- HTTP endpoint and method correct

---

## Task P1.4: Logout Mutation

**Requirement:** Create mutation hook for logout API call

**Must implement:** `app/features/auth/mutations/use-logout.mutation.ts`

**Requirements:**
1. Must be Client Hook (`'use client'`)
2. Implement `useLogoutMutation()` hook that:
   - Uses `useMutation` from TanStack Query
   - Gets queryClient via `useQueryClient()`
   - `mutationFn`: POST `/auth/logout` (no request body)
   - `onSuccess`:
     - Call `setAccessToken(null)` to clear token
     - Call `queryClient.clear()` to clear all cached data
   - Returns mutation object

**Verification:**
- Hook compiles without errors
- Both setAccessToken(null) and queryClient.clear() called
- HTTP endpoint correct

---

## Task P1.5: Login Form Component

**Requirement:** Create login form with email/password inputs, validation, error handling

**Must implement:** `app/features/auth/components/login-form.tsx`

**Requirements:**
1. Must be Client Component (`'use client'`)
2. Use `useForm` from react-hook-form with loginSchema
3. Use `useLoginMutation()` and `useQueryClient()` from TanStack Query
4. Use `useRouter()` for navigation
5. Form inputs:
   - Email input field
   - Password input field
   - Submit button (disabled during loading)
6. Validation:
   - Show error messages under each field if validation fails
   - Use `errors` object from useForm
7. Submit handler:
   - Call `loginMutation.mutateAsync(data)`
   - On success:
     - Invalidate `QUERY_KEYS.AUTH_ME` to refresh user data
     - Show success toast: "Logged in successfully!"
     - Redirect to `/` via `router.push('/')`
   - On error:
     - Extract error message from `error.response?.data?.error?.message`
     - Show error toast with message
8. Navigation link to register page at bottom

**Styling:**
- Use Tailwind CSS
- Keep it simple and clean
- Input fields with focus ring
- Submit button changes appearance when disabled

**Verification:**
- Form renders without errors
- Validation shows errors on blur/submit
- Submit button disables during request
- Redirects after successful login
- Error toast shows on failure

---

## Task P1.6: Register Form Component

**Requirement:** Create registration form with name, email, password validation

**Must implement:** `app/features/auth/components/register-form.tsx`

**Requirements:**
1. Must be Client Component (`'use client'`)
2. Use `useForm` from react-hook-form with registerSchema
3. Use `useRegisterMutation()` from React Hook Form
4. Use `useRouter()` for navigation
5. Form inputs:
   - Name input field
   - Email input field
   - Password input field
   - Confirm password input field
   - Submit button (disabled during loading)
6. Validation:
   - Show error messages under each field
   - Password confirmation validation (must match)
7. Submit handler:
   - Call `registerMutation.mutateAsync()` with name, email, password (omit confirmPassword)
   - On success:
     - Show success toast: "Account created! Redirecting to login..."
     - Redirect to `/login` via `router.push('/login')`
   - On error:
     - Show error toast with API error message
8. Navigation link to login page at bottom

**Styling:**
- Use Tailwind CSS
- Match login form styling
- Clear visual hierarchy

**Verification:**
- Form renders without errors
- Validation works (especially password matching)
- Submit button disables during request
- Redirects to login after successful registration
- Error toast shows on failure

---

## Task P1.7: Auth Layout (Route Group)

**Requirement:** Create layout wrapper for auth pages (login/register) with centered styling

**Must implement:** `app/(auth)/layout.tsx`

**Requirements:**
1. Create layout component that wraps auth pages
2. Apply gradient background (blue to indigo)
3. Center content vertically and horizontally
4. Full height viewport
5. Wrap `{children}`

**Styling:**
- Use Tailwind: `min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center`

**Verification:**
- Layout renders correctly
- Auth pages inherit styling

---

## Task P1.8: Login Page

**Requirement:** Create /login page that renders login form

**Must implement:** `app/(auth)/login/page.tsx`

**Requirements:**
1. Must be Client Component (`'use client'`)
2. Render `<LoginForm />` component
3. That's it — layout handles styling

**Verification:**
- Page renders at http://localhost:3001/login
- Form displays correctly

---

## Task P1.9: Register Page

**Requirement:** Create /register page that renders register form

**Must implement:** `app/(auth)/register/page.tsx`

**Requirements:**
1. Must be Client Component (`'use client'`)
2. Render `<RegisterForm />` component
3. That's it — layout handles styling

**Verification:**
- Page renders at http://localhost:3001/register
- Form displays correctly

---

## Task P1.10: Route Protection Middleware

**Requirement:** Redirect unauthenticated users from protected routes

**Must implement:** `app/middleware.ts`

**Requirements:**
1. Create middleware function that:
   - Defines array of protected routes: `/profile`, `/businesses/*`, `/reviews/*`, `/notifications`, `/admin/*`
   - Defines array of auth routes: `/login`, `/register`
   - Reads `refreshToken` cookie from request
2. Logic:
   - If route is protected AND no refreshToken → redirect to `/login`
   - If route is auth route AND refreshToken exists → redirect to `/`
   - Otherwise → allow request through
3. Export config with matcher that covers all routes except `/api/*`, `/_next/*`, etc.

**How it works:**
- Browser stores refresh token in HttpOnly cookie
- Middleware can read it to determine if user is authenticated
- No need to check actual token validity (backend will handle 401)

**Verification:**
- Try accessing `/profile` without logging in → redirects to `/login`
- Try accessing `/login` while logged in → redirects to `/`
- Public routes work normally

---

## Task P1.11: Update Home Page with Logout

**Requirement:** Add logout functionality to home page

**Must update:** `app/page.tsx`

**Changes needed:**
1. Import `useLogoutMutation` and `useRouter`
2. In authenticated section:
   - Add "Logout" button (right side of header)
   - Button disabled during logout
   - On click: call logout mutation, then redirect to `/login`
3. Handle logout error gracefully (show toast if needed)

**Verification:**
- Logout button visible when authenticated
- Clicking logout clears session + redirects to /login
- Cannot access protected routes after logout

---

## ✅ Phase 0 + 1 Final Checkpoint

After completing all tasks P0.1 → P1.11:

```bash
cd apps/web
pnpm dev
```

**End-to-end flow test:**

1. **Unauthenticated:**
   - [ ] Visit http://localhost:3001
   - [ ] See "Welcome to EERS" + Login/Register buttons
   - [ ] Click "Login" → goes to /login
   - [ ] Click "Register" → goes to /register
   - [ ] Try accessing /profile → redirects to /login

2. **Register Flow:**
   - [ ] Fill register form with: name, email@test.com, password123, confirm
   - [ ] Submit → shows "Account created!" toast
   - [ ] Redirected to /login
   - [ ] Verify in backend database: new user created (optional)

3. **Login Flow:**
   - [ ] Fill login form with email@test.com, password123
   - [ ] Submit → shows "Logged in successfully!" toast
   - [ ] Redirected to home page
   - [ ] See "Welcome back, [name]!" heading
   - [ ] See "Role: USER"
   - [ ] Logout button visible

4. **Token Management:**
   - [ ] Open DevTools → Application → Cookies
   - [ ] See `refreshToken` HttpOnly cookie
   - [ ] Access token NOT in localStorage/sessionStorage
   - [ ] TanStack Query DevTools shows `auth.me` query with user data

5. **After Logout:**
   - [ ] Click Logout
   - [ ] Shows toast, redirects to /login
   - [ ] Try to access /profile → redirects to /login
   - [ ] All queries cleared (DevTools shows empty)

6. **Console Health:**
   - [ ] NO hydration mismatch errors
   - [ ] NO TypeScript errors
   - [ ] NO API errors (401 is expected when not authenticated)
   - [ ] NO network 404s

**If all ✓ above → Phase 0 + 1 COMPLETE!**

---

## Troubleshooting

**Hydration Mismatch Warnings:**
- Already fixed by `suppressHydrationWarning` in root layout

**401 on /auth/me endpoint:**
- Expected when not logged in
- Should show "Welcome to EERS" buttons

**Refresh token not persisting:**
- Check backend is setting HttpOnly cookie correctly
- Verify `withCredentials: true` in apiClient

**Protected routes not working:**
- Ensure middleware.ts exists and correct paths
- Check refreshToken cookie name matches backend

**Form validation not showing:**
- Ensure Zod schemas properly configured
- Check error messages are being displayed

---

## Code Quality Standards

When implementing, follow these principles:

1. **Type Safety:** All functions have proper TypeScript types
2. **Error Handling:** All API calls wrapped in try-catch or `.catch()`
3. **User Feedback:** Loading states, error messages, success toasts
4. **Performance:** No unnecessary re-renders, proper hook dependencies
5. **Accessibility:** Proper labels, error messaging, keyboard navigation
6. **Clean Code:** Readable function names, comments for complex logic

---

## What Agent Should Report

After implementing each major section:
✓ P0.1-P0.4: Environment + dependencies + structure

 Files created
 Dependencies installed
 No errors

✓ P0.5-P0.7: Core setup (API client, query keys, providers)

 Files implemented
 TypeScript clean
 Ready to test

✓ P0.8-P0.10: Layout + home page

 pnpm dev runs
 http://localhost:3001 loads
 Home page displays correctly

✓ P1.1-P1.4: Auth schemas + mutations

 All files created
 Types correct
 No errors

✓ P1.5-P1.11: Forms + middleware + flow

 All routes working
 End-to-end flow tested
 Phase 0 + 1 COMPLETE
 ---

## Exit Criteria

Phase 0 + 1 is complete when:
Backend: http://localhost:3000/api/v1 ✓
Frontend: http://localhost:3001 ✓
Register → Login → Home → Logout works end-to-end ✓
No console errors ✓
TanStack Query DevTools shows queries ✓
Route protection working (middleware) ✓
API errors handled gracefully ✓
Once complete, you're ready for **Phase 2: Business Feature**.
