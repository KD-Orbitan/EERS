'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAuth } from '@/hooks/use-auth';
import { useChangePasswordMutation } from '@/features/user/mutations/use-change-password.mutation';
import { ChangePasswordForm } from '@/features/user/components/change-password-form';
import { ChangePasswordInput } from '@/features/user/schemas/change-password.schema';

// "Change Password" profile tab. Backend revokes all refresh tokens on a
// successful change (see ChangePasswordUseCase), so the current session is
// dead too — logout() + redirect to /login is unavoidable here, unlike the
// other tabs which just stay in place after submitting.
export function ProfileChangePasswordPanel() {
  const router = useRouter();
  const { logout } = useAuth();
  const changePasswordMutation = useChangePasswordMutation();

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      await changePasswordMutation.mutateAsync(data);
      toast.success('Password changed. Please sign in again.');
      await logout();
      router.push('/login');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to change password. Please try again.'));
    }
  };

  return (
    <>
      <h2 className="mb-6 font-sans text-lg font-bold text-ink-900">Change Password</h2>
      <ChangePasswordForm onSubmit={onSubmit} isLoading={changePasswordMutation.isPending} />
    </>
  );
}
