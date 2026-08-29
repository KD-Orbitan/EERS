'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { updateProfileSchema, UpdateProfileInput } from '@/features/user/schemas/update-profile.schema';
import { UserProfile } from '@/features/user/types/user.type';

interface ProfileFormProps {
  profile: UserProfile;
  onSubmit: (data: UpdateProfileInput) => void | Promise<void>;
  isLoading?: boolean;
}

// Email is read-only here: PATCH /users/profile only accepts `name` (see
// UpdateProfileDto in apps/api) — there is no backend support for changing
// email, so it's shown for context but not editable.
export function ProfileForm({ profile, onSubmit, isLoading }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: profile.name },
  });

  const pending = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200 sm:p-8">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          type="text"
          className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          {...register('name')}
        />
        {errors.name?.message ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={profile.email}
          disabled
          title="Email cannot be changed"
          className="w-full cursor-not-allowed rounded-lg border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-500 outline-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Link href="/profile" className="text-sm font-medium text-ink-700 hover:text-primary-600">
          Cancel
        </Link>
      </div>
    </form>
  );
}
