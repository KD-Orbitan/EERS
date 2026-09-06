'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { MapPin } from '@/features/business/components/business-directory-map';
import type { BusinessLocation } from '@/features/business/types/business.type';

const LocationMap = dynamic(
  () => import('@/features/business/components/business-directory-map').then((module) => module.BusinessDirectoryMap),
  {
    ssr: false,
    loading: () => (
      <div role="status" className="flex h-full items-center justify-center rounded-3xl bg-ink-50 text-sm text-ink-500">
        Loading map...
      </div>
    ),
  },
);

interface BusinessLocationMapProps {
  businessId: number;
  locations: BusinessLocation[];
}

export function BusinessLocationMap({ businessId, locations }: BusinessLocationMapProps) {
  const pins = useMemo<MapPin[]>(() => locations.flatMap((location) => {
    const { latitude, longitude } = location;
    if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return [];

    return [{
      businessId,
      locationId: location.locationId,
      name: [location.addressLine, location.ward, location.province].filter(Boolean).join(', '),
      latitude,
      longitude,
    }];
  }), [businessId, locations]);

  if (pins.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-ink-200 p-4 text-sm text-ink-500">
        Map unavailable for these locations.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div role="region" aria-label="Business locations map" className="h-[400px]">
        <LocationMap pins={pins} />
      </div>
      {pins.length < locations.length ? (
        <p className="mt-2 text-xs text-ink-500">Some locations are not available on the map yet.</p>
      ) : null}
    </div>
  );
}
