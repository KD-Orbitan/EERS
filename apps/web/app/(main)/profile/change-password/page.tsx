'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAuth } from '@/hooks/use-auth';
import { useChangePasswordMutation } from '@/features/user/mutations/use-change-password.mutation';
import { ChangePasswordForm } from '@/features/user/components/change-password-form';
import { ChangePasswordInput } from '@/features/user/schemas/change-password.schema';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const changePasswordMutation = useChangePasswordMutation();

  // Backend revokes all refresh tokens on a successful password change (see
  // ChangePasswordUseCase), so the current session is dead too. Calling
  // logout() (not just clearing client state) matters here: it hits
  // POST /auth/logout, which clears the refreshToken cookie server-side —
  // without that, the stale cookie is still present and middleware bounces
  // /login back to / because it only checks cookie presence, not validity.
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
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 font-serif text-3xl font-bold text-ink-900">Change Password</h1>
        <ChangePasswordForm onSubmit={onSubmit} isLoading={changePasswordMutation.isPending} />
      </div>
    </main>
  );
}
