import { Injectable } from '@nestjs/common'

@Injectable()
export abstract class SimilarityService {
  abstract computeSimilarity(text1: string, text2: string): Promise<number>
}
