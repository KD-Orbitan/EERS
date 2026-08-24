'use client';

import { BusinessListParams } from '@/features/business/queries/use-businesses.query';

const TABS: { label: string; sortBy: NonNullable<BusinessListParams['sortBy']> }[] = [
  { label: 'Top Rated', sortBy: 'avgRating' },
  { label: 'Newest', sortBy: 'createdAt' },
  { label: 'Growth', sortBy: 'reviewCount' },
];

interface BusinessSortTabsProps {
  sortBy: NonNullable<BusinessListParams['sortBy']>;
  onSortByChange: (sortBy: NonNullable<BusinessListParams['sortBy']>) => void;
}

// Mirrors Figma "Header - TopNavBar" sort pill group (node 1:74): white pill
// container with a "SORT BY" label and 3 buttons, active tab filled primary-500.
export function BusinessSortTabs({ sortBy, onSortByChange }: BusinessSortTabsProps) {
  return (
    <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-[5px] shadow-xs">
      <span className="pl-2 text-xs font-medium uppercase tracking-wide text-ink-500">Sort by</span>
      {TABS.map((tab) => {
        const isActive = tab.sortBy === sortBy;
        return (
          <button
            key={tab.sortBy}
            type="button"
            onClick={() => onSortByChange(tab.sortBy)}
            className={`rounded-lg px-4 py-1 font-sans text-sm font-bold transition ${
              isActive ? 'bg-primary-500 text-white' : 'text-ink-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
