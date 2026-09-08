'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AdminSidebar } from '@/features/admin/components/admin-sidebar';

// Middleware already redirects unauthenticated visitors away from /admin/*
// (cookie-presence check). Role can't be checked in middleware — the
// refreshToken JWT only carries { sub: userId }, no role claim (see
// refresh-token.use-case.ts) — so, same pattern as the business-ownership
// check in businesses/[id]/edit/page.tsx, the ADMIN gate here is a
// client-side redirect for UX only. The real boundary is RolesGuard on
// every admin endpoint server-side.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-50">
        <p className="text-sm text-ink-600">Loading...</p>
      </main>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <AdminSidebar currentPath={pathname} />
      <div className="min-w-0 flex-1 px-6 py-8 sm:px-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
