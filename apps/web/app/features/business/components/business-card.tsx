'use client';

import Link from 'next/link';
import { ArrowRight, Building2, MapPin, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
// tag pills, divider, "View Profile" link. There is no logo/photo field on
// Business, so the avatar slot uses a generic icon instead of an image.
export function BusinessCard({ business, onDelete }: BusinessCardProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>
          <Badge variant={statusVariant[business.status]}>{business.status}</Badge>
        </div>

        <Link href={`/businesses/${business.businessId}`}>
          <h3 className="truncate font-serif text-lg font-bold text-ink-900 hover:text-primary-600">
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
          className="inline-flex items-center gap-1 font-serif text-sm font-bold text-primary-600 hover:text-primary-700"
        >
          View Profile
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(business.businessId)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}
