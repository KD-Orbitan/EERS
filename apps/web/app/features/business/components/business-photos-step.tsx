'use client';

import { useIsMutating } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CoverUpload } from './cover-upload';
import { LogoUpload } from './logo-upload';
import { GalleryManager } from './gallery-manager';
import { useBusinessDetailQuery } from '../queries/use-business-detail.query';

export function BusinessPhotosStep({ businessId, onDone }: { businessId: number; onDone: () => void }) {
  const { data, isPending, isError, refetch } = useBusinessDetailQuery(businessId);
  const mutations = useIsMutating();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-ink-900">Add business photos</h2>
        <p className="mt-2 text-sm text-ink-700">Your business has been saved. Add a logo, cover and gallery photos now, or finish and add them later. Each photo is saved as you upload it.</p>
      </div>
      {isPending ? <p role="status">Loading photos...</p> : null}
      {isError ? <div role="alert">Unable to load photos. Your business is saved. <Button variant="outline" onClick={() => refetch()}>Try again</Button></div> : null}
      {data ? <>
        <div className="relative h-56 overflow-hidden rounded-2xl">
          <CoverUpload businessId={businessId} coverUrl={data.coverUrl} isOwner />
          <div className="absolute left-6 top-6"><LogoUpload businessId={businessId} logoUrl={data.logoUrl} isOwner /></div>
        </div>
        <GalleryManager businessId={businessId} gallery={data.gallery} isOwner />
      </> : null}
      <div className="flex justify-end"><Button onClick={onDone} disabled={mutations > 0}>{mutations > 0 ? 'Saving photos...' : 'Finish'}</Button></div>
    </section>
  );
}
