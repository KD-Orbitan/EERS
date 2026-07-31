import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { SimilarityService } from './similarity.service'

@Injectable()
export class PgTrgmSimilarityService extends SimilarityService {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async computeSimilarity(text1: string, text2: string): Promise<number> {
    const result = await this.prisma.$queryRaw<{ score: number }[]>`
      SELECT similarity(${text1}, ${text2}) as score
    `
    return result?.[0]?.score ?? 0
  }
}
