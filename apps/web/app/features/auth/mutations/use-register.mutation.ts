'use client';

import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { RegisterInput } from '@/features/auth/schemas/auth.schema';

interface RegisterResponse {
  userId: number;
  name: string;
  email: string;
  role: 'USER';
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { confirmPassword: _confirmPassword, ...payload } = input;
      const response = await apiClient.post('/auth/register', payload);
      return response.data.data as RegisterResponse;
    },
  });
}
