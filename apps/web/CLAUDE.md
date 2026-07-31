# EERS Frontend — Phase 0 & Phase 1 Implementation Guide

**Status:** Initial Bootstrap + Authentication
**Framework:** Next.js 16.2.12, App Router, TypeScript
**State Management:** TanStack Query v5 + React hooks
**Port:** 3001 (backend runs on 3000)

---

## Critical Rules (NON-NEGOTIABLE)

1. Access Token: MEMORY ONLY (not localStorage)
2. Refresh Token: HttpOnly Cookie (automatic via withCredentials)
3. All API calls: go through apiClient (never direct fetch)
4. All data fetching: via TanStack Query useQuery/useMutation
5. No hardcoded API URLs (use NEXT_PUBLIC_API_URL)
6. Component Structure: Feature-based organization
7. Passwords: NEVER log or return in responses

---

## Phase 0: Bootstrap

### What This Phase Does
- Initialize project structure
- Setup API client with JWT interceptors
- Setup TanStack Query
- Setup auth context/hook
- Test API connection to backend

### Deliverables
✓ pnpm dev runs without errors on port 3001
✓ API client connects to http://localhost:3000/api/v1
✓ GET /auth/me call works
✓ No hydration mismatch warnings
✓ TanStack Query DevTools visible

---

## Task P0.1: Environment Configuration

**Create:** `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

---

## Task P0.2: Install Dependencies

```bash
pnpm add @tanstack/react-query@5 @tanstack/react-query-devtools
pnpm add axios
pnpm add react-hook-form @hookform/resolvers zod
pnpm add lucide-react sonner js-cookie
pnpm add @radix-ui/react-dialog

pnpm add -D @types/js-cookie
```

---

## Task P0.3: Initialize shadcn/ui

```bash
npx shadcn-ui@latest init -d
```

Select: Default, Slate, Yes

---

## Task P0.4: Create Folder Structure
app/
├── lib/
│ ├── api-client.ts
│ ├── query-keys.ts
│ └── constants.ts
├── hooks/
│ └── use-auth.ts
├── features/
│ └── auth/
├── middleware.ts
├── providers.tsx
├── layout.tsx
└── page.tsx

---

## Task P0.5: API Client

**Create:** `app/lib/api-client.ts`

```typescript
import axios from 'axios'

let accessToken: string | null = null

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        accessToken = response.data.data.accessToken
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch {
        accessToken = null
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

export const getAccessToken = () => accessToken

export default apiClient
```

---

## Task P0.6: Query Keys

**Create:** `app/lib/query-keys.ts`

```typescript
export const QUERY_KEYS = {
  AUTH_ME: ['auth', 'me'],
  BUSINESSES: ['businesses'],
  BUSINESS_DETAIL: (id: number) => ['businesses', id],
  BUSINESS_REVIEWS: (id: number) => ['businesses', id, 'reviews'],
  BUSINESS_STATS: (id: number) => ['businesses', id, 'stats'],
  MY_BUSINESSES: ['businesses', 'my'],
  REVIEWS: ['reviews'],
  REVIEW_DETAIL: (id: number) => ['reviews', id],
  MY_REVIEWS: ['reviews', 'my'],
  RANKINGS: ['rankings'],
  RANKINGS_TOP: ['rankings', 'top'],
  CATEGORIES: ['categories'],
  CRITERIA: ['criteria'],
  NOTIFICATIONS: ['notifications'],
  UNREAD_COUNT: ['notifications', 'unread-count'],
  REPORTS: ['reports'],
  MY_REPORTS: ['reports', 'my'],
  REPORT_REASONS: ['reports', 'reasons'],
} as const
```

---

## Task P0.7: Providers

**Create:** `app/providers.tsx`

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  )
}
```

---

## Task P0.8: Root Layout

**File:** `app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'EERS - Enterprise Evaluation & Ranking System',
  description: 'Rate and rank businesses with confidence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## Task P0.9: Auth Hook

**Create:** `app/hooks/use-auth.ts`

```typescript
'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient, { setAccessToken, getAccessToken } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'

export interface User {
  userId: number
  name: string
  email: string
  avatarUrl: string | null
  role: 'USER' | 'BUSINESS_OWNER' | 'ADMIN'
  status: 'active' | 'inactive' | 'banned'
  createdAt: string
}

export function useAuth() {
  const queryClient = useQueryClient()

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: QUERY_KEYS.AUTH_ME,
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: User }>(
        '/auth/me'
      )
      return response.data.data
    },
    retry: false,
  })

  const isAuthenticated = !!user && !error

  const logout = () => {
    setAccessToken(null)
    queryClient.clear()
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    logout,
    setAccessToken,
    getAccessToken,
  }
}
```

---

## Task P0.10: Home Page

**File:** `app/page.tsx`

```typescript
'use client'

import { useAuth } from './hooks/use-auth'
import Link from 'next/link'

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-gray-900">
            Welcome to EERS
          </h1>
          <p className="text-xl text-gray-600">
            Enterprise Evaluation & Ranking System
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-4 text-gray-600">Role: {user?.role}</p>
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 0 Checkpoint

```bash
pnpm dev
# Should see: http://localhost:3001 ✓
# No hydration errors ✓
# Can see login/register buttons ✓
```

---

## Phase 1: Authentication

---

## Task P1.1: Auth Schemas

**Create:** `app/features/auth/schemas/auth.schema.ts`

```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>
```

---

## Task P1.2: Login Mutation

**Create:** `app/features/auth/mutations/use-login.mutation.ts`

```typescript
'use client'

import { useMutation } from '@tanstack/react-query'
import apiClient, { setAccessToken } from '@/lib/api-client'
import { LoginInput } from '../schemas/auth.schema'

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: {
    userId: number
    name: string
    role: 'USER' | 'BUSINESS_OWNER' | 'ADMIN'
  }
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await apiClient.post<{
        success: boolean
        data: LoginResponse
      }>('/auth/login', input)

      return response.data.data
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
    },
  })
}
```

---

## Task P1.3: Register Mutation

**Create:** `app/features/auth/mutations/use-register.mutation.ts`

```typescript
'use client'

import { useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import { RegisterInput } from '../schemas/auth.schema'

export interface RegisterResponse {
  userId: number
  name: string
  email: string
  role: 'USER'
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (input: Omit<RegisterInput, 'confirmPassword'>) => {
      const response = await apiClient.post<{
        success: boolean
        data: RegisterResponse
      }>('/auth/register', input)

      return response.data.data
    },
  })
}
```

---

## Task P1.4: Logout Mutation

**Create:** `app/features/auth/mutations/use-logout.mutation.ts`

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient, { setAccessToken } from '@/lib/api-client'

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout')
    },
    onSuccess: () => {
      setAccessToken(null)
      queryClient.clear()
    },
  })
}
```

---

## Task P1.5: Login Form

**Create:** `app/features/auth/components/login-form.tsx`

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { loginSchema, LoginInput } from '../schemas/auth.schema'
import { useLoginMutation } from '../mutations/use-login.mutation'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const loginMutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      await loginMutation.mutateAsync(data)

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.AUTH_ME,
      })

      toast.success('Logged in successfully!')
      router.push('/')
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Login failed'
      toast.error(message)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            {...register('password')}
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="text-indigo-600 font-semibold">
            Register here
          </a>
        </p>
      </div>
    </div>
  )
}
```

---

## Task P1.6: Register Form

**Create:** `app/features/auth/components/register-form.tsx`

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { registerSchema, RegisterInput } from '../schemas/auth.schema'
import { useRegisterMutation } from '../mutations/use-register.mutation'
import { toast } from 'sonner'

export function RegisterForm() {
  const router = useRouter()
  const registerMutation = useRegisterMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
      })

      toast.success('Account created! Redirecting to login...')
      router.push('/login')
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Registration failed'
      toast.error(message)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            {...register('password')}
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <input
            {...register('confirmPassword')}
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {registerMutation.isPending ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-600 font-semibold">
            Login here
          </a>
        </p>
      </div>
    </div>
  )
}
```

---

## Task P1.7: Auth Layout

**Create:** `app/(auth)/layout.tsx`

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center">
      {children}
    </div>
  )
}
```

---

## Task P1.8: Login Page

**Create:** `app/(auth)/login/page.tsx`

```typescript
'use client'

import { LoginForm } from '@/features/auth/components/login-form'

export default function LoginPage() {
  return <LoginForm />
}
```

---

## Task P1.9: Register Page

**Create:** `app/(auth)/register/page.tsx`

```typescript
'use client'

import { RegisterForm } from '@/features/auth/components/register-form'

export default function RegisterPage() {
  return <RegisterForm />
}
```

---

## Task P1.10: Middleware

**Create:** `app/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = [
  '/profile',
  '/businesses/my',
  '/businesses/create',
  '/reviews/my',
  '/notifications',
  '/admin',
]

const authRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const refreshToken = request.cookies.get('refreshToken')?.value

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtected && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && refreshToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## Task P1.11: Update Home Page with Logout

**File:** `app/page.tsx`

```typescript
'use client'

import { useAuth } from './hooks/use-auth'
import { useLogoutMutation } from '@/features/auth/mutations/use-logout.mutation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const logoutMutation = useLogoutMutation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-gray-900">
            Welcome to EERS
          </h1>
          <p className="text-xl text-gray-600">
            Enterprise Evaluation & Ranking System
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600">Role: {user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/businesses"
            className="p-4 border rounded-lg hover:shadow-lg transition"
          >
            <h3 className="font-semibold mb-2">Businesses</h3>
            <p className="text-sm text-gray-600">Browse and rate businesses</p>
          </Link>

          <Link
            href="/rankings"
            className="p-4 border rounded-lg hover:shadow-lg transition"
          >
            <h3 className="font-semibold mb-2">Rankings</h3>
            <p className="text-sm text-gray-600">View top businesses</p>
          </Link>

          <Link
            href="/profile"
            className="p-4 border rounded-lg hover:shadow-lg transition"
          >
            <h3 className="font-semibold mb-2">Profile</h3>
            <p className="text-sm text-gray-600">Manage your account</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## Final Checkpoint

```bash
pnpm dev
```

✅ Test checklist:
- [ ] http://localhost:3001 shows login buttons
- [ ] Register form works
- [ ] Login form works
- [ ] After login, shows user name
- [ ] Logout button works
- [ ] Clicking logout redirects to /login
- [ ] Protected routes redirect to /login
- [ ] No console errors
- [ ] TanStack Query DevTools shows queries