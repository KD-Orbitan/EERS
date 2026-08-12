import { NextRequest, NextResponse } from 'next/server';

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
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isProtectedRoute =
    isProtectedBusinessRoute(pathname) ||
    protectedRoutes.some((route) => {
      if (route === '/reviews') return pathname.startsWith('/reviews');
      if (route === '/admin') return pathname.startsWith('/admin');
      return pathname === route || pathname.startsWith(`${route}/`);
    });

  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && refreshToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
