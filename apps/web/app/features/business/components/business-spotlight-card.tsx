import Link from 'next/link';
import { ArrowRight, MapPin, Star, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BusinessLogoBadge } from '@/features/business/components/business-logo-badge';
import { BusinessListItem } from '@/features/business/types/business.type';

interface BusinessSpotlightCardProps {
  business: BusinessListItem;
}

// Featured card above the directory grid for the #1 result of the current
// search/filter (or the global top when nothing is filtered) — items[0] of
// the already avgRating-sorted GET /businesses response, not a separate
// ranking system. See businesses/page.tsx for the selection logic.
export function BusinessSpotlightCard({ business }: BusinessSpotlightCardProps) {
  return (
    <Link
      href={`/businesses/${business.businessId}`}
      className="group flex flex-col gap-6 rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-8 shadow-md transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <BusinessLogoBadge logoUrl={business.logoUrl} name={business.name} size="lg" />
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            <Trophy className="h-3.5 w-3.5" />
            Top Pick
          </span>
          <h2 className="mt-2 font-sans text-2xl font-bold text-ink-900">{business.name}</h2>
          {business.description ? <p className="mt-1 max-w-xl text-sm text-ink-700">{business.description}</p> : null}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-700">
            <span className="flex items-center gap-1 font-bold text-ink-900">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {business.avgRating.toFixed(1)}
            </span>
            <span>({business.reviewCount} reviews)</span>
            {business.province ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {business.province}
              </span>
            ) : null}
          </div>

          {business.categories.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {business.categories.map((category) => (
                <Badge key={category.categoryId} variant="brand">
                  {category.categoryName}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <span className="inline-flex shrink-0 items-center gap-1 font-sans text-sm font-bold text-primary-600 transition group-hover:gap-2">
        View Profile
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
