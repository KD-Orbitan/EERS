'use client';

import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ChangePasswordInput } from '@/features/user/schemas/change-password.schema';

interface ChangePasswordResponse {
  message: string;
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const response = await apiClient.patch('/users/change-password', {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });
      return response.data.data as ChangePasswordResponse;
    },
  });
}
