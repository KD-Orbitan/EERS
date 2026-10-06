import { RankingDbService } from '../infrastructure/services/ranking-db.service'
import { RankingSnapshotWrite } from '../application/ports/ranking.repository'
import { PrismaService } from '../../../infrastructure/database/prisma.service'

describe('Ranking snapshot persistence', () => {
  const snapshot: RankingSnapshotWrite = {
    businessId: 7, scope: 'GLOBAL', scopeId: null, rank: 1,
    rankingScore: 73.678, avgRating: 4, reviewCount: 10,
  }

  function setup() {
    const tx = {
      rankingSnapshot: { deleteMany: jest.fn(), createMany: jest.fn() },
      rankingSnapshotHistory: { createMany: jest.fn(), deleteMany: jest.fn() },
    }
    const prisma = { $transaction: jest.fn(async (callback) => callback(tx)) }
    const repository = new RankingDbService(prisma as unknown as PrismaService)
    return { tx, prisma, repository }
  }

  it('replaces every scope and appends only GLOBAL history in the same transaction', async () => {
    const { tx, prisma, repository } = setup()
    const cutoff = new Date('2026-01-01')
    await repository.replaceSnapshotsWithHistory([
      snapshot, { ...snapshot, scope: 'CATEGORY', scopeId: 3 }, { ...snapshot, scope: 'PROVINCE' },
    ], cutoff)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(tx.rankingSnapshot.deleteMany).toHaveBeenCalledWith({})
    expect(tx.rankingSnapshot.createMany).toHaveBeenCalledWith({ data: [
      { ...snapshot, businessId: 7n, rankingScore: 73.68 },
      { ...snapshot, businessId: 7n, rankingScore: 73.68, scope: 'CATEGORY', scopeId: 3n },
      { ...snapshot, businessId: 7n, rankingScore: 73.68, scope: 'PROVINCE' },
    ] })
    expect(tx.rankingSnapshotHistory.createMany).toHaveBeenCalledWith({ data: [{ businessId: 7n, rank: 1, rankingScore: 73.68 }] })
    expect(tx.rankingSnapshotHistory.deleteMany).toHaveBeenCalledWith({ where: { calculatedAt: { lt: cutoff } } })
  })

  it('propagates a history write failure to the transaction caller', async () => {
    const { tx, repository } = setup()
    tx.rankingSnapshotHistory.createMany.mockRejectedValue(new Error('history unavailable'))
    await expect(repository.replaceSnapshotsWithHistory([snapshot], new Date())).rejects.toThrow('history unavailable')
    expect(tx.rankingSnapshotHistory.deleteMany).not.toHaveBeenCalled()
  })
})
