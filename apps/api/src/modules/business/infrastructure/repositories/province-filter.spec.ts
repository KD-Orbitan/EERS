import { PrismaBusinessRepository } from './prisma-business.repository'

describe('Province business filter', () => {
  it.each(['Hồ Chí Minh', 'Thành phố Hồ Chí Minh', 'TP. Hồ Chí Minh'])('normalizes %s without interpolating user input into SQL', async (province) => {
    const query = jest.fn().mockResolvedValue([])
    const repository = new PrismaBusinessRepository({ $queryRawUnsafe: query } as any)
    await repository.getApprovedBusinessList({ province })
    expect(query).toHaveBeenCalledTimes(2)
    for (const [sql, param] of query.mock.calls) {
      expect(sql).toContain('regexp_replace(lower(trim(l.province))')
      expect(sql).toContain('= $1')
      expect(sql).not.toContain(province)
      expect(param).toBe('hồ chí minh')
    }
  })
})
