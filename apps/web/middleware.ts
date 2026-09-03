import { NextRequest, NextResponse } from 'next/server';
import { AUTH_HINT_COOKIE } from './app/lib/constants';

const protectedRoutes = ['/profile', '/reviews', '/reports', '/notifications', '/admin', '/bookmarks'];
const authRoutes = ['/login', '/register'];

function isProtectedBusinessRoute(pathname: string) {
  return (
    pathname === '/businesses/create' ||
    pathname === '/businesses/my' ||
    /^\/businesses\/[^/]+\/edit$/.test(pathname) ||
    /^\/businesses\/[^/]+\/dashboard$/.test(pathname) ||
    /^\/businesses\/[^/]+\/dashboard\/reviews$/.test(pathname) ||
    /^\/businesses\/[^/]+\/reviews\/write$/.test(pathname)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // The real refreshToken cookie is scoped to the API's domain (Render), not
  // the web app's (Vercel) — the browser never sends it to a request headed
  // here, so middleware can't read it directly. Read the same-site hint
  // cookie the web app sets on login/logout instead (see use-auth.ts,
  // use-login.mutation.ts). This is a UX redirect only, not the real auth
  // boundary — that's JwtAuthGuard/RolesGuard server-side.
  const authHint = request.cookies.get(AUTH_HINT_COOKIE)?.value

  const isProtectedRoute =
    isProtectedBusinessRoute(pathname) ||
    protectedRoutes.some((route) => {
      if (route === '/reviews') return pathname.startsWith('/reviews');
      if (route === '/admin') return pathname.startsWith('/admin');
      return pathname === route || pathname.startsWith(`${route}/`);
    });

  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute && !authHint) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && authHint) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
