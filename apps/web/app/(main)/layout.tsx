'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, UserCircle2, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { NotificationBell } from '@/features/notification/components/notification-bell';
import { SiteFooter } from '@/components/site-footer';

// Nav links mirror the Figma "Landing Page" TopNavBar (node 1:590) — minus
// "Analytics", which has no backing feature/page in this app, per explicit
// product decision. "Home" is an addition beyond the Figma mockup so `/`
// itself is reachable and highlighted from the nav, rather than lighting up
// "Directory" while on the landing page. "For Business" is an addition
// beyond the Figma mockup, pointing at the new business-owner marketing page
// (app/(main)/for-business).
const NAV_LINKS = [
  { href: '/', label: 'Home', isActive: (pathname: string) => pathname === '/' },
  { href: '/businesses', label: 'Directory', isActive: (pathname: string) => pathname.startsWith('/businesses') },
  { href: '/rankings', label: 'Leaderboards', isActive: (pathname: string) => pathname.startsWith('/rankings') },
  { href: '/for-business', label: 'For Business', isActive: (pathname: string) => pathname.startsWith('/for-business') },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMobileNavOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-ink-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-sans text-lg font-bold text-primary-600">
              EERS
            </Link>
            <nav className="hidden items-center gap-6 sm:flex">
              {NAV_LINKS.map((link) => {
                const active = link.isActive(pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`pb-1.5 text-sm font-semibold transition ${
                      active ? 'border-b-2 border-primary-600 text-primary-600' : 'text-ink-700 hover:text-primary-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {isLoading ? null : isAuthenticated ? (
              <>
                <NotificationBell enabled={isAuthenticated} />
                <Link
                  href="/profile"
                  aria-label={user?.name ?? 'Profile'}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-100"
                >
                  <UserCircle2 className="h-6 w-6" />
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="ease-md rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-primary-700 hover:shadow-md active:scale-95"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((open) => !open)}
              aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileNavOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-100 sm:hidden"
            >
              {isMobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMobileNavOpen ? (
          <nav className="border-t border-ink-200 bg-ink-50 sm:hidden">
            <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
              {NAV_LINKS.map((link) => {
                const active = link.isActive(pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      active ? 'text-primary-600' : 'text-ink-700 hover:text-primary-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
      </header>

      <div className="flex-1">{children}</div>

      <SiteFooter />
    </div>
  );
}
