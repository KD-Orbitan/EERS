'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { UpdateBusinessInput } from '@/features/business/schemas/update-business.schema';

interface UpdateBusinessResponse {
  businessId: number;
}

export function useUpdateBusinessMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBusinessInput) => {
      const payload = { ...input, email: input.email || undefined };
      const response = await apiClient.patch(`/businesses/${businessId}`, payload);
      return response.data.data as UpdateBusinessResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_BUSINESSES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId) });
    },
  });
}
