'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { LocationInput } from '@/features/business/schemas/location.schema';

interface AddLocationVariables {
  businessId: number;
  input: LocationInput;
}

interface CreateLocationResponse {
  locationId: number;
}

export function useAddLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, input }: AddLocationVariables) => {
      const response = await apiClient.post(`/businesses/${businessId}/locations`, input);
      return response.data.data as CreateLocationResponse;
    },
    onSuccess: (_data, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId) });
    },
  });
}
