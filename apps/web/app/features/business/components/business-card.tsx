'use client';

import Link from 'next/link';
import { ArrowRight, LayoutDashboard, MapPin, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BusinessLogoBadge } from '@/features/business/components/business-logo-badge';
import { BusinessCategory, BusinessStatus } from '@/features/business/types/business.type';

export interface BusinessCardData {
  businessId: number;
  name: string;
  status: BusinessStatus;
  avgRating: number;
  reviewCount?: number;
  province?: string | null;
  categories?: BusinessCategory[];
  description?: string | null;
  logoUrl?: string | null;
}

const statusVariant: Record<BusinessStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  hidden: 'neutral',
};

interface BusinessCardProps {
  business: BusinessCardData;
  onDelete?: (businessId: number) => void;
}

// Layout mirrors Figma "Card 1" (node 1:84): avatar+badge row, name, rating,
// tag pills, divider, "View Profile" link. The avatar slot shows the
// business's logo (imageType='BUSINESS_LOGO') when set, generic icon otherwise.
export function BusinessCard({ business, onDelete }: BusinessCardProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <BusinessLogoBadge logoUrl={business.logoUrl} name={business.name} />
          <Badge variant={statusVariant[business.status]}>{business.status}</Badge>
        </div>

        <Link href={`/businesses/${business.businessId}`}>
          <h3 className="truncate font-sans text-lg font-bold text-ink-900 hover:text-primary-600">
            {business.name}
          </h3>
        </Link>

        <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span>{business.avgRating.toFixed(1)}</span>
          {typeof business.reviewCount === 'number' ? (
            <span className="font-normal text-ink-700">({business.reviewCount} reviews)</span>
          ) : null}
        </div>

        {business.province ? (
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-700">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{business.province}</span>
          </div>
        ) : null}

        {business.categories && business.categories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {business.categories.map((category) => (
              <Badge key={category.categoryId} variant="brand">
                {category.categoryName}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
        <Link
          href={`/businesses/${business.businessId}`}
          className="inline-flex items-center gap-1 font-sans text-sm font-bold text-primary-600 hover:text-primary-700"
        >
          View Profile
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {onDelete ? (
          <div className="flex items-center gap-1">
            <Link
              href={`/businesses/${business.businessId}/dashboard`}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary-600 transition hover:bg-primary-50"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => onDelete(business.businessId)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
