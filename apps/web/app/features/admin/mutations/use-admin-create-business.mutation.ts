'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CreateBusinessInput } from '@/features/business/schemas/create-business.schema';

interface AdminCreateBusinessResponse {
  businessId: number;
  status: 'approved';
}

// Admin-created businesses are auto-approved with no owner (see
// docs/API.md "POST /admin/businesses") — distinct from the public
// POST /businesses flow (use-create-business.mutation.ts), which creates a
// pending business owned by the submitting user.
export function useAdminCreateBusinessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBusinessInput) => {
      const payload = { ...input, email: input.email || undefined };
      const response = await apiClient.post('/admin/businesses', payload);
      return response.data.data as AdminCreateBusinessResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_BUSINESSES });
    },
  });
}
