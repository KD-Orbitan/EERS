'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useUserProfileQuery } from '@/features/user/queries/use-user-profile.query';
import { useUpdateProfileMutation } from '@/features/user/mutations/use-update-profile.mutation';
import { ProfileForm } from '@/features/user/components/profile-form';
import { UpdateProfileInput } from '@/features/user/schemas/update-profile.schema';

export default function EditProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading } = useUserProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      toast.success('Profile updated.');
      router.push('/profile');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to update profile. Please try again.'));
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading...</p>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 font-serif text-3xl font-bold text-ink-900">Edit Profile</h1>
        <ProfileForm profile={profile} onSubmit={onSubmit} isLoading={updateProfileMutation.isPending} />
      </div>
    </main>
  );
}
