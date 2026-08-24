'use client';

import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useUserProfileQuery } from '@/features/user/queries/use-user-profile.query';
import { useUpdateProfileMutation } from '@/features/user/mutations/use-update-profile.mutation';
import { ProfileForm } from '@/features/user/components/profile-form';
import { UpdateProfileInput } from '@/features/user/schemas/update-profile.schema';

// "Edit Profile" profile tab. Stays on the same tab after a successful
// save — no router.push needed since useUpdateProfileMutation already
// invalidates USER_PROFILE/AUTH_ME, so this form and the ProfileHeader
// stats card both pick up the new data reactively.
export function ProfileEditPanel() {
  const { data: profile, isLoading } = useUserProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      toast.success('Profile updated.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to update profile. Please try again.'));
    }
  };

  if (isLoading) {
    return <p className="text-sm text-ink-700">Loading...</p>;
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <h2 className="mb-6 font-sans text-lg font-bold text-ink-900">Edit Profile</h2>
      <ProfileForm profile={profile} onSubmit={onSubmit} isLoading={updateProfileMutation.isPending} />
    </>
  );
}
