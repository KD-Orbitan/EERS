'use client';

import Link from 'next/link';
import { LayoutDashboard, Building2, MessageSquareText, Flag, Users, Sliders, Scale, Bell, TrendingUp, Tags } from 'lucide-react';
import { useUnreadCountQuery } from '@/features/notification/queries/use-unread-count.query';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/businesses', label: 'Business Verification', icon: Building2 },
  { href: '/admin/reviews', label: 'Review Moderation', icon: MessageSquareText },
  { href: '/admin/reports', label: 'Report Management', icon: Flag },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/settings/categories', label: 'Categories & Criteria', icon: Tags },
  { href: '/admin/settings/scoring', label: 'Scoring Config', icon: Sliders },
  { href: '/admin/settings/weights', label: 'Criterion Weights', icon: Scale },
  { href: '/admin/settings/ranking-trend', label: 'Ranking Trend', icon: TrendingUp },
];

// Sidebar nav adapted from Figma "Admin Command Center" / "Business
// Verification" — dropped Industry Insights/Rating Analysis/Audit Logs/
// Export Report/Support links since none have a backing feature or page.
// Notifications links to the shared /notifications inbox (same page regular
// users get) rather than a bespoke admin bell, since admin notifications use
// the same personal-inbox model as every other role.
export function AdminSidebar({ currentPath }: { currentPath: string }) {
  const { data: unreadCount = 0 } = useUnreadCountQuery(true);

  return (
    <nav className="flex w-60 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-4">
      <div className="mb-4 px-2">
        <p className="font-sans text-lg font-bold text-ink-900">Admin Panel</p>
        <p className="text-xs text-ink-500">EERS moderation &amp; config</p>
      </div>
      <Link
        href="/notifications"
        className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          currentPath === '/notifications' ? 'bg-primary-600 text-white' : 'text-ink-700 hover:bg-primary-50'
        }`}
      >
        <Bell className="h-4 w-4 shrink-0" />
        Notifications
        {unreadCount > 0 ? (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Link>
      <div className="my-2 border-t border-slate-100" />
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/admin' ? currentPath === '/admin' : currentPath.startsWith(href);
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
