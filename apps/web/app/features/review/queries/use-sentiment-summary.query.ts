'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { SentimentSummary } from '@/features/review/types/sentiment.type';

export function useSentimentSummaryQuery(businessId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_SENTIMENT_SUMMARY(businessId ?? 0),
    queryFn: async (): Promise<SentimentSummary> => {
      const response = await apiClient.get(`/businesses/${businessId}/sentiment-summary`);
      return response.data.data as SentimentSummary;
    },
    enabled: typeof businessId === 'number' && Number.isFinite(businessId),
    staleTime: 60_000,
    retry: 1,
  });
}
