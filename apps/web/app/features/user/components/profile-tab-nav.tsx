'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Building2, ChevronDown, Flag, KeyRound, MessageSquareText, Pencil } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type ProfileTab = 'reviews' | 'edit' | 'change-password' | 'businesses' | 'bookmarks' | 'reports';

interface TabConfig {
  tab: ProfileTab;
  label: string;
  icon: typeof Pencil;
}

const TABS: TabConfig[] = [
  { tab: 'edit', label: 'Edit Profile', icon: Pencil },
  { tab: 'change-password', label: 'Change Password', icon: KeyRound },
  { tab: 'reviews', label: 'My Reviews', icon: MessageSquareText },
  { tab: 'businesses', label: 'My Businesses', icon: Building2 },
  { tab: 'bookmarks', label: 'My Bookmarks', icon: Bookmark },
  { tab: 'reports', label: 'My Reports', icon: Flag },
];

function tabHref(tab: ProfileTab) {
  return tab === 'reviews' ? '/profile' : `/profile?tab=${tab}`;
}

function tabLinkClassName(isActive: boolean) {
  return `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-primary-600 text-white' : 'text-ink-700 hover:bg-primary-50'
  }`;
}

// Reserved pixel budget for the "More" pill when deciding how many tabs fit
// — sidesteps measuring the pill itself, which only exists in the DOM once
// we already know it's needed.
const MORE_BUTTON_BUDGET_PX = 110;
const ITEM_GAP_PX = 4;

interface ProfileTabNavProps {
  activeTab: ProfileTab;
}

// Desktop (lg:): plain vertical list — always fits in the 320px sidebar
// column, no overflow logic needed. Mobile/tablet: horizontal row that
// measures its own items and moves whatever doesn't fit into a "More"
// dropdown (priority-nav pattern).
export function ProfileTabNav({ activeTab }: ProfileTabNavProps) {
  return (
    <>
      <nav className="hidden flex-col gap-1 lg:flex">
        {TABS.map(({ tab, label, icon: Icon }) => (
          <Link key={tab} href={tabHref(tab)} className={tabLinkClassName(activeTab === tab)}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <MobileProfileTabNav activeTab={activeTab} />
    </>
  );
}

function MobileProfileTabNav({ activeTab }: ProfileTabNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<Array<HTMLElement | null>>([]);
  const [visibleCount, setVisibleCount] = useState(TABS.length);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const recalc = () => {
      const widths = measureRefs.current.map((el) => el?.offsetWidth ?? 0);
      const containerWidth = container.offsetWidth;
      const totalWidth = widths.reduce((sum, width, index) => sum + width + (index > 0 ? ITEM_GAP_PX : 0), 0);

      if (totalWidth <= containerWidth) {
        setVisibleCount(TABS.length);
        return;
      }

      let used = 0;
      let count = 0;
      for (let i = 0; i < TABS.length; i++) {
        const next = used + widths[i] + (i > 0 ? ITEM_GAP_PX : 0);
        if (next > containerWidth - MORE_BUTTON_BUDGET_PX) break;
        used = next;
        count += 1;
      }
      setVisibleCount(count);
    };

    const observer = new ResizeObserver(recalc);
    observer.observe(container);
    recalc();
    return () => observer.disconnect();
  }, []);

  const visibleTabs = TABS.slice(0, visibleCount);
  const overflowTabs = TABS.slice(visibleCount);
  const isOverflowActive = overflowTabs.some((item) => item.tab === activeTab);

  return (
    <nav ref={containerRef} className="relative flex items-center gap-1 overflow-hidden lg:hidden">
      {/* Off-screen measurement row: renders every tab once to get its
          natural width, independent of how many are currently visible. */}
      <div className="pointer-events-none absolute -z-10 flex gap-1 opacity-0" aria-hidden="true">
        {TABS.map(({ tab, label, icon: Icon }, index) => (
          <span
            key={tab}
            ref={(el) => {
              measureRefs.current[index] = el;
            }}
            className={tabLinkClassName(false)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </span>
        ))}
      </div>

      {visibleTabs.map(({ tab, label, icon: Icon }) => (
        <Link key={tab} href={tabHref(tab)} className={tabLinkClassName(activeTab === tab)}>
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}

      {overflowTabs.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={tabLinkClassName(isOverflowActive)}>
              More
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {overflowTabs.map(({ tab, label, icon: Icon }) => (
              <DropdownMenuItem key={tab} asChild>
                <Link href={tabHref(tab)}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </nav>
  );
}
