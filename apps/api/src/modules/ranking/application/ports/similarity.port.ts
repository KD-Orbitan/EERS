export abstract class SimilarityPort {
  abstract computeSimilarity(text1: string, text2: string): Promise<number>
}
