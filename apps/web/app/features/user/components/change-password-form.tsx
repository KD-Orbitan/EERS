'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { changePasswordSchema, ChangePasswordInput } from '@/features/user/schemas/change-password.schema';

interface ChangePasswordFormProps {
  onSubmit: (data: ChangePasswordInput) => void | Promise<void>;
  isLoading?: boolean;
}

export function ChangePasswordForm({ onSubmit, isLoading }: ChangePasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const pending = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200 sm:p-8">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="currentPassword">
          Current Password
        </label>
        <PasswordInput
          id="currentPassword"
          className="text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          {...register('currentPassword')}
        />
        {errors.currentPassword?.message ? (
          <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="newPassword">
          New Password
        </label>
        <PasswordInput
          id="newPassword"
          className="text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          {...register('newPassword')}
        />
        {errors.newPassword?.message ? <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="confirmPassword">
          Confirm New Password
        </label>
        <PasswordInput
          id="confirmPassword"
          className="text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword?.message ? (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <p className="text-xs text-ink-500">
        Changing your password will sign you out of all devices, including this one.
      </p>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Changing...' : 'Change Password'}
        </Button>
        <Link href="/profile" className="text-sm font-medium text-ink-700 hover:text-primary-600">
          Cancel
        </Link>
      </div>
    </form>
  );
}
