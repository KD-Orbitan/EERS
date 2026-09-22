'use client';
import { useEffect, useRef, useState } from 'react';
import { ALLOWED_IMAGE_ACCEPT, validateImageFile } from '@/lib/image-upload';

export type ListingPhotos = { logo?: File; cover?: File; gallery: File[] };
export const emptyListingPhotos = (): ListingPhotos => ({ gallery: [] });

function PhotoPreview({ file, onRemove, disabled }: { file: File; onRemove: () => void; disabled?: boolean }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => { const url = URL.createObjectURL(file); if (image.current) image.current.src = url; return () => URL.revokeObjectURL(url); }, [file]);
  return <div className="w-28 space-y-1">
    {/* eslint-disable-next-line @next/next/no-img-element -- local file preview */}
    <img ref={image} alt={file.name} className="h-24 w-28 rounded-lg object-cover" />
    <p className="truncate text-xs" title={file.name}>{file.name}</p>
    <button type="button" disabled={disabled} onClick={onRemove} className="text-xs text-red-600">Remove {file.name}</button>
  </div>;
}
export function ListingPhotoPicker({ value, onChange, disabled }: { value: ListingPhotos; onChange: (value: ListingPhotos) => void; disabled?: boolean }) {
  const [error, setError] = useState('');
  const select = (kind: 'logo' | 'cover' | 'gallery', files: File[]) => {
    if (!files.length) return;
    if (kind === 'gallery' && files.length + value.gallery.length > 20) { setError('Choose at most 20 gallery photos.'); return; }
    for (const file of files) { const message = validateImageFile(file); if (message) { setError(`${file.name}: ${message}`); return; } }
    setError('');
    onChange(kind === 'gallery' ? { ...value, gallery: [...value.gallery, ...files] } : { ...value, [kind]: files[0] });
  };
  return <fieldset disabled={disabled} className="space-y-5 rounded-2xl bg-ink-50 p-6 ring-1 ring-ink-200">
    <legend className="px-1 text-lg font-semibold">Business photos (optional)</legend>
    <p className="text-sm text-ink-700">Choose photos now and preview them before submitting. JPG, PNG or WEBP, up to 10 MB each.</p>
    {(['logo', 'cover', 'gallery'] as const).map(kind => <div key={kind} className="space-y-2">
      <label className="block text-sm font-medium">{kind === 'logo' ? 'Logo / business avatar' : kind === 'cover' ? 'Cover photo' : `Gallery (${value.gallery.length}/20)`}
        <input type="file" accept={ALLOWED_IMAGE_ACCEPT} multiple={kind === 'gallery'} onChange={event => { select(kind, Array.from(event.target.files ?? [])); event.target.value = ''; }} className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-primary-600" />
      </label>
      <div className="flex flex-wrap gap-3">{(kind === 'gallery' ? value.gallery : value[kind] ? [value[kind]!] : []).map((file, index) => <PhotoPreview key={`${file.name}-${index}`} file={file} disabled={disabled} onRemove={() => onChange(kind === 'gallery' ? { ...value, gallery: value.gallery.filter((_, i) => i !== index) } : { ...value, [kind]: undefined })} />)}</div>
    </div>)}
    {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
  </fieldset>;
}
