import { GetBusinessRankingUseCase } from '../application/use-cases/get-business-ranking.use-case'
import { RankingTrendConfigService } from '../infrastructure/services/ranking-trend-config.service'
import { RankingQueryRepository } from '../application/ports/ranking-query.repository'

describe('GetBusinessRankingUseCase', () => {
  let repository: jest.Mocked<Pick<RankingQueryRepository, 'getBusinessGlobalRanking'>>
  let rankingTrendConfigService: jest.Mocked<Pick<RankingTrendConfigService, 'getPeriod' | 'periodToDays' | 'getBaselines'>>
  let useCase: GetBusinessRankingUseCase

  beforeEach(() => {
    repository = { getBusinessGlobalRanking: jest.fn() }
    rankingTrendConfigService = {
      getPeriod: jest.fn().mockResolvedValue('WEEK'),
      periodToDays: jest.fn().mockReturnValue(7),
      getBaselines: jest.fn(),
    }
    useCase = new GetBusinessRankingUseCase(
      repository as unknown as RankingQueryRepository,
      rankingTrendConfigService as unknown as RankingTrendConfigService,
    )
  })

  it('returns null when the business has no GLOBAL ranking snapshot', async () => {
    repository.getBusinessGlobalRanking.mockResolvedValue(null)

    await expect(useCase.execute(1)).resolves.toBeNull()
    expect(rankingTrendConfigService.getBaselines).not.toHaveBeenCalled()
  })

  it('returns trend=null when there is no history baseline yet', async () => {
    repository.getBusinessGlobalRanking.mockResolvedValue({ rank: 3, rankingScore: 4.2 })
    rankingTrendConfigService.getBaselines.mockResolvedValue(new Map())

    const result = await useCase.execute(1)

    expect(result).toEqual({ rank: 3, rankingScore: 4.2, trend: null })
  })

  it('computes rankChange and scoreChange from the closest history row at/before the lookback cutoff', async () => {
    repository.getBusinessGlobalRanking.mockResolvedValue({ rank: 2, rankingScore: 4.5 })
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
