'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/get-error-message';
import { locationSchema, LocationInput } from '@/features/business/schemas/location.schema';
import { useAddLocationMutation } from '@/features/business/mutations/use-add-location.mutation';
import { useRemoveLocationMutation } from '@/features/business/mutations/use-remove-location.mutation';
import { BusinessLocation } from '@/features/business/types/business.type';

interface LocationListProps {
  businessId: number;
  locations: BusinessLocation[];
  isOwner: boolean;
}

export function LocationList({ businessId, locations, isOwner }: LocationListProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const addLocationMutation = useAddLocationMutation();
  const removeLocationMutation = useRemoveLocationMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
  });

  const onAddLocation = async (input: LocationInput) => {
    try {
      await addLocationMutation.mutateAsync({ businessId, input });
      toast.success('Location added.');
      reset();
      setDialogOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to add location. Please try again.'));
    }
  };

  const onRemoveLocation = async (locationId: number) => {
    if (!window.confirm('Remove this location?')) return;

    try {
      await removeLocationMutation.mutateAsync({ businessId, locationId });
      toast.success('Location removed.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to remove location. Please try again.'));
    }
  };

  return (
    <div className="rounded-2xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-lg font-bold text-ink-900">Locations</h2>
        {isOwner ? (
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <Plus className="h-4 w-4" />
                Add location
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-sans text-lg font-bold text-ink-900">Add location</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onAddLocation)} className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Address"
                    className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    {...register('addressLine')}
                  />
                  {errors.addressLine?.message ? (
                    <p className="mt-1 text-xs text-red-600">{errors.addressLine.message}</p>
                  ) : null}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Ward"
                    className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    {...register('ward')}
                  />
                  {errors.ward?.message ? <p className="mt-1 text-xs text-red-600">{errors.ward.message}</p> : null}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Province"
                    className="w-full rounded-xl border border-ink-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    {...register('province')}
                  />
                  {errors.province?.message ? (
                    <p className="mt-1 text-xs text-red-600">{errors.province.message}</p>
                  ) : null}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting || addLocationMutation.isPending}>
                  {isSubmitting || addLocationMutation.isPending ? 'Adding...' : 'Add location'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <div className="space-y-3">
        {locations.map((location) => (
          <div
            key={location.locationId}
            className="flex items-start justify-between gap-3 rounded-lg border border-ink-200 p-3"
          >
            <div className="flex items-start gap-2 text-sm text-ink-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <span>
                {location.addressLine}, {location.ward}, {location.province}
              </span>
            </div>
            {isOwner ? (
              <button
                type="button"
                onClick={() => onRemoveLocation(location.locationId)}
                disabled={removeLocationMutation.isPending || locations.length <= 1}
                className="shrink-0 rounded-md p-1.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                title={locations.length <= 1 ? 'A business must have at least one location' : 'Remove location'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
