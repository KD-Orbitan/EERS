'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { NotificationBell } from '@/features/notification/components/notification-bell';
import { SiteFooter } from '@/components/site-footer';

// Nav links mirror the Figma "Landing Page" TopNavBar (node 1:590) — minus
// "Analytics", which has no backing page/feature in this app, per explicit
// product decision. "Directory" is active on both `/` (the landing/search
// page itself, per the Figma screenshot) and `/businesses`.
const NAV_LINKS = [
  { href: '/businesses', label: 'Directory', isActive: (pathname: string) => pathname === '/' || pathname.startsWith('/businesses') },
  { href: '/rankings', label: 'Leaderboards', isActive: (pathname: string) => pathname.startsWith('/rankings') },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-serif text-lg font-bold text-primary-600">
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
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition hover:bg-slate-100"
                >
                  <UserCircle2 className="h-6 w-6" />
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-primary-700"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <SiteFooter />
    </div>
  );
}
