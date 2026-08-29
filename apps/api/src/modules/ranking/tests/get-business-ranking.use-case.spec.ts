import { GetBusinessRankingUseCase } from '../application/use-cases/get-business-ranking.use-case'
import { RankingTrendConfigService } from '../infrastructure/services/ranking-trend-config.service'
import { PrismaService } from '../../../infrastructure/database/prisma.service'

describe('GetBusinessRankingUseCase', () => {
  let prisma: { rankingSnapshot: { findFirst: jest.Mock }; rankingSnapshotHistory: { findFirst: jest.Mock } }
  let rankingTrendConfigService: jest.Mocked<Pick<RankingTrendConfigService, 'getPeriod' | 'periodToDays' | 'getBaselines'>>
  let useCase: GetBusinessRankingUseCase

  beforeEach(() => {
    prisma = {
      rankingSnapshot: { findFirst: jest.fn() },
      rankingSnapshotHistory: { findFirst: jest.fn() },
    }
    rankingTrendConfigService = {
      getPeriod: jest.fn().mockResolvedValue('WEEK'),
      periodToDays: jest.fn().mockReturnValue(7),
      getBaselines: jest.fn(),
    }
    useCase = new GetBusinessRankingUseCase(
      prisma as unknown as PrismaService,
      rankingTrendConfigService as unknown as RankingTrendConfigService,
    )
  })

  it('returns null when the business has no GLOBAL ranking snapshot', async () => {
    prisma.rankingSnapshot.findFirst.mockResolvedValue(null)

    await expect(useCase.execute(1)).resolves.toBeNull()
    expect(prisma.rankingSnapshotHistory.findFirst).not.toHaveBeenCalled()
  })

  it('returns trend=null when there is no history baseline yet', async () => {
    prisma.rankingSnapshot.findFirst.mockResolvedValue({ rank: 3, rankingScore: 4.2 })
    rankingTrendConfigService.getBaselines.mockResolvedValue(new Map())

    const result = await useCase.execute(1)

    expect(result).toEqual({ rank: 3, rankingScore: 4.2, trend: null })
  })

  it('computes rankChange and scoreChange from the closest history row at/before the lookback cutoff', async () => {
    prisma.rankingSnapshot.findFirst.mockResolvedValue({ rank: 2, rankingScore: 4.5 })
    rankingTrendConfigService.getBaselines.mockResolvedValue(new Map([[1, { rank: 5, rankingScore: 4.1 }]]))

    const result = await useCase.execute(1)

    // moved from rank 5 to rank 2 => improved by 3 positions
    expect(result).toEqual({
      rank: 2,
      rankingScore: 4.5,
      trend: { period: 'WEEK', rankChange: 3, scoreChange: 0.4 },
    })
  })
})
