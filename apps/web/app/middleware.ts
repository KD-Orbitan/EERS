import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/profile', '/businesses', '/reviews', '/notifications', '/admin'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isProtectedRoute = protectedRoutes.some((route) => {
    if (route === '/businesses') {
      return pathname.startsWith('/businesses');
    }
    if (route === '/reviews') {
      return pathname.startsWith('/reviews');
    }
    if (route === '/admin') {
      return pathname.startsWith('/admin');
    }

    return pathname === route || pathname.startsWith(`${route}/`);
  });

  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && refreshToken) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
