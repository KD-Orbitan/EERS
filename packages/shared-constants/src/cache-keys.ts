export const CACHE_KEYS = {
  RANKING_GLOBAL: 'ranking:global',
  RANKING_CATEGORY: (id: number) => `ranking:category:${id}`,
  RANKING_PROVINCE: (name: string) => `ranking:province:${name}`,
  BUSINESS_DETAIL: (id: number) => `business:${id}`,
} as const
