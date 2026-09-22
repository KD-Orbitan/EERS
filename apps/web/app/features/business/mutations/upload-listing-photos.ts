import apiClient from '@/lib/api-client';
import type { ListingPhotos } from '../components/listing-photo-picker';

// Upload gallery files individually so a failed file can be retried without
// re-uploading the files which have already succeeded.
export async function uploadListingPhotos(businessId: number, photos: ListingPhotos): Promise<ListingPhotos> {
  const failed: ListingPhotos = { gallery: [] };
  const upload = async (endpoint: string, field: string, file: File) => {
    const body = new FormData(); body.append(field, file);
    await apiClient.post(`/businesses/${businessId}/${endpoint}`, body);
  };
  for (const kind of ['logo', 'cover'] as const) {
    const file = photos[kind];
    if (file) { try { await upload(kind, kind, file); } catch { failed[kind] = file; } }
  }
  for (const file of photos.gallery) {
    try { await upload('gallery', 'images', file); } catch { failed.gallery.push(file); }
  }
  return failed;
}
export function hasListingPhotos(photos: ListingPhotos) { return Boolean(photos.logo || photos.cover || photos.gallery.length); }
