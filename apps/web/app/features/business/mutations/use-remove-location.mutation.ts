'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

interface RemoveLocationVariables {
  businessId: number;
  locationId: number;
}

export function useRemoveLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, locationId }: RemoveLocationVariables) => {
      await apiClient.delete(`/businesses/${businessId}/locations/${locationId}`);
    },
    onSuccess: (_data, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId) });
    },
  });
}
