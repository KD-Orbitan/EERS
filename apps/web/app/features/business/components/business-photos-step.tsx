'use client';

import { useState } from 'react';
import { ListingPhotoPicker, emptyListingPhotos, type ListingPhotos } from './listing-photo-picker';
import { uploadListingPhotos, hasListingPhotos } from '../mutations/upload-listing-photos';
import { useIsMutating } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CoverUpload } from './cover-upload';
import { LogoUpload } from './logo-upload';
import { GalleryManager } from './gallery-manager';
import { useBusinessDetailQuery } from '../queries/use-business-detail.query';

export function BusinessPhotosStep({ businessId, onDone, initialFailedPhotos }: { businessId: number; onDone: () => void; initialFailedPhotos?: ListingPhotos }) {
  const [failed, setFailed] = useState<ListingPhotos>(initialFailedPhotos ?? emptyListingPhotos());
  const [retrying, setRetrying] = useState(false);
  const retryPhotos = async () => {
    setRetrying(true);
    try { setFailed(await uploadListingPhotos(businessId, failed)); await refetch(); }
    finally { setRetrying(false); }
  };
  const { data, isPending, isError, refetch } = useBusinessDetailQuery(businessId);
  const mutations = useIsMutating();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-ink-900">Review business photos</h2>
        <p className="mt-2 text-sm text-ink-700">Your business has been saved. Add a logo, cover and gallery photos now, or finish and add them later. Each photo is saved as you upload it.</p>
      </div>
      {isPending ? <p role="status">Loading photos...</p> : null}
      {isError ? <div role="alert">Unable to load photos. Your business is saved. <Button variant="outline" onClick={() => refetch()}>Try again</Button></div> : null}
      {hasListingPhotos(failed) ? <div className="space-y-3">
        <p role="alert" className="text-sm text-red-600">Your business is saved. These photos still need uploading. Retry or remove them to finish.</p>
        <ListingPhotoPicker value={failed} onChange={setFailed} disabled={retrying} />
        <Button type="button" onClick={retryPhotos} disabled={retrying}>{retrying ? 'Uploading...' : 'Retry selected photos'}</Button>
      </div> : null}
      {data && !hasListingPhotos(failed) ? <>
        <div className="relative h-56 overflow-hidden rounded-2xl">
          <CoverUpload businessId={businessId} coverUrl={data.coverUrl} isOwner />
          <div className="absolute left-6 top-6"><LogoUpload businessId={businessId} logoUrl={data.logoUrl} isOwner /></div>
        </div>
        <GalleryManager businessId={businessId} gallery={data.gallery} isOwner />
      </> : null}
      <div className="flex justify-end"><Button onClick={onDone} disabled={mutations > 0 || retrying || hasListingPhotos(failed)}>{mutations > 0 ? 'Saving photos...' : 'Finish'}</Button></div>
    </section>
  );
}
