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

export function CategoryGridSection() {
  const { data: categories, isLoading } = useCategoriesQuery();

  if (!isLoading && (!categories || categories.length === 0)) {
    return null;
  }

  return (
    <div className="bg-primary-50/40 px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">Explore by Sector</h2>
          <p className="mt-2 text-base text-ink-600">Specialized rankings tailored to vertical-specific metrics.</p>
        </div>

        {isLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 w-48 shrink-0 animate-pulse rounded-2xl bg-primary-50 shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            <div className="animate-marquee flex w-max gap-4">
              {[...categories!, ...categories!].map((category, index) => {
                const Icon = CATEGORY_ICONS[category.categoryName] ?? Building2;
                return (
                  <Link
                    key={`${category.categoryId}-${index}`}
                    href={`/businesses?categoryId=${category.categoryId}`}
                    className="ease-md group flex w-48 shrink-0 flex-col items-center gap-3 rounded-2xl bg-primary-50 p-6 text-center shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-ink-900">{category.categoryName}</span>
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
