'use client';

import Link from 'next/link';
import { LayoutDashboard, MessageSquareText, Pencil, Building2 } from 'lucide-react';

interface OwnerDashboardSidebarProps {
  businessId: number;
  currentPath: string;
}

// Mirrors the AdminSidebar template (features/admin/components/admin-sidebar.tsx):
// only links to pages that actually exist — no Industry Insights/Location Mapping/
// Audit Logs/Export Report items, same "don't link to nothing" precedent used there.
// Sticky on large screens only (same lg:sticky/lg:top-20 offset — clearing the
// site header's own sticky height — used by the directory map sidebar), so it
// stays in view while the dashboard content scrolls; on smaller screens it
// stays in normal flow since there's no room to pin it beside the content.
export function OwnerDashboardSidebar({ businessId, currentPath }: OwnerDashboardSidebarProps) {
  const navItems = [
    { href: `/businesses/${businessId}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/businesses/${businessId}/dashboard/reviews`, label: 'Reviews & Replies', icon: MessageSquareText },
    { href: `/businesses/${businessId}/edit`, label: 'Business Profile', icon: Pencil },
    { href: `/businesses/${businessId}`, label: 'View Public Profile', icon: Building2 },
  ];

  return (
    <nav className="flex w-60 shrink-0 flex-col gap-1 border-r border-ink-200 bg-ink-50 p-4 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto">
      <div className="mb-4 px-2">
        <p className="font-sans text-lg font-bold text-ink-900">Owner Dashboard</p>
        <p className="text-xs text-ink-500">Manage your business</p>
      </div>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = currentPath === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-primary-600 text-white' : 'text-ink-700 hover:bg-primary-50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
