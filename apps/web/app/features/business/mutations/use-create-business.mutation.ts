'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CreateBusinessInput } from '@/features/business/schemas/create-business.schema';

interface CreateBusinessResponse {
  businessId: number;
  status: 'pending';
}

export function useCreateBusinessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBusinessInput) => {
      const payload = { ...input, email: input.email || undefined };
      const response = await apiClient.post('/businesses', payload);
      return response.data.data as CreateBusinessResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_BUSINESSES });
    },
  });
}
