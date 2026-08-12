import { z } from 'zod';

export const rankingTrendConfigSchema = z.object({
  period: z.enum(['DAY', 'WEEK', 'MONTH']),
});

export type RankingTrendConfigInput = z.infer<typeof rankingTrendConfigSchema>;
