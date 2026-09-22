'use client';

import { useState } from 'react';
import { ListingPhotoPicker, emptyListingPhotos, type ListingPhotos } from './listing-photo-picker';
import { OpeningHoursInput, PriceRangeInput, AmenitiesInput } from './business-profile-inputs';
import { DescriptionEditor } from './description-editor';
import { ProvinceSelect } from './province-select';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategoriesQuery } from '@/features/business/queries/use-categories.query';
import { createBusinessSchema, CreateBusinessInput } from '@/features/business/schemas/create-business.schema';
import { updateBusinessSchema, UpdateBusinessInput } from '@/features/business/schemas/update-business.schema';
import { BusinessDetail } from '@/features/business/types/business.type';

interface BusinessFormValues {
  name: string;
  description?: string;
  website?: string;
  openingHours?: string;
  services?: string;
  priceRange?: string;
  amenities?: string;

  phone: string;
  email?: string;
  categoryIds: number[];
  locations: { addressLine: string; ward: string; province: string }[];
}

type CreateBusinessFormProps =
  | {
      // 'create' (default) = public "list your business" flow, resulting in
      // a pending business owned by the submitter; 'admin-create' = same
      // fields, but the caller wires onSubmit to the admin endpoint, which
      // creates an auto-approved, unclaimed business instead. The two share
      // this branch of the union because their payload shape and rendered
      // fields are identical — only the submit target (chosen by the page)
      // and the button label differ.
      mode?: 'create' | 'admin-create';
      initialData?: undefined;
      isLoading?: boolean;
      onSubmit: (data: CreateBusinessInput, photos: ListingPhotos) => void | Promise<void>;
      onCancel?: () => void;
    }
  | {
      mode?: 'edit';
      initialData: BusinessDetail;
      isLoading?: boolean;
      onSubmit: (data: UpdateBusinessInput) => void | Promise<void>;
      onCancel?: () => void;
    };

export function CreateBusinessForm({ mode, initialData, isLoading, onSubmit, onCancel }: CreateBusinessFormProps) {
  const [photos, setPhotos] = useState<ListingPhotos>(emptyListingPhotos);
  const isEditMode = Boolean(initialData);
  const isAdminCreate = mode === 'admin-create';
  const { data: categories } = useCategoriesQuery();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessFormValues>({
    resolver: isEditMode
      ? (zodResolver(updateBusinessSchema) as never)
      : (zodResolver(createBusinessSchema) as never),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      website: initialData?.website ?? '',
      openingHours: initialData?.openingHours ?? '',
      services: initialData?.services ?? '',
      priceRange: initialData?.priceRange ?? '',
      amenities: initialData?.amenities ?? '',

      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      categoryIds: initialData?.categories.map((category) => category.categoryId) ?? [],
      locations: initialData?.locations.map((location) => ({
        addressLine: location.addressLine,
        ward: location.ward,
        province: location.province,
      })) ?? [{ addressLine: '', ward: '', province: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'locations' });

  const submitHandler = handleSubmit((values) => {
    if (isEditMode) {
      const payload: UpdateBusinessInput = {
        name: values.name,
        description: values.description,
      website: values.website,
      openingHours: values.openingHours,
      services: values.services,
      priceRange: values.priceRange,
      amenities: values.amenities,

        phone: values.phone,
        email: values.email,
      };
      return (onSubmit as (data: UpdateBusinessInput) => void | Promise<void>)(payload);
    }

    const payload: CreateBusinessInput = {
      name: values.name,
      description: values.description,
      website: values.website,
      openingHours: values.openingHours,
      services: values.services,
      priceRange: values.priceRange,
      amenities: values.amenities,

      phone: values.phone,
      email: values.email,
      categoryIds: values.categoryIds,
      locations: values.locations,
    };
    return (onSubmit as (data: CreateBusinessInput, photos: ListingPhotos) => void | Promise<void>)(payload, photos);
  });

  const busy = isSubmitting || isLoading;

  return (
    <form onSubmit={submitHandler} className="space-y-6">
      <div className="space-y-4 rounded-2xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="name">
            Business name
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            {...register('name')}
          />
          {errors.name?.message ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="description">
            Description
          </label>
          <p id="description-help" className="mb-2 text-sm text-ink-500">Write your business story with headings, lists and links. It appears in the About section below your cover.</p>
          <Controller control={control} name="description" render={({ field }) => (
            <DescriptionEditor value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} disabled={busy} invalid={Boolean(errors.description)} />
          )} />
          <p id="description-error" role={errors.description ? 'alert' : undefined} className="mt-1 text-sm text-red-600">{errors.description?.message}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              type="text"
              className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              {...register('phone')}
            />
            {errors.phone?.message ? <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              {...register('email')}
            />
            {errors.email?.message ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
          </div>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
        <h2 className="font-semibold text-ink-900">More about your business</h2>
        <p className="text-sm text-ink-700">Optional details that help customers plan their visit.</p>
        <div>
          <label htmlFor="website" className="mb-1 block text-sm font-medium text-ink-700">Website</label>
          <textarea id="website" rows={1} maxLength={500} placeholder="https://example.com" className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm" {...register('website')} />
          {errors.website?.message ? <p className="mt-1 text-sm text-red-600">{errors.website.message}</p> : null}
        </div>
        <div>
          <Controller control={control} name="openingHours" render={({ field }) => <OpeningHoursInput value={field.value ?? ''} onChange={field.onChange} disabled={busy} />} />
          {errors.openingHours?.message ? <p className="mt-1 text-sm text-red-600">{errors.openingHours.message}</p> : null}
        </div>
        <div>
          <label htmlFor="services" className="mb-1 block text-sm font-medium text-ink-700">Products and services</label>
          <textarea id="services" rows={3} maxLength={2000} placeholder="Describe your main products or services" className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm" {...register('services')} />
          {errors.services?.message ? <p className="mt-1 text-sm text-red-600">{errors.services.message}</p> : null}
        </div>
        <div>
          <Controller control={control} name="priceRange" render={({ field }) => <PriceRangeInput value={field.value ?? ''} onChange={field.onChange} disabled={busy} />} />
          {errors.priceRange?.message ? <p className="mt-1 text-sm text-red-600">{errors.priceRange.message}</p> : null}
        </div>
        <div>
          <Controller control={control} name="amenities" render={({ field }) => <AmenitiesInput value={field.value ?? ''} onChange={field.onChange} disabled={busy} />} />
          {errors.amenities?.message ? <p className="mt-1 text-sm text-red-600">{errors.amenities.message}</p> : null}
        </div>
      </section>

      {!isEditMode ? (
        <div className="rounded-2xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
          <h2 className="mb-3 text-sm font-medium text-ink-700">Categories</h2>
          <Controller
            control={control}
            name="categoryIds"
            render={({ field }) => (
              <div className="flex flex-wrap gap-3">
                {categories?.map((category) => {
                  const checked = field.value?.includes(category.categoryId) ?? false;
                  return (
                    <label
                      key={category.categoryId}
                      className="inline-flex items-center gap-2 rounded-lg border border-ink-300 px-3 py-1.5 text-sm text-ink-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...(field.value ?? []), category.categoryId]
                            : (field.value ?? []).filter((id) => id !== category.categoryId);
                          field.onChange(next);
                        }}
                      />
                      {category.categoryName}
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.categoryIds?.message ? (
            <p className="mt-2 text-sm text-red-600">{errors.categoryIds.message}</p>
          ) : null}
        </div>
      ) : null}

      {!isEditMode ? (
        <div className="rounded-2xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink-700">Locations</h2>
            <button
              type="button"
              onClick={() => append({ addressLine: '', ward: '', province: '' })}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add location
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((locationField, index) => (
              <div key={locationField.id} className="rounded-lg border border-ink-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-500">Location {index + 1}</span>
                  {fields.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Address"
                      className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                      {...register(`locations.${index}.addressLine` as const)}
                    />
                    {errors.locations?.[index]?.addressLine?.message ? (
                      <p className="mt-1 text-xs text-red-600">{errors.locations[index]?.addressLine?.message}</p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Ward"
                      className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                      {...register(`locations.${index}.ward` as const)}
                    />
                    {errors.locations?.[index]?.ward?.message ? (
                      <p className="mt-1 text-xs text-red-600">{errors.locations[index]?.ward?.message}</p>
                    ) : null}
                  </div>
                  <div>
                    <ProvinceSelect
                      legacyValue={fields[index].province}
                      className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                      {...register(`locations.${index}.province` as const)}
                    />
                    {errors.locations?.[index]?.province?.message ? (
                      <p className="mt-1 text-xs text-red-600">{errors.locations[index]?.province?.message}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.locations?.message ? <p className="mt-2 text-sm text-red-600">{errors.locations.message}</p> : null}
        </div>
      ) : null}

      {!isEditMode ? <ListingPhotoPicker value={photos} onChange={setPhotos} disabled={busy} /> : null}

      <div className="flex justify-end gap-3">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving...' : isEditMode ? 'Save changes' : isAdminCreate ? 'Add business' : 'Submit business'}
        </Button>
      </div>
    </form>
  );
}
