'use client';

import Link from 'next/link';
import { Cpu, GraduationCap, HeartPulse, Landmark, ShoppingBag, Building2, type LucideIcon } from 'lucide-react';
import { useCategoriesQuery } from '@/features/business/queries/use-categories.query';

// Mirrors Figma "Section - Category Grid" (node 1:369, "Explore by Sector").
// The mockup shows a fake per-category business count ("1,240 Businesses")
// that GET /categories has no field for — omitted rather than fabricated,
// same principle as dropping the Figma "Overall Score/A+" grade elsewhere.
// Icons are matched to this project's actual seeded category names (REFERENCE.md
// Section 15), not the mockup's fictional FinTech/SaaS/Logistics/HealthTech set.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Information Technology': Cpu,
  Education: GraduationCap,
  Healthcare: HeartPulse,
  Finance: Landmark,
  Retail: ShoppingBag,
};

const CATEGORY_TINTS = ['bg-primary-600/10 text-primary-600', 'bg-info-100 text-info-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700'];

export function CategoryGridSection() {
  const { data: categories, isLoading } = useCategoriesQuery();

  if (!isLoading && (!categories || categories.length === 0)) {
    return null;
  }

  return (
    <div className="bg-primary-50/40 px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h2 className="font-sans text-3xl font-bold text-ink-900">Explore by Sector</h2>
          <p className="mt-2 text-base text-ink-700">Specialized rankings tailored to vertical-specific metrics.</p>
        </div>

        {isLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 w-48 shrink-0 animate-pulse rounded-2xl bg-white shadow-xs ring-1 ring-slate-200" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            <div className="animate-marquee flex w-max gap-4">
              {[...categories!, ...categories!].map((category, index) => {
                const Icon = CATEGORY_ICONS[category.categoryName] ?? Building2;
                const tint = CATEGORY_TINTS[index % CATEGORY_TINTS.length];
                return (
                  <Link
                    key={`${category.categoryId}-${index}`}
                    href={`/businesses?categoryId=${category.categoryId}`}
                    className="flex w-48 shrink-0 flex-col items-center gap-3 rounded-2xl border border-white bg-white p-6 text-center shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-sans text-sm font-semibold text-ink-900">{category.categoryName}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
