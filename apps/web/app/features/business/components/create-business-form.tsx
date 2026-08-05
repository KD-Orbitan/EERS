'use client';

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
  phone: string;
  email?: string;
  categoryIds: number[];
  locations: { addressLine: string; ward: string; province: string }[];
}

type CreateBusinessFormProps =
  | {
      initialData?: undefined;
      isLoading?: boolean;
      onSubmit: (data: CreateBusinessInput) => void | Promise<void>;
      onCancel?: () => void;
    }
  | {
      initialData: BusinessDetail;
      isLoading?: boolean;
      onSubmit: (data: UpdateBusinessInput) => void | Promise<void>;
      onCancel?: () => void;
    };

export function CreateBusinessForm({ initialData, isLoading, onSubmit, onCancel }: CreateBusinessFormProps) {
  const isEditMode = Boolean(initialData);
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
        phone: values.phone,
        email: values.email,
      };
      return (onSubmit as (data: UpdateBusinessInput) => void | Promise<void>)(payload);
    }

    const payload: CreateBusinessInput = {
      name: values.name,
      description: values.description,
      phone: values.phone,
      email: values.email,
      categoryIds: values.categoryIds,
      locations: values.locations,
    };
    return (onSubmit as (data: CreateBusinessInput) => void | Promise<void>)(payload);
  });

  const busy = isSubmitting || isLoading;

  return (
    <form onSubmit={submitHandler} className="space-y-6">
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
            Business name
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            {...register('name')}
          />
          {errors.name?.message ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              {...register('phone')}
            />
            {errors.phone?.message ? <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              {...register('email')}
            />
            {errors.email?.message ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
          </div>
        </div>
      </div>

      {!isEditMode ? (
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Categories</h2>
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
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
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
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">Locations</h2>
            <button
              type="button"
              onClick={() => append({ addressLine: '', ward: '', province: '' })}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add location
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((locationField, index) => (
              <div key={locationField.id} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Location {index + 1}</span>
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
                      className="w-full rounded-xl border border-slate-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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
                      className="w-full rounded-xl border border-slate-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                      {...register(`locations.${index}.ward` as const)}
                    />
                    {errors.locations?.[index]?.ward?.message ? (
                      <p className="mt-1 text-xs text-red-600">{errors.locations[index]?.ward?.message}</p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Province"
                      className="w-full rounded-xl border border-slate-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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

      <div className="flex justify-end gap-3">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving...' : isEditMode ? 'Save changes' : 'Create business'}
        </Button>
      </div>
    </form>
  );
}
