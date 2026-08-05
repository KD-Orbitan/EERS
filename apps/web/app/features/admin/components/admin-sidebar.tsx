'use client';

import Link from 'next/link';
import { LayoutDashboard, Building2, MessageSquareText, Sliders, Scale } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/businesses', label: 'Business Verification', icon: Building2 },
  { href: '/admin/reviews', label: 'Review Moderation', icon: MessageSquareText },
  { href: '/admin/settings/scoring', label: 'Scoring Config', icon: Sliders },
  { href: '/admin/settings/weights', label: 'Criterion Weights', icon: Scale },
];

// Sidebar nav adapted from Figma "Admin Command Center" / "Business
// Verification" — dropped Industry Insights/Rating Analysis/Audit Logs/
// Export Report/Support links since none have a backing feature or page.
export function AdminSidebar({ currentPath }: { currentPath: string }) {
  return (
    <nav className="flex w-60 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-4">
      <div className="mb-4 px-2">
        <p className="font-serif text-lg font-bold text-ink-900">Admin Panel</p>
        <p className="text-xs text-ink-500">EERS moderation &amp; config</p>
      </div>
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
